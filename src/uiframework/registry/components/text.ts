import { Text } from "../../components/Text";
import { RuntimeText } from "../../components/RuntimeText";
import { defaultTextProps } from "../../component-props";
import type { ComponentDefinition } from "../component-definition-types";

export const textDefinition = {
  type: "Text",
  label: "Text",
  description: "Static or bound text",
  editor: Text,
  runtime: RuntimeText,
  defaults: defaultTextProps,
  inspector: {
    value: { kind: "text" },
    color: { kind: "color" },
    fontSize: { kind: "number", min: 1 },
    lineHeight: { kind: "text" },
    formatting: { kind: "text-format" },
    align: { kind: "text-align" },
    variant: { kind: "select", options: ["body", "label", "title", "caption"] },
    uppercase: { kind: "toggle" },
    borderSize: { kind: "border-size", min: 0 },
    borderColor: { kind: "color" },
    borderRadius: { kind: "number", min: 0 },
  },
  bindings: {
    value: { label: "Value", valueType: "string" },
    visible: { label: "Visible", valueType: "boolean" },
  },
} satisfies ComponentDefinition;
