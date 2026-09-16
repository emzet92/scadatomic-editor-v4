import type { Meta, StoryObj } from "@storybook/react-vite";
import { AddIcon, Button, EmptyState, InboxIcon } from "../../src/uiframework/gui/ui";

const meta = {
  title: "Molecules/Empty State",
  component: EmptyState,
  args: {
    title: "No report components yet",
    description: "Add the first component to start composing this page.",
    compact: false,
  },
  argTypes: {
    title: { control: "text" },
    description: { control: "text" },
    compact: { control: "boolean" },
    icon: { control: false },
    actions: { control: false },
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <EmptyState
      {...args}
      className="mx-auto max-w-2xl"
      icon={<InboxIcon size="lg" />}
      actions={<Button variant="primary" leadingIcon={<AddIcon size="sm" />}>Add component</Button>}
    />
  ),
};

export const Compact: Story = {
  args: {
    compact: true,
    title: "Nothing selected",
    description: "Select an item in the tree to edit its properties.",
  },
};
