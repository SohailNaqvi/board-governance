import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "University DSS",
  description: "University Decision Support System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com" async></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
