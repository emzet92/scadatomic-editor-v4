import type { ElementType } from "react";

export type InspectorControl =
  | { kind: "text" }
  | { kind: "number"; min?: number; max?: number; step?: number }
  | { kind: "spacing"; min?: number; max?: number; step?: number }
  | { kind: "color" }
  | { kind: "toggle" }
  | { kind: "image-asset" }
  | { kind: "tag-ref"; udtId: string }
  | { kind: "time-range" }
  | { kind: "chart-series" }
  | { kind: "typography" }
  | { kind: "text-format" }
  | { kind: "text-align" }
  | { kind: "border-size"; min?: number; max?: number; step?: number }
  | { kind: "select"; options: readonly string[] };

export type BindingValueType = "boolean" | "string" | "number" | "variant" | "unknown";

export type BindingDefinition = {
  label: string;
  valueType?: BindingValueType;
  /** Optional hint shown by the binding editor. */
  description?: string;
};

export type ComponentDefinition = {
  type: string;
  label: string;
  description: string;
  editor: ElementType;
  runtime: ElementType;
  defaults: Record<string, unknown>;
  acceptsChildren?: boolean;
  inspector: Record<string, InspectorControl>;
  bindings?: Record<string, BindingDefinition>;
  events?: Record<string, { label: string; defaultSuffix: string }>;
};
