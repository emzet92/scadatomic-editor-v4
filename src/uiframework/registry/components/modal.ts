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
    borderRadius: { kind: "number", min: 0, max: 64 },
    closeOnBackdrop: { kind: "toggle" },
    closeOnEscape: { kind: "toggle" },
  },
  events: {
    open: { label: "On open", defaultSuffix: "Opened" },
    close: { label: "On close", defaultSuffix: "Closed" },
  },
} satisfies ComponentDefinition;
