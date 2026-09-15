import { Modal } from "../../components/Modal";
import type { ComponentDefinition } from "../component-definition-types";

export const modalDefinition = {
  type: "Modal",
  label: "Modal",
  description: "Modal root surface",
  editor: Modal,
  runtime: Modal,
  defaults: {
    width: 560,
    minHeight: 240,
    backgroundColor: "#ffffff",
    padding: 24,
    gap: 12,
    columns: 1,
    display: "grid",
    borderRadius: 18,
    shadow: { x: 0, y: 18, blur: 40, spread: -8, color: "rgba(15, 23, 42, 0.20)" },
    closeOnBackdrop: true,
    closeOnEscape: true,
  },
  acceptsChildren: true,
  inspector: {
    width: { kind: "number", min: 240 },
    minHeight: { kind: "number", min: 120 },
    backgroundColor: { kind: "color" },
    padding: { kind: "spacing", min: 0 },
    gap: { kind: "spacing", min: 0 },
    columns: { kind: "number", min: 1, max: 24 },
    display: { kind: "select", options: ["grid", "flex"] },
    border: { kind: "border" },
    borderRadius: { kind: "radius", min: 0, max: 999 },
    shadow: { kind: "shadow" },
    closeOnBackdrop: { kind: "toggle" },
    closeOnEscape: { kind: "toggle" },
  },
  events: {
    open: { label: "On open", defaultSuffix: "Opened" },
    close: { label: "On close", defaultSuffix: "Closed" },
  },
} satisfies ComponentDefinition;
