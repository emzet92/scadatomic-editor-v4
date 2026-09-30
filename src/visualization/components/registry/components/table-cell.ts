import type { ComponentDefinition } from "../component-definition-types";
import { TableCell } from "../../renderers/TableCell";

export const tableCellDefinition = {
  type: "TableCell",
  label: "Table cell",
  description: "Cell that can host arbitrary components",
  editor: TableCell,
  runtime: TableCell,
  defaults: {
    minHeight: 48,
    padding: 8,
    gap: 6,
    backgroundColor: "transparent",
    horizontalAlign: "start",
    verticalAlign: "center",
  },
  acceptsChildren: true,
  inspector: {
    minHeight: { kind: "number", min: 24, max: 480, step: 4 },
    padding: { kind: "spacing", min: 0 },
    gap: { kind: "spacing", min: 0 },
    backgroundColor: { kind: "color" },
    horizontalAlign: { kind: "select", options: ["start", "center", "end", "stretch"] },
    verticalAlign: { kind: "select", options: ["start", "center", "end", "stretch"] },
  },
} satisfies ComponentDefinition;
