export type AnimationPoint = {
  x: number;
  y: number;
};

export type AnimationPath = {
  id: string;
  name: string;
  points: readonly AnimationPoint[];
};

/**
 * Development path used by the animation lab.
 *
 * Keeping the path as plain domain data is deliberate: later the exact same
 * structure can come from the designer document, a reusable component or a
 * runtime/tag binding without changing the playback/sampling code.
 */
export const conveyorDemoPath: AnimationPath = {
  id: "conveyor-demo",
  name: "Conveyor demo",
  points: [
    { x: 90, y: 370 },
    { x: 250, y: 370 },
    { x: 250, y: 165 },
    { x: 510, y: 165 },
    { x: 510, y: 315 },
    { x: 790, y: 315 },
    { x: 790, y: 105 },
  ],
};
