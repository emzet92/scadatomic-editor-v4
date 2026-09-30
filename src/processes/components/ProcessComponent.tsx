import { useMemo, type ComponentPropsWithoutRef, type CSSProperties } from "react";
import { exactProcessSource, type ProcessSource } from "../application/ProcessSource";
import { useProcessDefinition } from "../react/useProcesses";
import { resolveProcessFrame } from "../runtime/process-frame";
import { ProcessCanvas } from "./ProcessCanvas";

export type ProcessSourceMode = "exact" | "project-default";

export type ProcessComponentProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  processId?: string | undefined;
  /**
   * `project-default` is the migration-safe default for runtime instances.
   * Process-library drag items explicitly use `exact`.
   */
  processSourceMode?: ProcessSourceMode | undefined;
  width?: string | number | undefined;
  height?: string | number | undefined;
  showGrid?: boolean | undefined;
  style?: CSSProperties | undefined;
};

/** Designer renderer. A deterministic preview; no runtime/simulator coupling. */
export function ProcessComponent({
  processId,
  width = "100%",
  height,
  showGrid = true,
  style,
  className,
  ...rootProps
}: ProcessComponentProps) {
  const source = useMemo<ProcessSource | null>(
    () => processId ? exactProcessSource(processId) : null,
    [processId],
  );
  const { definition, loading, error } = useProcessDefinition(source);
  const rootStyle = { ...style, width, ...(height === undefined ? {} : { height }) };

  if (loading) {
    return <ProcessPlaceholder {...rootProps} className={className} style={rootStyle} width={width} height={height} label="Loading process…" />;
  }
  if (error) {
    return <ProcessPlaceholder {...rootProps} className={className} style={rootStyle} width={width} height={height} label={error} tone="error" />;
  }
  if (!definition) {
    return <ProcessPlaceholder {...rootProps} className={className} style={rootStyle} width={width} height={height} label="Select a saved process" />;
  }

  const frame = resolveProcessFrame(definition.path, definition.scene, 0.35);
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

type ProcessPlaceholderProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  width: string | number;
  height?: string | number | undefined;
  label: string;
  tone?: "neutral" | "error";
};

export function ProcessPlaceholder({
  width,
  height,
  label,
  tone = "neutral",
  style,
  className,
  ...rootProps
}: ProcessPlaceholderProps) {
  return (
    <div
      {...rootProps}
      style={{ width, minHeight: height ?? 180, ...(height === undefined ? {} : { height }), ...style }}
      className={`flex items-center justify-center rounded-xl border border-dashed px-4 text-xs ${
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-violet-200 bg-violet-50/50 text-violet-700"
      } ${className ?? ""}`}
    >
      {label}
    </div>
  );
}
