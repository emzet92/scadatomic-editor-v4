import {
  Box,
  HorizontalResizeIcon,
  MaximizeIcon,
  RadiusIcon,
  VerticalResizeIcon
} from "../ui";
import { defaultButtonProps } from "../../component-props";
import type { UiNode } from "../../core/document";
import type { UpdateNode } from "./property-panel-types";
import { SpacingValueControl } from "./SpacingValueControl";
import { RadiusValueControl } from "./RadiusValueControl";
import { ShadowValueControl } from "./ShadowValueControl";
import { BorderValueControl } from "./BorderValueControl";

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
  const border = props.border;
  const borderRadius = props.borderRadius ?? defaultButtonProps.borderRadius;
  const shadow = props.shadow;

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
      <Box className="flex items-start gap-2.5 px-3.5 pb-2.5 pt-3.5">
        <Box className="flex size-8 shrink-0 items-center justify-center rounded-[12px] bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]">
          <MaximizeIcon size={15} />
        </Box>
        <Box className="min-w-0 flex-1">
          <Box className="text-xs font-semibold text-[var(--editor-text)]">
            Button spacing
          </Box>
          <Box className="mt-0.5 text-[10px] leading-4 text-[var(--editor-text-muted)]">
            Compact by default. Grid keeps margins inside the assigned cell.
          </Box>
        </Box>
      </Box>

      <Box className="border-t border-[var(--editor-border)] p-3">
        <Box className="grid grid-cols-2 gap-2">
          <SpacingValueControl
            compact
            icon={<HorizontalResizeIcon size={12} />}
            label="Padding X"
            value={paddingX}
            fallback={defaultButtonProps.paddingX}
            min={0}
            max={64}
            onChange={(value) => patch({ paddingX: value })}
          />
          <SpacingValueControl
            compact
            icon={<VerticalResizeIcon size={12} />}
            label="Padding Y"
            value={paddingY}
            fallback={defaultButtonProps.paddingY}
            min={0}
            max={48}
            onChange={(value) => patch({ paddingY: value })}
          />
          <SpacingValueControl
            compact
            icon={<HorizontalResizeIcon size={12} />}
            label="Margin X"
            value={marginX}
            fallback={defaultButtonProps.marginX}
            min={0}
            max={64}
            onChange={(value) => patch({ marginX: value })}
          />
          <SpacingValueControl
            compact
            icon={<VerticalResizeIcon size={12} />}
            label="Margin Y"
            value={marginY}
            fallback={defaultButtonProps.marginY}
            min={0}
            max={64}
            onChange={(value) => patch({ marginY: value })}
          />
        </Box>

        <Box className="mt-2 space-y-2">
          <BorderValueControl
            label="Border / stroke"
            value={border}
            onChange={(value) => patch({ border: value })}
          />
          <RadiusValueControl
            compact
            icon={<RadiusIcon size={12} />}
            label="Corner radius"
            value={borderRadius}
            fallback={defaultButtonProps.borderRadius}
            min={0}
            max={999}
            onChange={(value) => patch({ borderRadius: value })}
          />
        </Box>

        <Box className="mt-2">
          <ShadowValueControl
            label="Shadow / elevation"
            value={shadow}
            onChange={(value) => patch({ shadow: value })}
          />
        </Box>
      </Box>
    </section>
  );
}
