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
    paddingX: { kind: "number", min: 0, max: 64 },
    paddingY: { kind: "number", min: 0, max: 48 },
    marginX: { kind: "number", min: 0, max: 64 },
    marginY: { kind: "number", min: 0, max: 64 },
    borderRadius: { kind: "number", min: 0, max: 64 },
  },
  events: {
    click: { label: "Click", defaultSuffix: "Clicked" },
    doubleClick: { label: "Double click", defaultSuffix: "DoubleClicked" },
  },
} satisfies ComponentDefinition;
