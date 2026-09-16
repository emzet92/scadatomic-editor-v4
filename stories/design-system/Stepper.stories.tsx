import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Inline, Stepper, Surface, Text } from "../../src/uiframework/gui/ui";

type StepperStoryArgs = {
  initialValue: number;
  step: number;
  suffix: string;
  min: number;
};

const meta = {
  title: "Molecules/Stepper",
  args: {
    initialValue: 220,
    step: 20,
    suffix: "px",
    min: 0,
  },
  argTypes: {
    initialValue: { control: { type: "number", min: 0 } },
    step: { control: { type: "number", min: 1 } },
    suffix: { control: "text" },
    min: { control: { type: "number" } },
  },
} satisfies Meta<StepperStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

function InteractiveStepper({ initialValue, step, suffix, min }: StepperStoryArgs) {
  const [value, setValue] = useState(initialValue);
  useEffect(() => setValue(initialValue), [initialValue]);
  return (
    <Stepper
      value={value}
      suffix={suffix}
      onDecrease={() => setValue((current) => Math.max(min, current - step))}
      onIncrease={() => setValue((current) => current + step)}
    />
  );
}

export const Playground: Story = {
  render: (args) => (
    <Surface className="inline-flex">
      <Inline gap="md">
        <Text variant="label">Width</Text>
        <InteractiveStepper {...args} />
      </Inline>
    </Surface>
  ),
};
