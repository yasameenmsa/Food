import Image from "next/image";
import { Icon } from "@/components/atoms/Icon";
import type { ImageDTO } from "@/types";

export type DishImageProps = {
  image: ImageDTO | null;
  /** Used for the placeholder artwork and as the alt fallback. */
  name: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

/**
 * Menus are photo-led, but a dish may have no photo yet. Rather than a broken
 * frame, fall back to a warm branded tile with the olive motif, so the grid keeps
 * its rhythm and nothing looks broken.
 */
export function DishImage({
  image,
  name,
  sizes,
  priority = false,
  className = "",
}: DishImageProps) {
  if (!image) {
    return (
      <div
        role="img"
        aria-label={name}
        className={`flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-stone/60 via-surface to-stone/40 ${className}`}
      >
        <Icon name="leaf" size={48} className="text-olive/25" />
      </div>
    );
  }

  return (
    <Image
      src={image.src}
      alt={image.alt || name}
      width={image.width}
      height={image.height}
      sizes={sizes}
      priority={priority}
      className={`aspect-[4/3] w-full object-cover ${className}`}
    />
  );
}