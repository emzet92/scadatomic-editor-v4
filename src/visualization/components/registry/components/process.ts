import { ProcessComponent, RuntimeProcessComponent } from "../../../../processes";
import type { ComponentDefinition } from "../component-definition-types";

export const processDefinition = {
  type: "Process",
  label: "Process",
  description: "Saved process visualization",
  editor: ProcessComponent,
  runtime: RuntimeProcessComponent,
  defaults: {
    processId: "",
    processSourceMode: "project-default",
    width: "100%",
    height: 320,
    showGrid: true,
  },
  inspector: {
    processSourceMode: { kind: "select", options: ["project-default", "exact"] },
    width: { kind: "text" },
    height: { kind: "text" },
    showGrid: { kind: "toggle" },
  },
} satisfies ComponentDefinition;
