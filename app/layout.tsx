import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mjhood - مجهودكم",
  description: "Effort meets opportunities - مجهودكم يلتقي بالفرص",
};

import { LanguageProvider } from "@/lib/contexts/LanguageContext";
import { AuthModalProvider } from "@/lib/contexts/AuthContext";
import AuthModal from "@/components/auth/AuthModal";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider>
          <AuthModalProvider>
            {children}
            <AuthModal />
          </AuthModalProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
