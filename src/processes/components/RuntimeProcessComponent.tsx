import { useMemo } from "react";
import {
  exactProcessSource,
  projectDefaultProcessSource,
  type ProcessSource,
} from "../application/ProcessSource";
import { useResolvedProcessBindings } from "../react/useProcessBindings";
import { useProcessRuntime } from "../react/ProcessRuntimeProvider";
import { useProcessDefinition } from "../react/useProcesses";
import { resolveProcessFrame } from "../runtime/process-frame";
import { ProcessCanvas } from "./ProcessCanvas";
import { ProcessPlaceholder, type ProcessComponentProps } from "./ProcessComponent";

export function RuntimeProcessComponent({
  processId,
  processSourceMode,
  width = "100%",
  height,
  showGrid = false,
  style,
  className,
  ...rootProps
}: ProcessComponentProps) {
  const runtime = useProcessRuntime();
  const effectiveSourceMode = processSourceMode ?? "project-default";
  const source = useMemo<ProcessSource | null>(
    () => effectiveSourceMode === "exact"
      ? (processId ? exactProcessSource(processId) : null)
      : projectDefaultProcessSource(runtime.projectId),
    [effectiveSourceMode, processId, runtime.projectId],
  );
  const { definition, loading, error } = useProcessDefinition(source);
  const bindingValues = useResolvedProcessBindings(
    definition?.bindings ?? EMPTY_BINDINGS,
    definition ? runtime.tagSource : null,
  );
  const rootStyle = { ...style, width, ...(height === undefined ? {} : { height }) };

  if (loading) {
    return <ProcessPlaceholder {...rootProps} className={className} style={rootStyle} width={width} height={height} label="Loading process…" />;
  }
  if (error) {
    return <ProcessPlaceholder {...rootProps} className={className} style={rootStyle} width={width} height={height} label={error} tone="error" />;
  }
  if (!definition) {
    return (
      <ProcessPlaceholder
        {...rootProps}
        className={className}
        style={rootStyle}
        width={width}
        height={height}
        label={effectiveSourceMode === "exact" ? "Saved process not found" : "No saved process for this project"}
        tone="error"
      />
    );
  }

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
    <div {...rootProps} className={className} style={rootStyle}>
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

const EMPTY_BINDINGS = {} as const;
