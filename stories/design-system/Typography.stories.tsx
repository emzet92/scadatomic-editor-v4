import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Stack, Surface, Text } from "../../src/uiframework/gui/ui";

const meta = {
  title: "Atoms/Typography",
  component: Text,
  args: {
    children: "SCADAtomic semantic typography",
    as: "p",
    variant: "body",
    tone: "default",
    truncate: false,
  },
  argTypes: {
    as: { control: "select", options: ["span", "p", "div", "label", "code"] },
    variant: { control: "select", options: ["body", "body-sm", "label", "caption", "metadata", "eyebrow", "code"] },
    tone: { control: "select", options: ["default", "muted", "soft", "accent", "success", "warning", "danger", "inherit"] },
    truncate: { control: "boolean" },
    children: { control: "text" },
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextPlayground: Story = {
  render: (args) => (
    <Surface className="mx-auto max-w-2xl">
      <Text {...args} className={args.truncate ? "max-w-72" : undefined} />
    </Surface>
  ),
};

export const TypeScale: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Surface className="mx-auto max-w-3xl">
      <Stack gap="lg">
        <Stack gap="xs">
          <Heading level={1} size="xl">Heading XL</Heading>
          <Heading level={2} size="lg">Heading LG</Heading>
          <Heading level={3} size="md">Heading MD</Heading>
          <Heading level={4} size="sm">Heading SM</Heading>
        </Stack>
        <Stack gap="sm">
          <Text variant="body">Body — primary product copy and longer explanations.</Text>
          <Text variant="body-sm" tone="muted">Body small — secondary interface copy.</Text>
          <Text variant="label">Label — controls and compact headings.</Text>
          <Text variant="caption" tone="soft">Caption — helper text and compact metadata.</Text>
          <Text variant="metadata" tone="muted">Metadata — dense secondary information.</Text>
          <Text variant="eyebrow" tone="accent">Eyebrow — section context</Text>
          <Text variant="code">ctx.tags.machine.speed</Text>
        </Stack>
      </Stack>
    </Surface>
  ),
};
