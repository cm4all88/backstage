import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Backstagely",
  description: "Exclusive creator content. 18+ only.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
