import { useEffect, useMemo, useReducer } from "react";
import type { ProcessDefinition } from "../domain/process-definition";
import {
  listProcessBindingPaths,
  resolveProcessBindingValues,
  type ProcessTagSource,
} from "../application/ProcessTagSource";
import { useProcessRuntime } from "../react/ProcessRuntimeProvider";
import { useProcessDefinition } from "../react/useProcesses";
import { resolveProcessFrame } from "../runtime/process-frame";
import { ProcessCanvas } from "./ProcessCanvas";
import { ProcessPlaceholder, type ProcessComponentProps } from "./ProcessComponent";

export function RuntimeProcessComponent({
  processId,
  width = "100%",
  height,
  showGrid = false,
  style,
  className,
}: ProcessComponentProps) {
  const runtime = useProcessRuntime();
  const { definition, loading, error } = useProcessDefinition(processId, {
    projectId: runtime.projectId,
    fallbackToLatestProjectProcess: true,
  });
  useProcessSignalSubscriptions(definition, runtime.tagSource);

  if (loading) return <ProcessPlaceholder width={width} height={height} label="Loading process…" />;
  if (error) return <ProcessPlaceholder width={width} height={height} label={error} tone="error" />;
  if (!definition) {
    return (
      <ProcessPlaceholder
        width={width}
        height={height}
        label="No saved process for this project"
        tone="error"
      />
    );
  }

  const bindingValues = resolveProcessBindingValues(definition.bindings, runtime.tagSource);
  const frame = resolveProcessFrame(
    definition.path,
    definition.scene,
    bindingValues.progress ?? 0,
    {
      ...(bindingValues.objectState ? { objectState: bindingValues.objectState } : {}),
      sensorStates: bindingValues.sensorStates,
    },
  );

  return (
    <div className={className} style={{ ...style, width, ...(height === undefined ? {} : { height }) }}>
      <ProcessCanvas
        path={definition.path}
        scene={definition.scene}
        frame={frame}
        showGrid={showGrid}
        className="h-full"
      />
    </div>
  );
}

function useProcessSignalSubscriptions(
  definition: ProcessDefinition | null,
  tagSource: ProcessTagSource,
) {
  const [, forceRender] = useReducer((version: number) => version + 1, 0);
  const tags = useMemo(
    () => definition ? listProcessBindingPaths(definition.bindings) : [],
    [definition],
  );
  const subscriptionKey = tags.join("\u0000");

  useEffect(() => {
    if (tags.length === 0) return undefined;
    const unsubscribes = [...new Set(tags)].map((tag) =>
      tagSource.subscribe(tag, forceRender),
    );
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [subscriptionKey, tagSource]);
}
