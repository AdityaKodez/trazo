import { toSvgString, type StickerDef } from "trazo/core";

export type StickerExportFormat = "svg" | "png";

export interface ZipFileEntry {
  name: string;
  data: Uint8Array;
  /** Use DEFLATE when true (recommended for text/SVG); STORE when false (recommended for PNG). */
  compress?: boolean;
}

export interface DownloadStickerPackOptions {
  stickers: readonly StickerDef[];
  format: StickerExportFormat;
  /** Concrete hex color override, or undefined for original multi-color layers. */
  color?: string;
  /** Palette slug for the zip filename (e.g. "mix", "ink", "coral"). */
  paletteId: string;
  /** Scope slug for the zip filename (e.g. "all", "ocean", "selection"). */
  scope: string;
  /** Export pixel dimension for PNGs (defaults to 512). */
  pngSize?: number;
  /** Export SVG width/height attribute (defaults to 256). */
  svgSize?: number;
  onProgress?: (completed: number, total: number) => void;
}

const MIT_LICENSE_TEXT = `MIT License

Copyright (c) 2026 Aditya Ojha

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

const textEncoder = new TextEncoder();

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function getDosTimestamp(date: Date): { dosTime: number; dosDate: number } {
  const year = Math.max(date.getFullYear(), 1980);
  const dosTime =
    ((date.getHours() & 0x1f) << 11) |
    ((date.getMinutes() & 0x3f) << 5) |
    ((date.getSeconds() >> 1) & 0x1f);
  const dosDate =
    (((year - 1980) & 0x7f) << 9) |
    (((date.getMonth() + 1) & 0x0f) << 5) |
    (date.getDate() & 0x1f);
  return { dosTime, dosDate };
}

async function deflateRaw(input: Uint8Array): Promise<Uint8Array | null> {
  if (typeof CompressionStream === "undefined") {
    return null;
  }
  try {
    const stream = new CompressionStream("deflate-raw");
    const writer = stream.writable.getWriter();
    const copy = new Uint8Array(input.byteLength);
    copy.set(input);
    const writePromise = writer.write(copy).then(() => writer.close());
    const compressedBuffer = await new Response(stream.readable).arrayBuffer();
    await writePromise;
    return new Uint8Array(compressedBuffer);
  } catch {
    return null;
  }
}

export async function createZipBlob(entries: readonly ZipFileEntry[]): Promise<Blob> {
  const { dosTime, dosDate } = getDosTimestamp(new Date());

  const prepared = await Promise.all(
    entries.map(async (entry) => {
      const nameBytes = textEncoder.encode(entry.name);
      const crc = crc32(entry.data);
      let method = 0;
      let payload = entry.data;

      if (entry.compress && entry.data.byteLength > 0) {
        const deflated = await deflateRaw(entry.data);
        if (deflated && deflated.byteLength < entry.data.byteLength) {
          method = 8;
          payload = deflated;
        }
      }

      return {
        nameBytes,
        crc,
        method,
        payload,
        uncompressedSize: entry.data.byteLength,
      };
    }),
  );

  let localSize = 0;
  let centralSize = 0;
  for (const item of prepared) {
    localSize += 30 + item.nameBytes.byteLength + item.payload.byteLength;
    centralSize += 46 + item.nameBytes.byteLength;
  }

  const output = new Uint8Array(localSize + centralSize + 22);
  const view = new DataView(output.buffer);
  const offsets: number[] = [];

  let offset = 0;
  for (const item of prepared) {
    offsets.push(offset);

    // Local file header
    view.setUint32(offset, 0x04034b50, true);
    view.setUint16(offset + 4, 20, true); // version needed: 2.0
    view.setUint16(offset + 6, 0x0800, true); // UTF-8 filename flag
    view.setUint16(offset + 8, item.method, true);
    view.setUint16(offset + 10, dosTime, true);
    view.setUint16(offset + 12, dosDate, true);
    view.setUint32(offset + 14, item.crc, true);
    view.setUint32(offset + 18, item.payload.byteLength, true);
    view.setUint32(offset + 22, item.uncompressedSize, true);
    view.setUint16(offset + 26, item.nameBytes.byteLength, true);
    view.setUint16(offset + 28, 0, true);
    offset += 30;

    output.set(item.nameBytes, offset);
    offset += item.nameBytes.byteLength;

    output.set(item.payload, offset);
    offset += item.payload.byteLength;
  }

  const centralDirOffset = offset;
  for (let i = 0; i < prepared.length; i++) {
    const item = prepared[i];

    // Central directory header
    view.setUint32(offset, 0x02014b50, true);
    view.setUint16(offset + 4, 20, true); // version made by
    view.setUint16(offset + 6, 20, true); // version needed
    view.setUint16(offset + 8, 0x0800, true); // UTF-8 filename flag
    view.setUint16(offset + 10, item.method, true);
    view.setUint16(offset + 12, dosTime, true);
    view.setUint16(offset + 14, dosDate, true);
    view.setUint32(offset + 16, item.crc, true);
    view.setUint32(offset + 20, item.payload.byteLength, true);
    view.setUint32(offset + 24, item.uncompressedSize, true);
    view.setUint16(offset + 28, item.nameBytes.byteLength, true);
    view.setUint16(offset + 30, 0, true);
    view.setUint16(offset + 32, 0, true);
    view.setUint16(offset + 34, 0, true);
    view.setUint16(offset + 36, 0, true);
    view.setUint32(offset + 38, 0, true);
    view.setUint32(offset + 42, offsets[i], true);
    offset += 46;

    output.set(item.nameBytes, offset);
    offset += item.nameBytes.byteLength;
  }

  // End of central directory record
  view.setUint32(offset, 0x06054b50, true);
  view.setUint16(offset + 4, 0, true);
  view.setUint16(offset + 6, 0, true);
  view.setUint16(offset + 8, prepared.length, true);
  view.setUint16(offset + 10, prepared.length, true);
  view.setUint32(offset + 12, centralSize, true);
  view.setUint32(offset + 16, centralDirOffset, true);
  view.setUint16(offset + 20, 0, true);

  return new Blob([output], { type: "application/zip" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function rasterizeStickerPng(
  def: StickerDef,
  options: {
    exportSize: number;
    color?: string;
    rotate?: number;
  },
  reusableCanvas?: HTMLCanvasElement,
): Promise<Blob | null> {
  const { exportSize, color, rotate = 0 } = options;
  const svgMarkup = toSvgString(def, {
    size: exportSize,
    color,
    rotate,
    title: def.name,
  });

  const svgBlob = new Blob([svgMarkup], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to rasterize ${def.id}`));
      img.src = url;
    });

    const canvas = reusableCanvas ?? document.createElement("canvas");
    if (canvas.width !== exportSize) canvas.width = exportSize;
    if (canvas.height !== exportSize) canvas.height = exportSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.clearRect(0, 0, exportSize, exportSize);
    ctx.drawImage(img, 0, 0, exportSize, exportSize);
    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((blob) => resolve(blob), "image/png"),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function buildPackFilename(options: {
  scope: string;
  paletteId: string;
  format: StickerExportFormat;
}): string {
  const parts = ["trazo", options.scope === "all" ? "stickers" : options.scope];
  if (options.paletteId !== "mix") {
    parts.push(options.paletteId);
  }
  parts.push(options.format);
  return `${parts.join("-")}.zip`;
}

export async function downloadStickerPackZip({
  stickers,
  format,
  color,
  paletteId,
  scope,
  pngSize = 512,
  svgSize = 256,
  onProgress,
}: DownloadStickerPackOptions): Promise<{ filename: string; count: number }> {
  const total = stickers.length;
  if (total === 0) {
    throw new Error("No stickers to export");
  }

  const distinctCategories = new Set(stickers.map((item) => item.category));
  const useCategoryFolders = distinctCategories.size > 1;
  const entries: ZipFileEntry[] = [];

  if (format === "svg") {
    for (let i = 0; i < stickers.length; i++) {
      const def = stickers[i];
      const markup = toSvgString(def, {
        size: svgSize,
        color,
        title: def.name,
      });
      const path = useCategoryFolders ? `${def.category}/${def.id}.svg` : `${def.id}.svg`;
      entries.push({
        name: path,
        data: textEncoder.encode(markup),
        compress: true,
      });
    }
    onProgress?.(total, total);
  } else {
    const results = new Array<ZipFileEntry | null>(total).fill(null);
    let nextIndex = 0;
    let completed = 0;
    const workerCount = Math.min(4, total);

    const workers = Array.from({ length: workerCount }, async () => {
      const canvas = document.createElement("canvas");
      canvas.width = pngSize;
      canvas.height = pngSize;

      while (true) {
        const index = nextIndex;
        nextIndex += 1;
        if (index >= total) break;

        const def = stickers[index];
        const pngBlob = await rasterizeStickerPng(def, { exportSize: pngSize, color }, canvas);
        if (pngBlob) {
          const buffer = await pngBlob.arrayBuffer();
          const path = useCategoryFolders ? `${def.category}/${def.id}.png` : `${def.id}.png`;
          results[index] = {
            name: path,
            data: new Uint8Array(buffer),
            compress: false,
          };
        }
        completed += 1;
        onProgress?.(completed, total);
      }
    });

    await Promise.all(workers);

    for (const item of results) {
      if (item) entries.push(item);
    }

    if (entries.length === 0) {
      throw new Error("Failed to rasterize stickers for PNG export");
    }
  }

  entries.push({
    name: "LICENSE.txt",
    data: textEncoder.encode(MIT_LICENSE_TEXT),
    compress: true,
  });

  const filename = buildPackFilename({ scope, paletteId, format });
  const zipBlob = await createZipBlob(entries);
  downloadBlob(zipBlob, filename);

  return { filename, count: entries.length - 1 };
}
