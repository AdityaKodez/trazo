import type { Metadata } from "next";

import { HomeJsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  alternates: {
    canonical: `${siteConfig.url}/`,
  },
};

export default function TrazoHomePage() {
  return <HomeJsonLd />;
}
