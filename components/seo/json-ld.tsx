import type { StickerMeta } from "trazo/core";
import { STICKER_COUNT, trazoCatalogMeta } from "trazo/meta";

import { siteConfig } from "@/config/site";

function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const AUTHOR_SCHEMA = {
  "@type": "Person",
  name: siteConfig.author.name,
  url: "https://www.akoder.xyz",
  sameAs: [siteConfig.author.github, siteConfig.author.x],
} as const;

export function HomeJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
        author: AUTHOR_SCHEMA,
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteConfig.url}/#software`,
        name: `${siteConfig.name} (${siteConfig.npmPackage})`,
        url: siteConfig.url,
        applicationCategory: "DeveloperApplication",
        applicationSubCategory: "SVG Sticker & Icon Library",
        operatingSystem: "Any",
        isAccessibleForFree: true,
        description: siteConfig.description,
        softwareRequirements: "React, Vue, Svelte, or any web browser",
        downloadUrl: siteConfig.npm,
        codeRepository: siteConfig.github,
        license: `${siteConfig.github}/blob/main/LICENSE`,
        author: AUTHOR_SCHEMA,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        featureList: [
          `${STICKER_COUNT} hand-drawn wax-crayon SVG stickers`,
          "Tree-shakeable React, Vue, and Svelte components",
          "Standalone SVG strings, PNG export, and bulk ZIP packs",
          "Live single-color ink and pastel recoloring",
          "Agent illustration skill for generating custom stickers",
          "MIT open-source license",
        ],
      },
    ],
  };

  return <JsonLdScript data={schema} />;
}

export function LibraryJsonLd() {
  const libraryUrl = `${siteConfig.url}/library`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${libraryUrl}#webpage`,
        url: libraryUrl,
        name: `${STICKER_COUNT} Free Hand-Drawn Crayon SVG Stickers`,
        description: `Browse, search, and recolor all ${STICKER_COUNT} free hand-drawn crayon SVG stickers for React, Vue, Svelte, and web.`,
        isPartOf: { "@id": `${siteConfig.url}/#website` },
        mainEntity: { "@id": `${libraryUrl}#itemlist` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: siteConfig.name,
            item: siteConfig.url,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Library",
            item: libraryUrl,
          },
        ],
      },
      {
        "@type": "ItemList",
        "@id": `${libraryUrl}#itemlist`,
        name: "Trazo Crayon SVG Sticker Catalog",
        numberOfItems: STICKER_COUNT,
        itemListElement: trazoCatalogMeta.map((sticker, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: `${sticker.name} crayon SVG sticker`,
          url: `${siteConfig.url}/library/${sticker.id}`,
        })),
      },
    ],
  };

  return <JsonLdScript data={schema} />;
}

export function StickerJsonLd({ sticker }: { sticker: StickerMeta }) {
  const pageUrl = `${siteConfig.url}/library/${sticker.id}`;
  const keywords = [
    sticker.name.toLowerCase(),
    `${sticker.name.toLowerCase()} svg`,
    `${sticker.name.toLowerCase()} sticker`,
    sticker.category,
    ...sticker.tags,
    "crayon svg",
    "hand-drawn sticker",
    "react svg component",
  ].join(", ");

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        "@id": `${pageUrl}#sticker`,
        name: `${sticker.name} Crayon SVG Sticker`,
        description: `Free hand-drawn ${sticker.name.toLowerCase()} wax-crayon SVG sticker in the ${sticker.category} category. Available as a tree-shakeable React, Vue, or Svelte component (<${sticker.componentName} />), or downloadable SVG/PNG.`,
        url: pageUrl,
        image: `${pageUrl}/sticker.svg`,
        encodingFormat: "image/svg+xml",
        isAccessibleForFree: true,
        license: `${siteConfig.github}/blob/main/LICENSE`,
        acquireLicensePage: siteConfig.github,
        creditText: `${siteConfig.name} by ${siteConfig.author.name}`,
        creator: AUTHOR_SCHEMA,
        keywords,
      },
      {
        "@type": "SoftwareSourceCode",
        "@id": `${pageUrl}#code`,
        name: `${sticker.componentName} — ${sticker.name} Sticker Component`,
        codeRepository: siteConfig.github,
        programmingLanguage: ["TypeScript", "React", "Vue", "Svelte", "SVG"],
        runtimePlatform: "Web",
        license: `${siteConfig.github}/blob/main/LICENSE`,
        author: AUTHOR_SCHEMA,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: siteConfig.name,
            item: siteConfig.url,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Library",
            item: `${siteConfig.url}/library`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: sticker.name,
            item: pageUrl,
          },
        ],
      },
    ],
  };

  return <JsonLdScript data={schema} />;
}
