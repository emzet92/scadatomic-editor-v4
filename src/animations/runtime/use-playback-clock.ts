import { useCallback, useEffect, useRef, useState } from "react";

export type PlaybackState = "idle" | "playing" | "paused" | "finished";

export type PlaybackClock = {
  progress: number;
  state: PlaybackState;
  play: () => void;
  pause: () => void;
  reset: () => void;
  seek: (progress: number) => void;
};

/**
 * A tiny browser playback clock. It intentionally knows nothing about paths or
 * rectangles. The animation engine consumes only normalized progress (0..1),
 * which later lets us replace this clock with a tag/runtime driven value.
 */
export function usePlaybackClock(durationMs: number, loop: boolean): PlaybackClock {
  const [progress, setProgressState] = useState(0);
  const [state, setState] = useState<PlaybackState>("idle");

  const progressRef = useRef(0);
  const lastFrameAtRef = useRef<number | null>(null);

  const setProgress = useCallback((nextProgress: number) => {
    const normalized = clamp(nextProgress, 0, 1);
    progressRef.current = normalized;
    setProgressState(normalized);
  }, []);

  const play = useCallback(() => {
    if (progressRef.current >= 1) {
      setProgress(0);
    }
    lastFrameAtRef.current = null;
    setState("playing");
  }, [setProgress]);

  const pause = useCallback(() => {
    lastFrameAtRef.current = null;
    setState((current) => (current === "playing" ? "paused" : current));
  }, []);

  const reset = useCallback(() => {
    lastFrameAtRef.current = null;
    setProgress(0);
    setState("idle");
  }, [setProgress]);

  const seek = useCallback(
    (nextProgress: number) => {
      setProgress(nextProgress);
      lastFrameAtRef.current = null;
      setState((current) => (current === "idle" ? "paused" : current));
    },
    [setProgress],
  );

  useEffect(() => {
    if (state !== "playing") return;

    let frameId = 0;

    const tick = (now: number) => {
      const previousFrameAt = lastFrameAtRef.current;
      lastFrameAtRef.current = now;

      if (previousFrameAt !== null) {
        const safeDurationMs = Math.max(1, durationMs);
        const deltaProgress = (now - previousFrameAt) / safeDurationMs;
        const nextProgress = progressRef.current + deltaProgress;

        if (nextProgress >= 1) {
          if (loop) {
            setProgress(nextProgress % 1);
          } else {
            setProgress(1);
            lastFrameAtRef.current = null;
            setState("finished");
            return;
          }
        } else {
          setProgress(nextProgress);
        }
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [durationMs, loop, setProgress, state]);

  return { progress, state, play, pause, reset, seek };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
