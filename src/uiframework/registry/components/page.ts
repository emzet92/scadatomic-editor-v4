import { Page } from "../../components/Page";
import { defaultPageProps } from "../../component-props";
import type { ComponentDefinition } from "../component-definition-types";

export const pageDefinition = {
  type: "Page",
  label: "Page",
  description: "Root viewport",
  editor: Page,
  runtime: Page,
  defaults: defaultPageProps,
  acceptsChildren: true,
  inspector: {
    backgroundColor: { kind: "color" },
    padding: { kind: "spacing", min: 0 },
    gap: { kind: "spacing", min: 0 },
    columns: { kind: "number", min: 1, max: 24 },
    display: { kind: "select", options: ["grid", "flex"] },
  },
} satisfies ComponentDefinition;
