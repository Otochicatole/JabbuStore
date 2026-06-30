import Image from "next/image";

type SkinImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  maxWidth?: number;
  maxHeight?: number;
  priority?: boolean;
  className?: string;
};

/**
 * Steam skin images with fixed intrinsic size for Next.js Image.
 * style width/height auto avoids aspect-ratio warnings when object-contain scales the image.
 */
export function SkinImage({
  src,
  alt,
  width = 180,
  height = 130,
  maxWidth,
  maxHeight,
  priority,
  className = "",
}: SkinImageProps) {
  const maxW = maxWidth ?? width;
  const maxH = maxHeight ?? height;

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={`object-contain ${className}`.trim()}
      style={{ width: "auto", height: "auto", maxWidth: maxW, maxHeight: maxH }}
    />
  );
}
