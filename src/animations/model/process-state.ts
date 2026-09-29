import type { ProcessObjectState } from "./animation-path";

export type ProcessStateAppearance = {
  label: string;
  color: string;
  description: string;
};

export const DEFAULT_PROCESS_OBJECT_STATE: ProcessObjectState = "raw";

export const processStateAppearances: Record<ProcessObjectState, ProcessStateAppearance> = {
  raw: {
    label: "Raw",
    color: "#64748b",
    description: "Material entered the process and has not been processed yet.",
  },
  processing: {
    label: "Processing",
    color: "#4f46e5",
    description: "The object is currently being processed or transported.",
  },
  inspection: {
    label: "Inspection",
    color: "#f59e0b",
    description: "The object is waiting for or undergoing inspection.",
  },
  passed: {
    label: "Passed",
    color: "#10b981",
    description: "The object passed the current quality/process gate.",
  },
  rejected: {
    label: "Rejected",
    color: "#ef4444",
    description: "The object was rejected by the process or quality gate.",
  },
};

export function getProcessStateAppearance(state: ProcessObjectState): ProcessStateAppearance {
  return processStateAppearances[state];
}
