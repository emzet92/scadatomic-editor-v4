import { useEffect } from "react";
import {
  HistorianRecorder,
  browserHistorianClock,
  browserHistorianScheduler,
  indexedDbHistorianConfigRepository,
  indexedDbHistorianSampleRepository,
} from "../../../historian";
import { getMockRuntimeSession } from "../../../mock/mock-tag-runtime";
import { subscribeMockRuntimeAuthority } from "../../../mock/mock-runtime-authority";
import { createTagRuntimeHistorianValueSource } from "./TagRuntimeHistorianValueSource";

/**
 * Local-prototype historian host.
 *
 * Exactly one browser tab owns mock I/O for a project. Only that authority tab
 * is allowed to persist historian samples, otherwise Designer + runtime preview
 * tabs would write duplicate samples into the same IndexedDB database.
 *
 * Production/backend code can replace this composition root while keeping the
 * historian engine and ports unchanged.
 */
export function useRuntimeHistorianRecorder(projectId: string | undefined) {
  useEffect(() => {
    if (!projectId) return undefined;

    let recorder: HistorianRecorder | undefined;

    const stopRecorder = () => {
      recorder?.stop();
      recorder = undefined;
    };

    const unsubscribeAuthority = subscribeMockRuntimeAuthority(
      projectId,
      (isAuthority) => {
        stopRecorder();
        if (!isAuthority) return;

        const runtime = getMockRuntimeSession(projectId).tags;
        const nextRecorder = new HistorianRecorder(
          indexedDbHistorianConfigRepository,
          indexedDbHistorianSampleRepository,
          createTagRuntimeHistorianValueSource(runtime),
          browserHistorianClock,
          browserHistorianScheduler,
        );
        recorder = nextRecorder;
        void nextRecorder.start(projectId).catch((error) => {
          console.error("[historian] failed to start recorder", error);
        });
      },
    );

    return () => {
      unsubscribeAuthority();
      stopRecorder();
    };
  }, [projectId]);
}
