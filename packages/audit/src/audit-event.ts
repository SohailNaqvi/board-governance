import { computePayloadHash } from "./crypto";

export interface AuditEventInput {
  eventType: string;
  entityType: string;
  entityId: string;
  userId: string;
  changes: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditEventRecord extends AuditEventInput {
  id: string;
  payloadHash: string;
  timestamp: Date;
}

export function createAuditEvent(input: AuditEventInput): AuditEventRecord {
  const timestamp = new Date();
  const payload = {
    eventType: input.eventType,
    entityType: input.entityType,
    entityId: input.entityId,
    userId: input.userId,
    changes: input.changes,
    timestamp: timestamp.toISOString(),
  };

  const payloadHash = computePayloadHash(payload);

  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    eventType: input.eventType,
    entityType: input.entityType,
    entityId: input.entityId,
    userId: input.userId,
    changes: input.changes,
    payloadHash,
    timestamp,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  };
}

export function verifyAuditEvent(record: AuditEventRecord): boolean {
  const payload = {
    eventType: record.eventType,
    entityType: record.entityType,
    entityId: record.entityId,
    userId: record.userId,
    changes: record.changes,
    timestamp: record.timestamp.toISOString(),
  };

  const recomputedHash = computePayloadHash(payload);
  return recomputedHash === record.payloadHash;
}
