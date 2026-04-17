import { describe, it, expect } from "vitest";
import {
  computePayloadHash,
  canonicalJsonSerialize,
  createAuditEvent,
  verifyAuditEvent,
} from "@ums/audit";

describe("Audit System", () => {
  describe("Canonical JSON Serialization", () => {
    it("should serialize objects deterministically", () => {
      const obj1 = { b: 2, a: 1, c: 3 };
      const obj2 = { a: 1, b: 2, c: 3 };

      const serialized1 = canonicalJsonSerialize(obj1);
      const serialized2 = canonicalJsonSerialize(obj2);

      expect(serialized1).toBe(serialized2);
    });

    it("should handle nested objects", () => {
      const obj = { nested: { b: 2, a: 1 }, x: "value" };
      const serialized = canonicalJsonSerialize(obj);
      expect(serialized).toContain('"nested":');
      expect(serialized).toContain('"a":1');
    });

    it("should handle arrays", () => {
      const arr = [1, 2, 3];
      const serialized = canonicalJsonSerialize(arr);
      expect(serialized).toBe("[1,2,3]");
    });

    it("should handle null and booleans", () => {
      expect(canonicalJsonSerialize(null)).toBe("null");
      expect(canonicalJsonSerialize(true)).toBe("true");
      expect(canonicalJsonSerialize(false)).toBe("false");
    });
  });

  describe("Payload Hashing", () => {
    it("should produce consistent hashes", () => {
      const payload = { event: "test", data: { id: 123 } };
      const hash1 = computePayloadHash(payload);
      const hash2 = computePayloadHash(payload);
      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different payloads", () => {
      const payload1 = { event: "test1" };
      const payload2 = { event: "test2" };
      const hash1 = computePayloadHash(payload1);
      const hash2 = computePayloadHash(payload2);
      expect(hash1).not.toBe(hash2);
    });

    it("should produce hex string hash", () => {
      const payload = { test: true };
      const hash = computePayloadHash(payload);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe("Audit Event Creation and Verification", () => {
    it("should create an audit event with hash", () => {
      const event = createAuditEvent({
        eventType: "CREATE",
        entityType: "AgendaItem",
        entityId: "item-123",
        userId: "user-456",
        changes: { title: "New Item" },
      });

      expect(event.id).toBeDefined();
      expect(event.eventType).toBe("CREATE");
      expect(event.payloadHash).toBeDefined();
      expect(event.payloadHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should verify a valid audit event", () => {
      const event = createAuditEvent({
        eventType: "UPDATE",
        entityType: "WorkingPaper",
        entityId: "paper-789",
        userId: "user-456",
        changes: { status: "FINALIZED" },
      });

      const isValid = verifyAuditEvent(event);
      expect(isValid).toBe(true);
    });

    it("should detect tampered audit events", () => {
      const event = createAuditEvent({
        eventType: "DELETE",
        entityType: "Decision",
        entityId: "decision-111",
        userId: "user-456",
        changes: {},
      });

      // Tamper with the changes
      event.changes = { malicious: "modification" };

      const isValid = verifyAuditEvent(event);
      expect(isValid).toBe(false);
    });
  });
});
