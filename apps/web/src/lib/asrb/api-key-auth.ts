import { createHash } from "crypto";
import prisma from "../prisma";
import { CaseType } from "@ums/domain";

export interface FeederClientContext {
  id: string;
  displayName: string;
  feederBodyCode: string;
  feederBodyType: string;
  permittedCaseTypes: CaseType[];
  rateLimitPerMinute: number;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

// In-memory rate limiter: Map of clientId -> {count, windowStart}
const rateLimitMap = new Map<string, RateLimitEntry>();

export async function authenticateAPIKey(
  authHeader: string | undefined
): Promise<FeederClientContext | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  const hashedKey = createHash("sha256").update(token).digest("hex");

  const feederClient = await prisma.feederClient.findFirst({
    where: { apiKeyHash: hashedKey },
  });

  if (!feederClient || !feederClient.active) {
    return null;
  }

  // Update last used timestamp
  await prisma.feederClient.update({
    where: { id: feederClient.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    id: feederClient.id,
    displayName: feederClient.displayName,
    feederBodyCode: feederClient.feederBodyCode,
    feederBodyType: feederClient.feederBodyType,
    permittedCaseTypes: JSON.parse(feederClient.permittedCaseTypes),
    rateLimitPerMinute: feederClient.rateLimitOverride || 60,
  };
}

export function checkRateLimit(clientId: string, limit: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientId);

  // If no entry or window has expired (60 seconds)
  if (!entry || now - entry.windowStart > 60000) {
    rateLimitMap.set(clientId, { count: 1, windowStart: now });
    return true;
  }

  // Increment count and check against limit
  if (entry.count < limit) {
    entry.count++;
    return true;
  }

  return false;
}

export function canCaseTypeBeProcessed(
  permittedTypes: CaseType[],
  requestedType: CaseType
): boolean {
  return permittedTypes.includes(requestedType);
}

export interface AuthContext {
  feederClient: FeederClientContext;
  timestamp: Date;
}

export async function validateAndAuthenticateRequest(
  authHeader: string | undefined,
  caseType: CaseType
): Promise<{ valid: boolean; context?: AuthContext; error?: string }> {
  const feederClient = await authenticateAPIKey(authHeader);

  if (!feederClient) {
    return {
      valid: false,
      error: "Invalid or missing API key",
    };
  }

  if (!canCaseTypeBeProcessed(feederClient.permittedCaseTypes, caseType)) {
    return {
      valid: false,
      error: `Case type ${caseType} not permitted for this feeder client`,
    };
  }

  if (!checkRateLimit(feederClient.id, feederClient.rateLimitPerMinute)) {
    return {
      valid: false,
      error: "Rate limit exceeded",
    };
  }

  return {
    valid: true,
    context: {
      feederClient,
      timestamp: new Date(),
    },
  };
}
