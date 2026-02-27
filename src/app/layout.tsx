import type { Metadata } from "next";
import "./globals.css";
import { SnowEffect } from "@/components/ui/SnowEffect";

export const metadata: Metadata = {
  title: "Metaverse Club OS — Enterprise Management for Second Life Clubs",
  description: "The ultimate command center for Second Life club operators. Smart scheduling, real-time tip tracking, Discord integration, and role-based access — all in one platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SnowEffect />
        {children}
      </body>
    </html>
  );
}
