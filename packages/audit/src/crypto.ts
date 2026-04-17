import { createHash } from "crypto";

export function canonicalJsonSerialize(obj: unknown): string {
  if (obj === null) return "null";
  if (typeof obj === "boolean") return obj ? "true" : "false";
  if (typeof obj === "number") return JSON.stringify(obj);
  if (typeof obj === "string") return JSON.stringify(obj);

  if (Array.isArray(obj)) {
    const items = obj.map((item) => canonicalJsonSerialize(item));
    return `[${items.join(",")}]`;
  }

  if (typeof obj === "object") {
    const keys = Object.keys(obj).sort();
    const pairs = keys.map(
      (key) =>
        `"${key}":${canonicalJsonSerialize((obj as Record<string, unknown>)[key])}`
    );
    return `{${pairs.join(",")}}`;
  }

  return JSON.stringify(obj);
}

export function sha256Hash(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

export function computePayloadHash(payload: unknown): string {
  const canonical = canonicalJsonSerialize(payload);
  return sha256Hash(canonical);
}
