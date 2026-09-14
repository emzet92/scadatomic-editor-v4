import { Image } from "../../components/Image";
import { defaultImageProps } from "../../component-props";
import type { ComponentDefinition } from "../component-definition-types";

export const imageDefinition = {
  type: "Image",
  label: "Image",
  description: "Local image asset",
  editor: Image,
  runtime: Image,
  defaults: defaultImageProps,
  inspector: {
    assetId: { kind: "image-asset" },
    width: { kind: "text" },
    height: { kind: "text" },
    fit: { kind: "select", options: ["contain", "cover", "fill", "none", "scale-down"] },
    alt: { kind: "text" },
    borderRadius: { kind: "number", min: 0 },
    backgroundColor: { kind: "color" },
  },
} satisfies ComponentDefinition;
