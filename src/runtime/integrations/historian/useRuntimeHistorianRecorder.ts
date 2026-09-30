import { useEffect } from "react";
import {
  HistorianRecorder,
  browserHistorianClock,
  browserHistorianScheduler,
  indexedDbHistorianConfigRepository,
  indexedDbHistorianSampleRepository,
} from "../../../historian";
import { runtimeSignalHistorianValueSource } from "./RuntimeSignalHistorianValueSource";

export function useRuntimeHistorianRecorder(projectId: string | undefined) {
  useEffect(() => {
    if (!projectId) return undefined;

    const recorder = new HistorianRecorder(
      indexedDbHistorianConfigRepository,
      indexedDbHistorianSampleRepository,
      runtimeSignalHistorianValueSource,
      browserHistorianClock,
      browserHistorianScheduler,
    );
    void recorder.start(projectId);
    return () => recorder.stop();
  }, [projectId]);
}
