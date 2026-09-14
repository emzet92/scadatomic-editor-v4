import { Container } from "../../components/Container";
import { defaultContainerProps } from "../../component-props";
import type { ComponentDefinition } from "../component-definition-types";

export const containerDefinition = {
  type: "Container",
  label: "Container",
  description: "Layout container",
  editor: Container,
  runtime: Container,
  defaults: defaultContainerProps,
  acceptsChildren: true,
  inspector: {
    width: { kind: "text" },
    height: { kind: "text" },
    minWidth: { kind: "text" },
    minHeight: { kind: "text" },
    maxWidth: { kind: "text" },
    maxHeight: { kind: "text" },
    padding: { kind: "number", min: 0 },
    gap: { kind: "number", min: 0 },
    columns: { kind: "number", min: 1, max: 24 },
    gridMode: { kind: "select", options: ["fixed", "adaptive"] },
    minColumnWidth: { kind: "number", min: 96, max: 640 },
    minRowHeight: { kind: "number", min: 24, max: 480 },
    gridRowMode: { kind: "select", options: ["content", "minimum"] },
    gridItemAlignment: { kind: "select", options: ["start", "center", "end", "stretch"] },
    borderSize: { kind: "border-size", min: 0 },
    display: { kind: "select", options: ["grid", "flex"] },
  },
} satisfies ComponentDefinition;
