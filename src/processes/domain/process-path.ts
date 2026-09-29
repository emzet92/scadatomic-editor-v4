export type ProcessObjectState =
  | "raw"
  | "processing"
  | "inspection"
  | "passed"
  | "rejected";

export type AnimationWaypointChanges = {
  /** Semantic product/process state applied from this waypoint onward. */
  objectState?: ProcessObjectState;
  /** Optional visual override. Prefer objectState for process logic. */
  boxColor?: string;
};

export type AnimationWaypoint = {
  /** Stable identity used by the editor and persisted with the path. */
  id: string;
  x: number;
  y: number;
  /** Discrete state changes that become active when this waypoint is reached. */
  changes?: AnimationWaypointChanges;
};

export type AnimationPath = {
  id: string;
  name: string;
  points: readonly AnimationWaypoint[];
};

/**
 * Development path used by the animation lab.
 *
 * Geometry and discrete process state are plain domain data. The renderer maps
 * semantic state (inspection, passed, rejected...) to presentation, while the
 * optional boxColor remains available as an explicit visual override.
 */
export const conveyorDemoPath: AnimationPath = {
  id: "conveyor-demo",
  name: "Conveyor demo",
  points: [
    { id: "load", x: 90, y: 370, changes: { objectState: "raw" } },
    { id: "transfer-a", x: 250, y: 370, changes: { objectState: "processing" } },
    { id: "inspection", x: 250, y: 165, changes: { objectState: "inspection" } },
    { id: "transfer-b", x: 510, y: 165 },
    { id: "accepted", x: 510, y: 315, changes: { objectState: "passed" } },
    { id: "outfeed", x: 790, y: 315 },
    { id: "finish", x: 790, y: 105 },
  ],
};
