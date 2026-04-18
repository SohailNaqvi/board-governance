import { jwtVerify, SignJWT } from "jose";
import type { UserRole } from "./seed-users";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-in-production"
);

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export async function createSession(payload: Omit<SessionPayload, "iat" | "exp">): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  return token;
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload as SessionPayload;
  } catch {
    return null;
  }
}

export function hasRole(session: SessionPayload | null, requiredRole: UserRole): boolean {
  if (!session) return false;
  return session.role === requiredRole;
}

export function hasAnyRole(session: SessionPayload | null, roles: UserRole[]): boolean {
  if (!session) return false;
  return roles.includes(session.role);
}
