import * as argon2 from "argon2";
import prisma from "../prisma";
import { CaseType } from "@ums/domain";

/**
 * API Key Authentication using argon2id.
 *
 * Work-factor rationale (OWASP 2024 recommendation for argon2id):
 *   memoryCost  = 19456 KiB  (~19 MB) — balances security and server RAM
 *   timeCost    = 2           — two iterations; sufficient with 19 MB memory
 *   parallelism = 1           — single-threaded; avoids contention under load
 *
 * See ADR 0004-api-key-hashing.md for the full decision record.
 */
export const ARGON2_OPTIONS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 19456, // ~19 MB
  timeCost: 2,
  parallelism: 1,
};

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

/**
 * Hash an API key with argon2id for storage.
 * Used during key provisioning / seeding.
 */
export async function hashAPIKey(rawKey: string): Promise<string> {
  return argon2.hash(rawKey, ARGON2_OPTIONS);
}

/**
 * Verify a raw API key against an argon2id hash.
 */
export async function verifyAPIKey(
  storedHash: string,
  rawKey: string
): Promise<boolean> {
  return argon2.verify(storedHash, rawKey);
}

export async function authenticateAPIKey(
  authHeader: string | undefined
): Promise<FeederClientContext | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  // Retrieve all active feeder clients and verify against each.
  // With a small number of feeder clients (<100) this is acceptable.
  // For large-scale deployments, consider a key-prefix lookup strategy.
  const activeClients = await prisma.feederClient.findMany({
    where: { active: true },
  });

  for (const feederClient of activeClients) {
    const matches = await verifyAPIKey(feederClient.apiKeyHash, token);
    if (matches) {
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
  }

  return null;
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
