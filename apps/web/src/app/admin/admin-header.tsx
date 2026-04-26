"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SessionPayload } from "@/lib/auth/session";

interface AdminHeaderProps {
  session: SessionPayload | null;
}

export default function AdminHeader({ session }: AdminHeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/login");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <span className="text-sm font-semibold tracking-tight">
          University DSS — Admin
        </span>

        {session && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session.email}</span>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-sm px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
            >
              {isLoggingOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
