import type { ComponentDefinition } from "../component-definition-types";
import { Table } from "../../renderers/Table";

export const tableDefinition = {
  type: "Table",
  label: "Table",
  description: "Static editable table surface",
  editor: Table,
  runtime: Table,
  defaults: {
    rows: 3,
    columns: 3,
    width: "100%",
    minWidth: 320,
    borderSize: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    backgroundColor: "#ffffff",
  },
  acceptsChildren: false,
  inspector: {
    width: { kind: "text" },
    minWidth: { kind: "text" },
    borderSize: { kind: "number", min: 0, max: 8, step: 1 },
    borderColor: { kind: "color" },
    borderRadius: { kind: "radius", min: 0, max: 64 },
    backgroundColor: { kind: "color" },
  },
} satisfies ComponentDefinition;
