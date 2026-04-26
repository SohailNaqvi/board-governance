import type { Metadata } from "next";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/session";
import AdminHeader from "./admin-header";

export const metadata: Metadata = {
  title: "Admin — University DSS",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  let session = null;

  if (sessionToken) {
    session = await verifySession(sessionToken);
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader session={session} />
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
