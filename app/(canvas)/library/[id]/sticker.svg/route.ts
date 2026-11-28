import { findSticker, toSvgString } from "trazo/svg";
import { trazoCatalogMeta } from "trazo/meta";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return trazoCatalogMeta.map(({ id }) => ({ id }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sticker = findSticker(id);
  if (!sticker) {
    return new Response(null, { status: 404 });
  }

  return new Response(toSvgString(sticker, { size: 256, title: sticker.name }), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
