import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Migration Agency Document Portal",
  description: "MVP web platform for secure document upload and verification.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
