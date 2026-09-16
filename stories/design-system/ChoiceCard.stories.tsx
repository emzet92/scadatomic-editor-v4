import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChoiceCard, GridIcon, Surface } from "../../src/uiframework/gui/ui";

const meta = {
  title: "Molecules/Choice Card",
  component: ChoiceCard,
  args: {
    title: "Grid layout",
    description: "Arrange children in a responsive grid.",
    selected: false,
    disabled: false,
  },
  argTypes: {
    title: { control: "text" },
    description: { control: "text" },
    selected: { control: "boolean" },
    disabled: { control: "boolean" },
    icon: { control: false },
    preview: { control: false },
  },
} satisfies Meta<typeof ChoiceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="mx-auto max-w-sm">
      <ChoiceCard
        {...args}
        icon={<GridIcon size="md" />}
        preview={<Surface variant="canvas" border="none" className="h-20" />}
      />
    </div>
  ),
};

export const Selected: Story = {
  args: { selected: true },
  render: (args) => <div className="max-w-sm"><ChoiceCard {...args} icon={<GridIcon size="md" />} /></div>,
};
