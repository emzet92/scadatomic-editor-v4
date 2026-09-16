import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SegmentedControl, SegmentedControlItem, Surface, Text } from "../../src/uiframework/gui/ui";

type SegmentedStoryArgs = {
  variant: "outline" | "soft";
  fullWidth: boolean;
  itemCount: number;
  initialIndex: number;
};

const meta = {
  title: "Molecules/Segmented Control",
  args: {
    variant: "outline",
    fullWidth: false,
    itemCount: 3,
    initialIndex: 0,
  },
  argTypes: {
    variant: { control: "select", options: ["outline", "soft"] },
    fullWidth: { control: "boolean" },
    itemCount: { control: { type: "range", min: 2, max: 5, step: 1 } },
    initialIndex: { control: { type: "range", min: 0, max: 4, step: 1 } },
  },
} satisfies Meta<SegmentedStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

const LABELS = ["Fixed", "Adaptive", "Auto", "Fill", "Hug"];

function InteractiveSegmentedControl({ variant, fullWidth, itemCount, initialIndex }: SegmentedStoryArgs) {
  const safeInitial = Math.min(initialIndex, itemCount - 1);
  const [value, setValue] = useState(safeInitial);
  useEffect(() => setValue(safeInitial), [safeInitial, itemCount]);

  return (
    <SegmentedControl variant={variant} fullWidth={fullWidth}>
      {LABELS.slice(0, itemCount).map((label, index) => (
        <SegmentedControlItem
          key={label}
          variant={variant}
          grow={fullWidth}
          active={value === index}
          onClick={() => setValue(index)}
        >
          {label}
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  );
}

export const Playground: Story = {
  render: (args) => (
    <Surface className="mx-auto max-w-xl">
      <Text as="div" variant="caption" tone="muted" className="mb-3">Try variant, width and number of items from Controls.</Text>
      <InteractiveSegmentedControl {...args} />
    </Surface>
  ),
};

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Surface className="max-w-xl">
      <div className="space-y-5">
        <div><Text as="div" variant="label" className="mb-2">Outline</Text><InteractiveSegmentedControl variant="outline" fullWidth={false} itemCount={3} initialIndex={0} /></div>
        <div><Text as="div" variant="label" className="mb-2">Soft / full width</Text><InteractiveSegmentedControl variant="soft" fullWidth itemCount={3} initialIndex={1} /></div>
      </div>
    </Surface>
  ),
};
