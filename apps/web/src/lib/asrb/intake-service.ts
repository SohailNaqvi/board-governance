import { createHash, randomBytes, createHmac } from "crypto";
import prisma from "../prisma";
import logger from "../logger";
import { generateReceiptReference } from "./receipt";
import { FeederClientContext } from "./api-key-auth";
import {
  MockStudentReader,
  MockSupervisorReader,
  MockASRBResolutionReader,
} from "@ums/source-data";
import type { CaseIntakeEnvelope } from "./schemas";

const UPLOAD_TOKEN_EXPIRY_MINUTES = 60;
const UPLOAD_HMAC_SECRET = process.env.UPLOAD_HMAC_SECRET || "dev-secret-key";

interface SubmitCaseInput {
  envelope: CaseIntakeEnvelope;
  feederClient: FeederClientContext;
}

interface UploadUrlInfo {
  attachmentId: string;
  uploadUrl: string;
  uploadToken: string;
  expiresAt: string;
}

interface CaseSubmissionResult {
  caseId: string;
  status: string;
  receiptReference: string;
  receivedAt: string;
  uploadUrls: UploadUrlInfo[];
}

function hashPayload(payload: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

function generateUploadToken(attachmentId: string): {
  token: string;
  expiry: Date;
} {
  const expiryDate = new Date(
    Date.now() + UPLOAD_TOKEN_EXPIRY_MINUTES * 60 * 1000
  );
  const tokenData = `${attachmentId}:${expiryDate.toISOString()}`;
  const signature = createHmac("sha256", UPLOAD_HMAC_SECRET)
    .update(tokenData)
    .digest("hex");
  const token = `${tokenData}:${signature}`;

  return { token, expiry: expiryDate };
}

export function verifyUploadToken(token: string): {
  valid: boolean;
  attachmentId?: string;
} {
  try {
    const parts = token.split(":");
    if (parts.length !== 3) return { valid: false };

    const [attachmentId, expiryStr, signature] = parts;
    const expiry = new Date(expiryStr);

    // Check expiry
    if (expiry < new Date()) {
      return { valid: false };
    }

    // Verify signature
    const tokenData = `${attachmentId}:${expiryStr}`;
    const expectedSignature = createHmac("sha256", UPLOAD_HMAC_SECRET)
      .update(tokenData)
      .digest("hex");

    if (signature !== expectedSignature) {
      return { valid: false };
    }

    return { valid: true, attachmentId };
  } catch (error) {
    logger.error(
      { error },
      "Error verifying upload token"
    );
    return { valid: false };
  }
}

async function checkIdempotency(
  feederClientId: string,
  idempotencyKey: string,
  payloadHash: string
): Promise<{ isDuplicate: boolean; existingCaseId?: string; conflict?: boolean }> {
  const existing = await prisma.aSRBCase.findFirst({
    where: {
      feederClientId,
      idempotencyKey,
    },
  });

  if (!existing) {
    return { isDuplicate: false };
  }

  // Check if payload matches
  const existingPayloadHash = hashPayload(existing.casePayload);

  if (existingPayloadHash === payloadHash) {
    // Same payload: idempotent response
    return { isDuplicate: true, existingCaseId: existing.id };
  } else {
    // Different payload: conflict
    return { isDuplicate: true, conflict: true };
  }
}

async function validateReferences(envelope: CaseIntakeEnvelope): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  const studentReader = new MockStudentReader();
  const supervisorReader = new MockSupervisorReader();
  const resolutionReader = new MockASRBResolutionReader();

  // Validate student reference if provided
  if (envelope.student_ref) {
    const student = await studentReader.getByRegistrationNumber(
      envelope.student_ref
    );
    if (!student) {
      errors.push(`Student with registration number ${envelope.student_ref} not found`);
    }
  }

  // Validate supervisor reference if provided
  if (envelope.supervisor_ref) {
    const supervisor = await supervisorReader.getByEmployeeId(
      envelope.supervisor_ref
    );
    if (!supervisor) {
      errors.push(`Supervisor with employee ID ${envelope.supervisor_ref} not found`);
    }
  }

  // Validate feeder resolution reference if provided
  if (envelope.feeder_resolution_ref) {
    const resolutions = await resolutionReader.getByBodyCode(
      envelope.feeder_resolution_ref.body_code
    );
    const found = resolutions.some(
      (r) => r.resolutionNumber === envelope.feeder_resolution_ref?.resolution_number
    );
    if (!found) {
      errors.push(
        `Resolution ${envelope.feeder_resolution_ref.resolution_number} from body ${envelope.feeder_resolution_ref.body_code} not found`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function submitCase(
  input: SubmitCaseInput
): Promise<CaseSubmissionResult> {
  const { envelope, feederClient } = input;

  // Step 1: Validate references
  const referenceValidation = await validateReferences(envelope);
  if (!referenceValidation.valid) {
    throw new Error(`Reference validation failed: ${referenceValidation.errors.join("; ")}`);
  }

  // Step 2: Check idempotency
  const payloadHash = hashPayload(envelope.case_payload);
  const idempotencyCheck = await checkIdempotency(
    feederClient.id,
    envelope.idempotency_key,
    payloadHash
  );

  if (idempotencyCheck.isDuplicate && idempotencyCheck.existingCaseId) {
    if (idempotencyCheck.conflict) {
      throw new Error("CONFLICT: Different payload with same idempotency key");
    }
    // Return the existing case
    const existingCase = await prisma.aSRBCase.findUnique({
      where: { id: idempotencyCheck.existingCaseId },
      include: { attachments: true },
    });

    if (!existingCase) {
      throw new Error("Existing case not found");
    }

    return {
      caseId: existingCase.id,
      status: existingCase.status,
      receiptReference: existingCase.receiptReference,
      receivedAt: existingCase.receivedAt.toISOString(),
      uploadUrls: existingCase.attachments
        .filter((a) => !a.uploaded)
        .map((a) => ({
          attachmentId: a.id,
          uploadUrl: `/api/asrb/attachments/${a.id}/upload`,
          uploadToken: a.uploadToken || "",
          expiresAt: a.uploadExpiry?.toISOString() || "",
        })),
    };
  }

  // Step 3: Generate receipt reference
  const receiptReference = await generateReceiptReference();

  // Step 4: Create case and attachments in a transaction
  const createdCase = await prisma.aSRBCase.create({
    data: {
      caseType: envelope.case_type,
      status: "RECEIVED",
      urgency: envelope.urgency,
      receiptReference,
      idempotencyKey: envelope.idempotency_key,
      feederClientId: feederClient.id,
      feederBodyType: feederClient.feederBodyType as any,
      feederBodyCode: feederClient.feederBodyCode,
      feederResolutionBody: envelope.feeder_resolution_ref?.body_code,
      feederResolutionNum: envelope.feeder_resolution_ref?.resolution_number?.toString(),
      feederResolutionDate: envelope.feeder_resolution_ref?.resolution_date
        ? new Date(envelope.feeder_resolution_ref.resolution_date)
        : undefined,
      studentRegNo: envelope.student_ref,
      supervisorEmpId: envelope.supervisor_ref,
      programmeCode: envelope.programme_ref,
      casePayload: JSON.stringify(envelope.case_payload),
      attachments: {
        create: envelope.attachments.map((attachment) => {
          const { token, expiry } = generateUploadToken(randomBytes(12).toString("hex"));
          return {
            filename: attachment.filename,
            mimeType: attachment.mime_type,
            sizeBytes: attachment.size_bytes,
            docType: attachment.doc_type,
            uploadToken: token,
            uploadExpiry: expiry,
            uploaded: false,
          };
        }),
      },
      auditEvents: {
        create: {
          eventType: "CASE_SUBMITTED",
          actorId: feederClient.id,
          payloadHash,
          details: JSON.stringify({
            caseType: envelope.case_type,
            attachmentCount: envelope.attachments.length,
          }),
        },
      },
    },
    include: { attachments: true },
  });

  logger.info(
    {
      caseId: createdCase.id,
      receiptReference,
      feederClientId: feederClient.id,
    },
    "Case submitted successfully"
  );

  return {
    caseId: createdCase.id,
    status: createdCase.status,
    receiptReference: createdCase.receiptReference,
    receivedAt: createdCase.receivedAt.toISOString(),
    uploadUrls: createdCase.attachments.map((attachment) => ({
      attachmentId: attachment.id,
      uploadUrl: `/api/asrb/attachments/${attachment.id}/upload`,
      uploadToken: attachment.uploadToken || "",
      expiresAt: attachment.uploadExpiry?.toISOString() || "",
    })),
  };
}

export async function getCaseStatus(
  caseId: string,
  feederClientId: string
): Promise<{
  caseId: string;
  status: string;
  receivedAt: string;
  lastTransitionAt: string;
  receiptReference: string;
}> {
  const asrbCase = await prisma.aSRBCase.findUnique({
    where: { id: caseId },
  });

  if (!asrbCase) {
    throw new Error("Case not found");
  }

  // Verify feeder client ownership
  if (asrbCase.feederClientId !== feederClientId) {
    throw new Error("Unauthorized: case does not belong to this feeder client");
  }

  return {
    caseId: asrbCase.id,
    status: asrbCase.status,
    receivedAt: asrbCase.receivedAt.toISOString(),
    lastTransitionAt: asrbCase.lastTransitionAt.toISOString(),
    receiptReference: asrbCase.receiptReference,
  };
}
