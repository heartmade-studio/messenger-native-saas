import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Messenger-Native SaaS — Heartmade reference",
  description:
    "Reference template: subscription software delivered inside Telegram (or any messenger), backed by Vercel, Supabase, and Stripe.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
