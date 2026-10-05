/**
 * Uploaded photos live outside `public/` (see UPLOAD_DIR) and are served through
 * `app/api/images/[filename]/route.ts`. This builds the URLs components use.
 */
import type { ImageDTO } from "@/types";

type ImageRow = {
  filename: string;
  alt: string | null;
  width: number | null;
  height: number | null;
} | null;

const FALLBACK_SIZE = { width: 800, height: 600 };

/**
 * `fallbackAlt` is the dish name, so a photo with no alt text still describes
 * itself to a screen reader instead of being skipped.
 */
export function toImageDTO(image: ImageRow, fallbackAlt: string): ImageDTO | null {
  if (!image) return null;
  return {
    src: `/api/images/${encodeURIComponent(image.filename)}`,
    alt: image.alt ?? fallbackAlt,
    width: image.width ?? FALLBACK_SIZE.width,
    height: image.height ?? FALLBACK_SIZE.height,
  };
}