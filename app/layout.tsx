import type { Metadata, Viewport } from "next";
import { Geist_Mono, Plus_Jakarta_Sans, Shantell_Sans } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { siteConfig } from "@/config/site";
import { DocumentLocaleSync, LocaleProvider } from "@/lib/use-locale";
import { cn } from "@/lib/utils";
import "./globals.css";

const LOCALE_INIT_SCRIPT = `(function(){try{var k="trazo:locale",s=localStorage.getItem(k),l;if(s==="en"||s==="zh-CN"||s==="ja"){l=s}else{var c=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language];for(var i=0;i<c.length;i++){var r=(c[i]||"").toLowerCase();if(r==="zh"||r.indexOf("zh-")===0){l="zh-CN";break}if(r==="ja"||r.indexOf("ja-")===0){l="ja";break}if(r==="en"||r.indexOf("en-")===0){l="en";break}}}if(l&&document.documentElement.lang!==l){document.documentElement.lang=l}}catch(e){}})();`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
  colorScheme: "light",
};

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const shantellSans = Shantell_Sans({
  subsets: ["latin"],
  variable: "--font-shantell-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.title,
  description: siteConfig.description,
  keywords: [
    "hand-drawn svg stickers",
    "crayon svg stickers",
    "free svg stickers",
    "react svg stickers",
    "vue svg stickers",
    "svelte svg stickers",
    "bulk svg sticker pack",
    "trazo illustration skill",
    "doodle svg icons",
    "scribble svg",
    "wax crayon vector",
    "trazo-stickers",
    "web stickers",
  ],
  authors: [{ name: siteConfig.author.name, url: "https://www.akoder.xyz" }],
  creator: siteConfig.author.name,
  publisher: siteConfig.name,
  category: "Design & Developer Tools",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
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
    site: "@AdiKodez",
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
      suppressHydrationWarning
      className={cn(
        "bg-background font-sans",
        plusJakartaSans.variable,
        geistMono.variable,
        shantellSans.variable,
      )}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: LOCALE_INIT_SCRIPT }} />
      </head>
      <body className="antialiased">
        <LocaleProvider>
          <DocumentLocaleSync />
          <TooltipProvider>{children}</TooltipProvider>
        </LocaleProvider>
        <Script
          strategy="lazyOnload"
          src="https://talvess.app/script.js"
          data-website-id="021c9712-faed-478f-a94b-a771e1692c49"
        />
      </body>
    </html>
  );
}
