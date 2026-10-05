import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { ALLOWED_MIME, uploadDir } from "@/lib/uploads";

/**
 * Streams an uploaded photo.
 *
 * `lib/images.ts` builds `/api/images/...` for every dish that has a photo, and
 * this handler did not exist — so any image URL the app produced was a 404. It
 * was invisible because nothing ever wrote an `Image` row, so every dish fell
 * through to the branded placeholder tile.
 *
 * The filename comes from the database, never from the request, but it is still
 * validated before touching the filesystem: a single unvalidated `..` here would
 * serve the whole disk.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/images/[filename]">,
) {
  const { filename } = await params;

  // Reject anything that is not a bare generated filename. This is the check that
  // keeps `..%2f..%2f.env` and `%2e%2e/` from ever reaching `path.join`.
  if (!/^[a-f0-9]{32}\.(jpg|png|webp|avif)$/.test(filename)) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = path.join(uploadDir(), filename);

  // Belt and braces: even with the pattern above, confirm the resolved path is
  // still inside the upload directory.
  if (!path.resolve(filePath).startsWith(path.resolve(uploadDir()) + path.sep)) {
    return new Response("Not found", { status: 404 });
  }

  let size: number;
  try {
    const info = await stat(filePath);
    if (!info.isFile()) return new Response("Not found", { status: 404 });
    size = info.size;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const extension = filename.slice(filename.lastIndexOf(".") + 1);
  const mime = [...ALLOWED_MIME.entries()].find(([, ext]) => ext === extension)?.[0];

  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;

  return new Response(stream, {
    headers: {
      "Content-Type": mime ?? "application/octet-stream",
      "Content-Length": String(size),
      // Filenames are content-hashed, so the bytes at this URL never change.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
