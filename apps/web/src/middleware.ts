import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-in-production"
);

interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  mustChangePassword: boolean;
  iat?: number;
  exp?: number;
}

async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

function loginRequiredPage(pathname: string): NextResponse {
  const loginHref = `/login?returnUrl=${encodeURIComponent(pathname)}`;
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Login Required</title></head>
<body style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb">
  <div style="text-align:center;max-width:400px;padding:2rem">
    <h1 style="font-size:1.5rem;font-weight:700;color:#111827">Login required</h1>
    <p style="margin:1rem 0;color:#6b7280">You must be logged in to access this page.</p>
    <a href="${loginHref}" style="color:#2563eb;text-decoration:underline" data-testid="login-link">Go to login</a>
  </div>
</body>
</html>`,
    {
      status: 401,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminApiRoute = pathname.startsWith("/api/admin");

  if (!isAdminRoute && !isAdminApiRoute) {
    return NextResponse.next();
  }

  // Read and verify session
  const sessionToken = request.cookies.get("session")?.value;
  const session = sessionToken ? await verifyToken(sessionToken) : null;

  // Unauthenticated
  if (!session) {
    if (isAdminApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return loginRequiredPage(pathname);
  }

  // Must change password — redirect to /change-password unless already there
  if (session.mustChangePassword && !pathname.startsWith("/change-password")) {
    if (isAdminApiRoute) {
      return NextResponse.json(
        { error: "Password change required" },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL("/change-password", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
