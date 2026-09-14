import { Button } from "../../components/Button";
import { RuntimeButton } from "../../components/RuntimeButton";
import { defaultButtonProps } from "../../component-props";
import type { ComponentDefinition } from "../component-definition-types";

export const buttonDefinition = {
  type: "Button",
  label: "Button",
  description: "User action",
  editor: Button,
  runtime: RuntimeButton,
  defaults: defaultButtonProps,
  inspector: {
    label: { kind: "text" },
    disabled: { kind: "toggle" },
    backgroundColor: { kind: "color" },
    paddingX: { kind: "spacing", min: 0, max: 64 },
    paddingY: { kind: "spacing", min: 0, max: 48 },
    marginX: { kind: "spacing", min: 0, max: 64 },
    marginY: { kind: "spacing", min: 0, max: 64 },
    borderRadius: { kind: "radius", min: 0, max: 999 },
  },

  bindings: {
    "$variant": { label: "Variant", valueType: "variant", description: "Drive the visual variant from runtime state." },
    enabled: { label: "Enabled", valueType: "boolean" },
    visible: { label: "Visible", valueType: "boolean" },
    label: { label: "Label", valueType: "string" },
  },
  events: {
    click: { label: "Click", defaultSuffix: "Clicked" },
    doubleClick: { label: "Double click", defaultSuffix: "DoubleClicked" },
  },
} satisfies ComponentDefinition;
