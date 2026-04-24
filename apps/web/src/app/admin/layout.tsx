import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — University DSS",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-7xl items-center px-6">
          <span className="text-sm font-semibold tracking-tight">
            University DSS — Admin
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
