import type { CSSProperties } from "react";
import { useProcessDefinition } from "../react/useProcesses";
import { resolveProcessFrame } from "../runtime/process-frame";
import { ProcessCanvas } from "./ProcessCanvas";

export type ProcessComponentProps = {
  processId?: string | undefined;
  width?: string | number | undefined;
  height?: string | number | undefined;
  showGrid?: boolean | undefined;
  style?: CSSProperties | undefined;
  className?: string | undefined;
};

/** Designer renderer. A deterministic preview; no runtime/simulator coupling. */
export function ProcessComponent({
  processId,
  width = "100%",
  height,
  showGrid = true,
  style,
  className,
}: ProcessComponentProps) {
  const { definition, loading, error } = useProcessDefinition(processId);

  if (loading) return <ProcessPlaceholder width={width} height={height} label="Loading process…" />;
  if (error) return <ProcessPlaceholder width={width} height={height} label={error} tone="error" />;
  if (!definition) return <ProcessPlaceholder width={width} height={height} label="Select a saved process" />;

  const frame = resolveProcessFrame(definition.path, definition.scene, 0.35);
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

export function ProcessPlaceholder({
  width,
  height,
  label,
  tone = "neutral",
}: {
  width: string | number;
  height?: string | number | undefined;
  label: string;
  tone?: "neutral" | "error";
}) {
  return (
    <div
      style={{ width, minHeight: height ?? 180, ...(height === undefined ? {} : { height }) }}
      className={`flex items-center justify-center rounded-xl border border-dashed px-4 text-xs ${
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-violet-200 bg-violet-50/50 text-violet-700"
      }`}
    >
      {label}
    </div>
  );
}
