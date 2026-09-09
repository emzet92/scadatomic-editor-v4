import type { ElementType } from "react";
import { Button } from "../components/Button";
import { Chart } from "../components/Chart";
import { Container } from "../components/Container";
import { Page } from "../components/Page";
import { Navigation } from "../components/Navigation";
import { RuntimeButton } from "../components/RuntimeButton";
import { RuntimeChart } from "../components/RuntimeChart";
import { RuntimeText } from "../components/RuntimeText";
import { Text } from "../components/Text";
import {
  defaultButtonProps,
  defaultPageProps,
  defaultChartProps,
  defaultContainerProps,
  defaultTextProps,
  defaultNavigationProps,
} from "../component-props";

export type InspectorControl =
  | { kind: "text" }
  | { kind: "number"; min?: number; max?: number; step?: number }
  | { kind: "color" }
  | { kind: "toggle" }
  | { kind: "text-format" }
  | { kind: "text-align" }
  | { kind: "border-size"; min?: number; max?: number; step?: number }
  | { kind: "select"; options: readonly string[] };

export type ComponentDefinition = {
  type: string;
  label: string;
  description: string;
  editor: ElementType;
  runtime: ElementType;
  defaults: Record<string, unknown>;
  acceptsChildren?: boolean;
  inspector: Record<string, InspectorControl>;
  bindings?: Record<string, { label: string }>;
  events?: Record<string, { label: string; defaultSuffix: string }>;
};

export const componentDefinitions = {
  Page: {
    type: "Page",
    label: "Page",
    description: "Root viewport",
    editor: Page,
    runtime: Page,
    defaults: defaultPageProps,
    acceptsChildren: true,
    inspector: {
      backgroundColor: { kind: "color" },
      padding: { kind: "number", min: 0 },
      gap: { kind: "number", min: 0 },
      columns: { kind: "number", min: 1, max: 24 },
      display: { kind: "select", options: ["grid", "flex"] },
    },
  },
  Navigation: {
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
  },
  Container: {
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
      borderSize: { kind: "border-size", min: 0 },
      display: { kind: "select", options: ["grid", "flex"] },
    },
  },
  Text: {
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
      variant: {
        kind: "select",
        options: ["body", "label", "title", "caption"],
      },
      uppercase: { kind: "toggle" },
      borderSize: { kind: "border-size", min: 0 },
      borderColor: { kind: "color" },
      borderRadius: { kind: "number", min: 0 },
    },
    bindings: {
      value: { label: "Runtime tag" },
    },
  },
  Button: {
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
    },
    events: {
      click: { label: "Click", defaultSuffix: "Clicked" },
      doubleClick: { label: "Double click", defaultSuffix: "DoubleClicked" },
    },
  },
  Chart: {
    type: "Chart",
    label: "Chart",
    description: "Line or bar chart",
    editor: Chart,
    runtime: RuntimeChart,
    defaults: defaultChartProps,
    inspector: {
      title: { kind: "text" },
      kind: { kind: "select", options: ["line", "bar"] },
      width: { kind: "text" },
      height: { kind: "text" },
      minHeight: { kind: "text" },
      color: { kind: "color" },
      showLegend: { kind: "toggle" },
      showGrid: { kind: "toggle" },
    },
    bindings: {
      value: { label: "Runtime tag" },
    },
  },
} satisfies Record<string, ComponentDefinition>;

export type RegisteredComponentType = keyof typeof componentDefinitions;

export function getComponentDefinition(type: string): ComponentDefinition | undefined {
  return componentDefinitions[type as RegisteredComponentType];
}

export function getDefaultPropsForType(type: string): Record<string, unknown> {
  return {
    ...(getComponentDefinition(type)?.defaults ?? {}),
  };
}
