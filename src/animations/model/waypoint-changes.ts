import type { AnimationPath, AnimationWaypointChanges } from "./animation-path";

/**
 * Resolves the cumulative discrete state after reaching a waypoint.
 *
 * A waypoint only overrides properties it defines. This gives us keyframe-like
 * semantics without interpolating state that should change instantly.
 */
export function resolveWaypointChanges(
  path: AnimationPath,
  waypointIndex: number,
): AnimationWaypointChanges {
  const resolved: AnimationWaypointChanges = {};
  const lastIndex = Math.min(Math.max(waypointIndex, 0), path.points.length - 1);

  for (let index = 0; index <= lastIndex; index += 1) {
    const changes = path.points[index]?.changes;
    if (!changes) continue;
    Object.assign(resolved, changes);
  }

  return resolved;
}
