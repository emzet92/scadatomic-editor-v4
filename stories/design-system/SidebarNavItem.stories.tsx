import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge, DatabaseIcon, SidebarNavItem, Surface } from "../../src/uiframework/gui/ui";

const meta = {
  title: "Organisms/Sidebar Nav Item",
  component: SidebarNavItem,
  args: {
    title: "Telemetry tags",
    description: "Runtime values available to this project.",
    active: false,
    variant: "card",
    disabled: false,
  },
  argTypes: {
    title: { control: "text" },
    description: { control: "text" },
    active: { control: "boolean" },
    variant: { control: "select", options: ["card", "row"] },
    disabled: { control: "boolean" },
    icon: { control: false },
    meta: { control: false },
  },
} satisfies Meta<typeof SidebarNavItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Surface padding="sm" className="mx-auto w-80">
      <SidebarNavItem
        {...args}
        icon={<DatabaseIcon size="sm" />}
        meta={<Badge variant="accent">24</Badge>}
      />
    </Surface>
  ),
};

export const Row: Story = { args: { variant: "row", active: true } };
