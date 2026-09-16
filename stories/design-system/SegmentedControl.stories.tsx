import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SegmentedControl, SegmentedControlItem } from "../../src/uiframework/gui/ui";

const meta = {
  title: "Primitives/Segmented Control",
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function InteractiveSegmentedControl({ variant = "outline" }: { variant?: "outline" | "soft" }) {
  const [value, setValue] = useState<"fixed" | "adaptive" | "auto">("fixed");
  return (
    <SegmentedControl variant={variant} fullWidth={variant === "soft"}>
      <SegmentedControlItem variant={variant} grow={variant === "soft"} active={value === "fixed"} onClick={() => setValue("fixed")}>Fixed</SegmentedControlItem>
      <SegmentedControlItem variant={variant} grow={variant === "soft"} active={value === "adaptive"} onClick={() => setValue("adaptive")}>Adaptive</SegmentedControlItem>
      <SegmentedControlItem variant={variant} grow={variant === "soft"} active={value === "auto"} onClick={() => setValue("auto")}>Auto</SegmentedControlItem>
    </SegmentedControl>
  );
}

export const Variants: Story = {
  render: () => (
    <div className="max-w-xl space-y-5 rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)] p-6">
      <div><div className="mb-2 text-xs font-semibold">Outline</div><InteractiveSegmentedControl /></div>
      <div><div className="mb-2 text-xs font-semibold">Soft / full width</div><InteractiveSegmentedControl variant="soft" /></div>
    </div>
  ),
};
