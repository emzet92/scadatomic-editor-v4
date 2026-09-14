import { Navigation } from "../../components/Navigation";
import { defaultNavigationProps } from "../../component-props";
import type { ComponentDefinition } from "../component-definition-types";

export const navigationDefinition = {
  type: "Navigation",
  label: "Navigation",
  description: "Top-level page navigation",
  editor: Navigation,
  runtime: Navigation,
  defaults: defaultNavigationProps,
  inspector: {
    backgroundColor: { kind: "color" },
    color: { kind: "color" },
    activeColor: { kind: "color" },
    gap: { kind: "number", min: 0, max: 48 },
    padding: { kind: "number", min: 0, max: 48 },
    borderRadius: { kind: "number", min: 0, max: 48 },
  },
} satisfies ComponentDefinition;
