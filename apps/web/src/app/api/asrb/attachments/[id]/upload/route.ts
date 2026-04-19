import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import prisma from "../../../../../../lib/prisma";
import { verifyUploadToken } from "../../../../../../lib/asrb/intake-service";
import logger from "../../../../../../lib/logger";

interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
}

function createProblemDetail(
  status: number,
  title: string,
  detail: string
): ProblemDetail {
  return {
    type: `https://api.asrb.university.edu/problems/${status}`,
    title,
    status,
    detail,
  };
}

const UPLOADS_DIR = process.env.UPLOADS_DIR || "./uploads/asrb";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attachmentId = params.id;

    if (!attachmentId || typeof attachmentId !== "string") {
      const problem = createProblemDetail(
        400,
        "Bad Request",
        "Attachment ID is required"
      );
      return NextResponse.json(problem, {
        status: 400,
        headers: { "Content-Type": "application/problem+json" },
      });
    }

    // Get upload token from query params
    const uploadToken = request.nextUrl.searchParams.get("token");

    if (!uploadToken) {
      const problem = createProblemDetail(
        400,
        "Bad Request",
        "Upload token is required"
      );
      return NextResponse.json(problem, {
        status: 400,
        headers: { "Content-Type": "application/problem+json" },
      });
    }

    // Verify token
    const tokenVerification = verifyUploadToken(uploadToken);
    if (!tokenVerification.valid) {
      logger.warn(
        { attachmentId },
        "Invalid or expired upload token"
      );

      const problem = createProblemDetail(
        401,
        "Unauthorized",
        "Upload token is invalid or expired"
      );
      return NextResponse.json(problem, {
        status: 401,
        headers: { "Content-Type": "application/problem+json" },
      });
    }

    // Get attachment from database
    const attachment = await prisma.caseAttachment.findUnique({
      where: { id: attachmentId },
      include: { case: true },
    });

    if (!attachment) {
      const problem = createProblemDetail(
        404,
        "Not Found",
        `Attachment ${attachmentId} not found`
      );
      return NextResponse.json(problem, {
        status: 404,
        headers: { "Content-Type": "application/problem+json" },
      });
    }

    // Get binary data from request
    let buffer: Buffer;
    try {
      const arrayBuffer = await request.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } catch (e) {
      logger.error(
        { error: e },
        "Failed to read request body"
      );

      const problem = createProblemDetail(
        400,
        "Bad Request",
        "Failed to read file data"
      );
      return NextResponse.json(problem, {
        status: 400,
        headers: { "Content-Type": "application/problem+json" },
      });
    }

    // Check file size against database record
    if (buffer.length !== attachment.sizeBytes) {
      logger.warn(
        {
          attachmentId,
          expectedSize: attachment.sizeBytes,
          actualSize: buffer.length,
        },
        "File size mismatch"
      );

      const problem = createProblemDetail(
        413,
        "Payload Too Large",
        `File size ${buffer.length} does not match declared size ${attachment.sizeBytes}`
      );
      return NextResponse.json(problem, {
        status: 413,
        headers: { "Content-Type": "application/problem+json" },
      });
    }

    // Create uploads directory if needed
    try {
      mkdirSync(UPLOADS_DIR, { recursive: true });
    } catch (e) {
      logger.error(
        { error: e },
        "Failed to create uploads directory"
      );
    }

    // Generate storage reference and write file
    const storageRef = `${attachment.case.id}/${attachmentId}/${attachment.filename}`;
    const filePath = join(UPLOADS_DIR, storageRef);

    try {
      // Ensure directory exists for this case/attachment
      const fileDir = filePath.substring(0, filePath.lastIndexOf("/"));
      mkdirSync(fileDir, { recursive: true });

      writeFileSync(filePath, buffer);
    } catch (e) {
      logger.error(
        { error: e, filePath },
        "Failed to write file to storage"
      );

      const problem = createProblemDetail(
        500,
        "Internal Server Error",
        "Failed to store file"
      );
      return NextResponse.json(problem, {
        status: 500,
        headers: { "Content-Type": "application/problem+json" },
      });
    }

    // Update attachment record
    const updatedAttachment = await prisma.caseAttachment.update({
      where: { id: attachmentId },
      data: {
        uploaded: true,
        storageRef,
        uploadToken: null,
        uploadExpiry: null,
        updatedAt: new Date(),
      },
    });

    logger.info(
      {
        attachmentId,
        caseId: attachment.caseId,
        storageRef,
      },
      "Attachment uploaded successfully"
    );

    return NextResponse.json(
      {
        attachmentId: updatedAttachment.id,
        caseId: attachment.caseId,
        filename: updatedAttachment.filename,
        uploadedAt: updatedAttachment.updatedAt.toISOString(),
        storageRef: updatedAttachment.storageRef,
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    logger.error(
      { error },
      "Unhandled error in PUT /api/asrb/attachments/[id]/upload"
    );

    const problem = createProblemDetail(
      500,
      "Internal Server Error",
      "An unexpected error occurred"
    );

    return NextResponse.json(problem, {
      status: 500,
      headers: { "Content-Type": "application/problem+json" },
    });
  }
}
