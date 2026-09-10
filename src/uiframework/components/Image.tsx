import { ImageIcon } from "lucide-react";
import type { CSSProperties, HTMLAttributes } from "react";
import { useAssetUrl } from "../assets";
import {
  defaultImageProps,
  type CssSize,
  type ImageNodeProps,
} from "../component-props";

export type ImageProps = Omit<HTMLAttributes<HTMLDivElement>, "color"> &
  ImageNodeProps;

export function Image({
  assetId,
  width = defaultImageProps.width,
  height = defaultImageProps.height,
  fit = defaultImageProps.fit,
  alt = defaultImageProps.alt,
  borderRadius = defaultImageProps.borderRadius,
  backgroundColor = defaultImageProps.backgroundColor,
  style,
  className,
  ...domProps
}: ImageProps) {
  const asset = useAssetUrl(assetId);
  const readyUrl = asset.assetId === assetId ? asset.url : null;

  return (
    <div
      {...domProps}
      className={className}
      style={{
        width: toCssSize(width),
        height: toCssSize(height),
        minWidth: 24,
        minHeight: 24,
        overflow: "hidden",
        borderRadius,
        backgroundColor,
        boxSizing: "border-box",
        position: "relative",
        ...style,
      }}
    >
      {readyUrl ? (
        <img
          src={readyUrl}
          alt={alt}
          draggable={false}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: fit,
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
      ) : (
        <ImagePlaceholder missing={Boolean(assetId && asset.missing)} />
      )}
    </div>
  );
}

function ImagePlaceholder({ missing }: { missing: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        padding: 12,
        border: "1px dashed #d4d4d8",
        color: "#71717a",
        textAlign: "center",
        fontSize: 11,
        lineHeight: "16px",
      }}
    >
      <ImageIcon size={22} strokeWidth={1.5} />
      <span>{missing ? "Image asset unavailable" : "Upload image in Properties"}</span>
    </div>
  );
}

function toCssSize(value: CssSize | undefined): CSSProperties["width"] {
  if (value === undefined) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}
