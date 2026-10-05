/**
 * Uploads.
 *
 * Photos live outside `public/` so that a filename can never be served with the
 * wrong Content-Type or cached forever under a hashed asset path. They are
 * written to `UPLOAD_DIR` and streamed back by `app/api/images/[filename]`.
 *
 * Dimensions are measured from the decoded bytes, not from the form or the
 * filename. `toImageDTO` falls back to a hardcoded 800x600 when they are
 * missing, which is a guess: on any photo that is not exactly 4:3 it produces
 * the wrong intrinsic ratio and the grid shifts as images arrive.
 */
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

/** Card images should not slow a phone on 4G down. */
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

export const ALLOWED_MIME = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);

/**
 * Where uploads are written. Outside `public/`, per the route handler.
 *
 * `UPLOAD_DIR` is genuinely configurable (it is documented in `.env.example`),
 * so the path cannot be statically scoped. Without the opt-out, Turbopack traces
 * the entire project into the server bundle because it cannot tell where this
 * resolves to.
 */
export function uploadDir(): string {
  return path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    process.env.UPLOAD_DIR ?? "./.data/uploads",
  );
}

/**
 * Magic-number check. The browser-supplied `type` on a multipart part is
 * attacker-controlled, so it is treated as a hint and confirmed against the
 * bytes before anything is written to disk.
 */
export function sniffImageMime(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;

  const b = bytes;
  const startsWith = (...bytesToMatch: number[]) =>
    bytesToMatch.every((byte, i) => b[i] === byte);

  // JPEG: FF D8 FF
  if (startsWith(0xff, 0xd8, 0xff)) return "image/jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))
    return "image/png";
  // RIFF....WEBP
  if (
    startsWith(0x52, 0x49, 0x46, 0x46) &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  )
    return "image/webp";
  // ....ftypavif / ftypavis
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11]);
    if (brand === "avif" || brand === "avis") return "image/avif";
  }

  return null;
}

/**
 * Reads the intrinsic pixel dimensions out of the file header.
 *
 * Deliberately header-only: decoding a full image in the request just to measure
 * it would be slow and would need a native dependency. JPEG, PNG, WebP and AVIF
 * all carry their dimensions in the first few hundred bytes.
 */
export function readImageSize(
  bytes: Uint8Array,
  mime: string,
): { width: number; height: number } | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  if (mime === "image/png" && bytes.length >= 24) {
    // IHDR width/height are big-endian uint32 at offsets 16 and 20.
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }

  if (mime === "image/jpeg") return readJpegSize(bytes, view);

  if (mime === "image/webp") return readWebpSize(bytes, view);

  // AVIF dimensions live in an ISOBMFF box that is not worth parsing here; the
  // caller falls back to the safe default rather than reporting a wrong ratio.
  return null;
}

function readJpegSize(
  bytes: Uint8Array,
  view: DataView,
): { width: number; height: number } | null {
  let offset = 2; // skip SOI
  while (offset + 9 < bytes.length) {
    if (view.getUint8(offset) !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = view.getUint8(offset + 1);
    // SOF0-SOF15, skipping the non-frame markers in that range.
    const isFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;
    if (isFrame) {
      return {
        height: view.getUint16(offset + 5),
        width: view.getUint16(offset + 7),
      };
    }
    const length = view.getUint16(offset + 2);
    if (length < 2) return null;
    offset += 2 + length;
  }
  return null;
}

function readWebpSize(
  bytes: Uint8Array,
  view: DataView,
): { width: number; height: number } | null {
  const chunk = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);

  if (chunk === "VP8 ") {
    return {
      width: view.getUint16(26, true) & 0x3fff,
      height: view.getUint16(28, true) & 0x3fff,
    };
  }
  if (chunk === "VP8L") {
    const bits = view.getUint32(21, true);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }
  if (chunk === "VP8X") {
    const width = 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16));
    const height = 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16));
    return { width, height };
  }
  return null;
}

export type StoredImage = {
  imageId: string;
  filename: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
};

/**
 * Validates and stores an uploaded photo, then records it. Rejects on size,
 * on an unrecognised type, and on a file that lies about its own header.
 */
export async function storeUpload(
  file: File,
  alt: string | null,
): Promise<StoredImage> {
  if (file.size === 0) throw new UploadError("الملف فارغ.");
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError("حجم الصورة أكبر من ٢ ميجابايت.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffImageMime(bytes);

  if (!mime || !ALLOWED_MIME.has(mime)) {
    throw new UploadError("نوع الملف غير مدعوم. استخدم JPG أو PNG أو WebP.");
  }

  const extension = ALLOWED_MIME.get(mime)!;
  const size = readImageSize(bytes, mime);
  const filename = `${crypto.randomBytes(16).toString("hex")}.${extension}`;

  const dir = uploadDir();
  await mkdir(dir, { recursive: true });
  // Same opt-out as `uploadDir`: the directory is dynamic by configuration.
  await writeFile(path.join(/* turbopackIgnore: true */ dir, filename), bytes);

  const row = await prisma.image.create({
    data: {
      filename,
      mime,
      sizeBytes: bytes.byteLength,
      width: size?.width ?? null,
      height: size?.height ?? null,
      alt: alt && alt.length > 0 ? alt.slice(0, 200) : null,
    },
    select: { id: true },
  });

  return {
    imageId: row.id,
    filename,
    width: size?.width ?? null,
    height: size?.height ?? null,
    sizeBytes: bytes.byteLength,
  };
}

/** Removes the bytes and the row for an image nothing points at any more. */
export async function deleteUpload(imageId: string): Promise<void> {
  const row = await prisma.image.findUnique({
    where: { id: imageId },
    select: { filename: true },
  });
  if (!row) return;

  await prisma.image.delete({ where: { id: imageId } });
  // Best effort: a missing file is not an error worth surfacing to the owner.
  await unlink(
    path.join(/* turbopackIgnore: true */ uploadDir(), row.filename),
  ).catch(() => {});
}

export class UploadError extends Error {}
