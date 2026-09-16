import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stepper } from "../../src/uiframework/gui/ui";

const meta = {
  title: "Primitives/Stepper",
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function InteractiveStepper() {
  const [value, setValue] = useState(220);
  return (
    <Stepper
      value={value}
      suffix="px"
      onDecrease={() => setValue((current) => Math.max(0, current - 20))}
      onIncrease={() => setValue((current) => current + 20)}
    />
  );
}

export const Interactive: Story = {
  render: () => <div className="flex rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)] p-6"><InteractiveStepper /></div>,
};
