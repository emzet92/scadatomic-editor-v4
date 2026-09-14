import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SegmentedControl, SegmentedControlItem } from "../../src/uiframework/gui/ui";

const meta = {
  title: "Primitives/Segmented Control",
  parameters: {
    controls: { disable: true },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function InteractiveSegmentedControl() {
  const [value, setValue] = useState<"fixed" | "adaptive" | "auto">("fixed");

  return (
    <SegmentedControl>
      <SegmentedControlItem active={value === "fixed"} onClick={() => setValue("fixed")}>Fixed</SegmentedControlItem>
      <SegmentedControlItem active={value === "adaptive"} onClick={() => setValue("adaptive")}>Adaptive</SegmentedControlItem>
      <SegmentedControlItem active={value === "auto"} onClick={() => setValue("auto")}>Auto</SegmentedControlItem>
    </SegmentedControl>
  );
}

export const Interactive: Story = {
  render: () => (
    <div className="rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)] p-6">
      <InteractiveSegmentedControl />
    </div>
  ),
};
