import type { Metadata, Viewport } from "next";
import { Caveat, DM_Sans, Geist_Mono } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
  colorScheme: "light",
};

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.title,
  description: siteConfig.description,
  alternates: {
    canonical: siteConfig.url,
  },
  openGraph: {
    type: "website",
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    creator: "@AdiKodez",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "bg-background font-sans",
        dmSans.variable,
        geistMono.variable,
        caveat.variable,
      )}
    >
      <body className="antialiased">
        <TooltipProvider>{children}</TooltipProvider>
        <Script
          defer
          src="https://talvess.app/script.js"
          data-website-id="021c9712-faed-478f-a94b-a771e1692c49"
        />
      </body>
    </html>
  );
}
