import { Maximize2, MoveHorizontal, MoveVertical, Radius } from "lucide-react";
import type { ReactNode } from "react";
import { defaultButtonProps } from "../../component-props";
import type { UiNode } from "../../core/document";
import type { UpdateNode } from "./property-panel-types";
import { TextInput } from "../ui";
import { SpacingValueControl } from "./SpacingValueControl";

export function ButtonLayoutEditor({
  node,
  updateNode,
}: {
  node: UiNode;
  updateNode: UpdateNode;
}) {
  const props = node.props ?? {};
  const paddingX = props.paddingX ?? defaultButtonProps.paddingX;
  const paddingY = props.paddingY ?? defaultButtonProps.paddingY;
  const marginX = props.marginX ?? defaultButtonProps.marginX;
  const marginY = props.marginY ?? defaultButtonProps.marginY;
  const borderRadius = readNumber(
    props.borderRadius,
    defaultButtonProps.borderRadius
  );

  function patch(next: Record<string, unknown>) {
    updateNode(node.id, (current) => ({
      ...current,
      props: {
        ...(current.props ?? {}),
        ...next,
      },
    }));
  }

  return (
    <section className="overflow-hidden rounded-[18px] border border-[var(--editor-border)] bg-[var(--editor-surface)] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-2.5 px-3.5 pb-2.5 pt-3.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-[12px] bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]">
          <Maximize2 size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-[var(--editor-text)]">
            Button spacing
          </div>
          <div className="mt-0.5 text-[10px] leading-4 text-[var(--editor-text-muted)]">
            Compact by default. Grid keeps margins inside the assigned cell.
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--editor-border)] p-3">
        <div className="grid grid-cols-2 gap-2">
          <SpacingValueControl
            compact
            icon={<MoveHorizontal size={12} />}
            label="Padding X"
            value={paddingX}
            fallback={defaultButtonProps.paddingX}
            min={0}
            max={64}
            onChange={(value) => patch({ paddingX: value })}
          />
          <SpacingValueControl
            compact
            icon={<MoveVertical size={12} />}
            label="Padding Y"
            value={paddingY}
            fallback={defaultButtonProps.paddingY}
            min={0}
            max={48}
            onChange={(value) => patch({ paddingY: value })}
          />
          <SpacingValueControl
            compact
            icon={<MoveHorizontal size={12} />}
            label="Margin X"
            value={marginX}
            fallback={defaultButtonProps.marginX}
            min={0}
            max={64}
            onChange={(value) => patch({ marginX: value })}
          />
          <SpacingValueControl
            compact
            icon={<MoveVertical size={12} />}
            label="Margin Y"
            value={marginY}
            fallback={defaultButtonProps.marginY}
            min={0}
            max={64}
            onChange={(value) => patch({ marginY: value })}
          />
        </div>

        <div className="mt-2">
          <CompactNumber
            icon={<Radius size={12} />}
            label="Corner radius"
            value={borderRadius}
            min={0}
            max={64}
            onChange={(value) => patch({ borderRadius: value })}
          />
        </div>
      </div>
    </section>
  );
}

function CompactNumber({
  icon,
  label,
  value,
  min,
  max,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="rounded-[12px] bg-[var(--editor-surface-muted)] px-2.5 py-2">
      <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-[var(--editor-text-muted)]">
        {icon}
        {label}
      </span>
      <div className="mt-1.5 flex items-center gap-1.5">
        <TextInput
          controlSize="sm"
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) =>
            onChange(clamp(Number(event.target.value), min, max))
          }
          className="h-7 min-w-0 flex-1 px-2 text-xs"
        />
        <span className="text-[9px] text-[var(--editor-text-soft)]">px</span>
      </div>
    </label>
  );
}

function readNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}
