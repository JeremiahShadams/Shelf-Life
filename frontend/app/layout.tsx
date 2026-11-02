import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/ui/BottomNav";
import { Providers } from "./providers";
import { ServiceWorkerRegistrar } from "./sw-register";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Fresco — Know Your Fruit",
  description: "AI-powered fruit freshness assistant. Scan, estimate shelf life, and store smarter.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fresco",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#18181B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <main className="mx-auto max-w-[480px] min-h-screen pb-20">
            {children}
          </main>
          <BottomNav />
        </Providers>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
