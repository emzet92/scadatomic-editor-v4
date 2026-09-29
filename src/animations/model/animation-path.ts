export type AnimationWaypointChanges = {
  /** Box fill applied from this waypoint until another waypoint overrides it. */
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
 * Keeping both geometry and waypoint changes as plain domain data is deliberate:
 * later the same structure can come from the designer document, a reusable
 * component or a runtime/tag binding without changing the playback code.
 */
export const conveyorDemoPath: AnimationPath = {
  id: "conveyor-demo",
  name: "Conveyor demo",
  points: [
    { id: "load", x: 90, y: 370, changes: { boxColor: "#4f46e5" } },
    { id: "transfer-a", x: 250, y: 370 },
    { id: "inspection", x: 250, y: 165, changes: { boxColor: "#f59e0b" } },
    { id: "transfer-b", x: 510, y: 165 },
    { id: "accepted", x: 510, y: 315, changes: { boxColor: "#10b981" } },
    { id: "outfeed", x: 790, y: 315 },
    { id: "finish", x: 790, y: 105, changes: { boxColor: "#ec4899" } },
  ],
};
