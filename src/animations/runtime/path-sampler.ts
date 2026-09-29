import type { AnimationPath, AnimationPoint } from "../model/animation-path";

export type SampledPathPosition = AnimationPoint & {
  /** Zero-based line segment currently being traversed. */
  segmentIndex: number;
  /** Progress inside the active segment, normalized to 0..1. */
  segmentProgress: number;
  /** Direction of travel. Useful later for rotation/orientation bindings. */
  angleDegrees: number;
};

type PathSegment = {
  from: AnimationPoint;
  to: AnimationPoint;
  length: number;
  startDistance: number;
};

export type PathMetrics = {
  segments: readonly PathSegment[];
  totalLength: number;
};

export function buildPathMetrics(path: AnimationPath): PathMetrics {
  const segments: PathSegment[] = [];
  let totalLength = 0;

  for (let index = 0; index < path.points.length - 1; index += 1) {
    const from = path.points[index];
    const to = path.points[index + 1];
    if (!from || !to) continue;

    const length = Math.hypot(to.x - from.x, to.y - from.y);
    if (length === 0) continue;

    segments.push({
      from,
      to,
      length,
      startDistance: totalLength,
    });
    totalLength += length;
  }

  return { segments, totalLength };
}

/**
 * Samples a polyline by travelled distance instead of by waypoint index.
 * This keeps the rectangle moving at a constant visual speed even when path
 * segments have very different lengths.
 */
export function samplePath(
  path: AnimationPath,
  progress: number,
  metrics: PathMetrics = buildPathMetrics(path),
): SampledPathPosition {
  const firstPoint = path.points[0] ?? { x: 0, y: 0 };

  if (metrics.segments.length === 0 || metrics.totalLength <= 0) {
    return {
      ...firstPoint,
      segmentIndex: 0,
      segmentProgress: 0,
      angleDegrees: 0,
    };
  }

  const normalizedProgress = clamp(progress, 0, 1);
  const targetDistance = normalizedProgress * metrics.totalLength;

  const segmentIndex = findSegmentIndex(metrics, targetDistance);
  const segment = metrics.segments[segmentIndex] ?? metrics.segments[0]!;
  const localDistance = clamp(targetDistance - segment.startDistance, 0, segment.length);
  const segmentProgress = segment.length === 0 ? 0 : localDistance / segment.length;

  return {
    x: lerp(segment.from.x, segment.to.x, segmentProgress),
    y: lerp(segment.from.y, segment.to.y, segmentProgress),
    segmentIndex,
    segmentProgress,
    angleDegrees:
      (Math.atan2(segment.to.y - segment.from.y, segment.to.x - segment.from.x) * 180) /
      Math.PI,
  };
}

function findSegmentIndex(metrics: PathMetrics, distance: number): number {
  const lastIndex = metrics.segments.length - 1;

  for (let index = 0; index < metrics.segments.length; index += 1) {
    const segment = metrics.segments[index];
    if (!segment) continue;

    if (distance <= segment.startDistance + segment.length || index === lastIndex) {
      return index;
    }
  }

  return Math.max(0, lastIndex);
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
