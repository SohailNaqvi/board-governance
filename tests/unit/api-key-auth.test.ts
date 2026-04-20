import { describe, it, expect } from "vitest";
import * as argon2 from "argon2";

/**
 * Unit tests for argon2id API key hashing.
 *
 * These tests exercise the hashing and verification logic directly
 * (without Prisma / database) to confirm:
 *   1. A known input hashes and verifies correctly with argon2id.
 *   2. Verification fails for a wrong key.
 *   3. The hash output is a valid argon2id encoded string.
 *   4. Two hashes of the same input differ (unique salts).
 */

// Mirror the work parameters from api-key-auth.ts ARGON2_OPTIONS
const ARGON2_OPTIONS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

describe("argon2id API key hashing", () => {
  const KNOWN_KEY = "dgsc_test_key_2026_argon2id";
  const WRONG_KEY = "wrong_key_entirely";

  it("should hash a known input and verify it correctly", async () => {
    const hash = await argon2.hash(KNOWN_KEY, ARGON2_OPTIONS);
    const isValid = await argon2.verify(hash, KNOWN_KEY);
    expect(isValid).toBe(true);
  });

  it("should reject verification for a wrong key", async () => {
    const hash = await argon2.hash(KNOWN_KEY, ARGON2_OPTIONS);
    const isValid = await argon2.verify(hash, WRONG_KEY);
    expect(isValid).toBe(false);
  });

  it("should produce a valid argon2id encoded string", async () => {
    const hash = await argon2.hash(KNOWN_KEY, ARGON2_OPTIONS);
    // argon2id hashes start with $argon2id$
    expect(hash).toMatch(/^\$argon2id\$/);
    // Encoded string contains version, memory, time, parallelism params
    expect(hash).toContain("m=19456");
    expect(hash).toContain("t=2");
    expect(hash).toContain("p=1");
  });

  it("should produce different hashes for the same input (unique salts)", async () => {
    const hash1 = await argon2.hash(KNOWN_KEY, ARGON2_OPTIONS);
    const hash2 = await argon2.hash(KNOWN_KEY, ARGON2_OPTIONS);
    expect(hash1).not.toBe(hash2);
    // But both should verify
    expect(await argon2.verify(hash1, KNOWN_KEY)).toBe(true);
    expect(await argon2.verify(hash2, KNOWN_KEY)).toBe(true);
  });

  it("should reject an empty string key", async () => {
    const hash = await argon2.hash(KNOWN_KEY, ARGON2_OPTIONS);
    const isValid = await argon2.verify(hash, "");
    expect(isValid).toBe(false);
  });

  it("should handle keys with special characters", async () => {
    const specialKey = "key_with_$pecial!chars@2026#";
    const hash = await argon2.hash(specialKey, ARGON2_OPTIONS);
    expect(await argon2.verify(hash, specialKey)).toBe(true);
    expect(await argon2.verify(hash, KNOWN_KEY)).toBe(false);
  });
});
