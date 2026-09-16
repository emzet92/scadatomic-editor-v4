import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack, Surface, Text } from "../../src/uiframework/gui/ui";

const meta = {
  title: "Atoms/Surface",
  component: Surface,
  args: {
    children: "Configurable surface",
    variant: "default",
    border: "default",
    radius: "md",
    padding: "md",
    shadow: "none",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "muted", "accent", "success", "warning", "danger", "canvas", "transparent"],
    },
    border: { control: "select", options: ["none", "default", "strong", "accent"] },
    radius: { control: "select", options: ["none", "sm", "md", "lg", "xl", "2xl", "full"] },
    padding: { control: "select", options: ["none", "xs", "sm", "md", "lg"] },
    shadow: { control: "select", options: ["none", "sm", "md"] },
    children: { control: "text" },
  },
} satisfies Meta<typeof Surface>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Surface {...args} className="mx-auto max-w-xl">
      <Stack gap="xs">
        <Text variant="label">{args.children}</Text>
        <Text tone="muted">Change variant, border, radius, padding and shadow in Controls.</Text>
      </Stack>
    </Surface>
  ),
};

export const VariantMatrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {(["default", "muted", "accent", "success", "warning", "danger", "canvas", "transparent"] as const).map((variant) => (
        <Surface key={variant} variant={variant} padding="lg" className="min-h-28">
          <Text variant="label">{variant}</Text>
          <Text as="div" variant="caption" tone="muted" className="mt-2">Same structure, different semantic surface.</Text>
        </Surface>
      ))}
    </div>
  ),
};
