# ADR 0004: API Key Hashing with argon2id

## Status
Accepted

## Context
The ASRB intake API authenticates feeder clients (DGSC, Faculty Board) via API keys stored as hashes in the `FeederClient.apiKeyHash` column. The original implementation used SHA-256 (`crypto.createHash("sha256")`), which is a fast, non-memory-hard hash. Fast hashes are unsuitable for secret storage because they are trivially brute-forced on modern GPUs.

The security audit flagged this as a remediation item: API key hashes must use a memory-hard, slow key-derivation function.

## Decision
We adopt **argon2id** (the hybrid variant of Argon2) with these work parameters:

| Parameter     | Value   | Rationale |
|---------------|---------|-----------|
| `memoryCost`  | 19456 KiB (~19 MB) | OWASP 2024 minimum recommendation for argon2id |
| `timeCost`    | 2       | Two iterations; sufficient when combined with 19 MB memory |
| `parallelism` | 1       | Single-threaded to avoid contention under concurrent API requests |
| `variant`     | argon2id | Combines data-dependent (argon2d) and data-independent (argon2i) passes for resistance to both side-channel and GPU attacks |

The Node.js `argon2` package (v0.41.x) is used, which wraps the reference C implementation.

### Verification strategy
Since argon2id produces a unique salt per hash, we cannot do a simple hash-equality lookup. Instead, the authentication function retrieves all active feeder clients and calls `argon2.verify()` against each. With the current scale (<10 feeder clients) this is negligible. If the number of clients grows beyond ~100, a key-prefix lookup strategy should be introduced (see "Future considerations").

### Key rotation procedure (pre-production)
1. Run `node prisma/migrate-argon2id-api-keys.mjs`.
2. The script generates new random keys, hashes them with argon2id, updates the database, and prints the raw keys to stdout.
3. Update `.env` / client configuration with the new keys.
4. All previously issued SHA-256-hashed keys are invalidated.

In production, a dual-read migration (check argon2id first, fall back to SHA-256, then re-hash on success) would be required to avoid downtime.

## Consequences

### Positive
- API key hashes are now resistant to brute-force and GPU-based attacks.
- argon2id is the current OWASP-recommended algorithm for password/secret hashing.
- Work parameters are documented and centralized in `ARGON2_OPTIONS`.
- The `hashAPIKey` / `verifyAPIKey` exports allow consistent usage across the codebase.

### Negative
- argon2 adds a native (C) dependency that requires a build toolchain (node-gyp). Pre-built binaries are available for common platforms.
- Verification is ~200 ms per attempt (by design), which is acceptable for API key auth but would not suit high-throughput token validation. HMAC-based upload tokens remain SHA-256 (appropriate for that use case).
- The iterate-and-verify pattern has O(n) cost in the number of active clients.

## Future Considerations
- If feeder client count exceeds ~100, introduce a non-secret key prefix (e.g., first 8 chars) stored in a separate indexed column for O(1) lookup before argon2 verification.
- Monitor `argon2` package for security advisories; pin to a known-good version.

## Related Files
- `apps/web/src/lib/asrb/api-key-auth.ts` — Authentication logic and `ARGON2_OPTIONS`
- `prisma/migrate-argon2id-api-keys.mjs` — Key rotation migration script
- `prisma/migrate-asrb-slice2.mjs` — Original migration (now seeds with argon2id)
- `tests/unit/api-key-auth.test.ts` — Unit tests for hash/verify
- `CONTRIBUTING.md` — SHA-256 prohibition for secret storage
