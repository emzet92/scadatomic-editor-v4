import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, DatabaseIcon, DeleteIcon, EntityHeader, Surface } from "../../src/uiframework/gui/ui";

const meta = {
  title: "Organisms/Entity Header",
  component: EntityHeader,
  args: {
    eyebrow: "Data / UDT",
    title: "Pump station",
    description: "Reusable equipment model with 12 fields and 4 methods.",
    compact: false,
  },
  argTypes: {
    eyebrow: { control: "text" },
    title: { control: "text" },
    description: { control: "text" },
    compact: { control: "boolean" },
    icon: { control: false },
    actions: { control: false },
  },
} satisfies Meta<typeof EntityHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Surface className="mx-auto max-w-4xl">
      <EntityHeader
        {...args}
        icon={<DatabaseIcon size="lg" />}
        actions={<Button variant="danger" leadingIcon={<DeleteIcon size="sm" />}>Delete</Button>}
      />
    </Surface>
  ),
};
