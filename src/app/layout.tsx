import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import { TopNav } from "@/components/topbar";
import { db } from "@/lib/db";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Iris — supply intelligence",
  description: "Live supply-chain risk awareness with interactive voice agents.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const alertCount = await db.alert
    .count({ where: { status: { in: ["pending", "calling", "escalated"] } } })
    .catch(() => 0);

  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <div className="flex min-h-screen flex-col">
          <Suspense fallback={<div className="h-[92px] border-b" style={{ borderColor: "var(--border)" }} />} >
            <TopNav alertCount={alertCount} />
          </Suspense>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
