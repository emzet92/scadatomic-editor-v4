import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge, CheckIcon, Inline, Surface } from "../../src/uiframework/gui/ui";

const meta = {
  title: "Atoms/Badge",
  component: Badge,
  args: {
    children: "Ready",
    variant: "accent",
    size: "xs",
  },
  argTypes: {
    variant: { control: "select", options: ["neutral", "accent", "success", "warning", "danger"] },
    size: { control: "select", options: ["xs", "sm"] },
    children: { control: "text" },
    icon: { control: false },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Surface className="mx-auto max-w-md">
      <Inline justify="center"><Badge {...args} /></Inline>
    </Surface>
  ),
};

export const Statuses: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Surface className="mx-auto max-w-xl">
      <Inline wrap gap="md">
        <Badge>Draft</Badge>
        <Badge variant="accent">Selected</Badge>
        <Badge variant="success" icon={<CheckIcon size="xs" />}>Online</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="danger">Failed</Badge>
        <Badge size="sm" variant="accent">Large badge</Badge>
      </Inline>
    </Surface>
  ),
};
