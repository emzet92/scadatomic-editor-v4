import type { Meta, StoryObj } from "@storybook/react-vite";
import { Callout, InfoIcon, Stack } from "../../src/uiframework/gui/ui";

const meta = {
  title: "Molecules/Callout",
  component: Callout,
  args: {
    children: "Use this area for contextual feedback, warnings and lightweight system messages.",
    variant: "muted",
    size: "md",
    dashed: false,
  },
  argTypes: {
    variant: { control: "select", options: ["muted", "accent", "warning", "danger", "success"] },
    size: { control: "select", options: ["sm", "md"] },
    dashed: { control: "boolean" },
    children: { control: "text" },
    icon: { control: false },
  },
} satisfies Meta<typeof Callout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => <Callout {...args} className="mx-auto max-w-2xl" />,
};

export const WithIcon: Story = {
  args: { variant: "accent" },
  render: (args) => (
    <Stack className="mx-auto max-w-2xl">
      <Callout {...args} icon={<InfoIcon size="sm" />} />
    </Stack>
  ),
};
