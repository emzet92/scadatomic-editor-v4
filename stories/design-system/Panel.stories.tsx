import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AddIcon,
  Button,
  EmptyAction,
  PanelCard,
  PanelSection,
  SectionHeader,
  ServerSettingsIcon,
  Stack,
  Text,
} from "../../src/uiframework/gui/ui";

const meta = {
  title: "Organisms/Panel",
  component: PanelCard,
  args: {
    children: "Panel content",
    variant: "default",
    padding: "md",
    accent: false,
  },
  argTypes: {
    variant: { control: "select", options: ["default", "muted", "accent", "warning", "danger"] },
    padding: { control: "select", options: ["none", "sm", "md", "lg"] },
    accent: { control: "boolean" },
    children: { control: "text" },
  },
} satisfies Meta<typeof PanelCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <PanelCard {...args} className="mx-auto max-w-xl">
      <Stack gap="xs">
        <Text variant="label">{args.children}</Text>
        <Text tone="muted">Change semantic variant and padding from Storybook Controls.</Text>
      </Stack>
    </PanelCard>
  ),
};

export const Gallery: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="mx-auto max-w-2xl space-y-5">
      <PanelSection>
        <SectionHeader
          title="Edge runtime"
          description="Reusable section heading with optional action."
          action={<Button size="xs" variant="secondary" leadingIcon={<AddIcon size="xs" />}>Add</Button>}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <PanelCard>
            <Text variant="label">Default card</Text>
            <Text as="div" variant="caption" tone="muted" className="mt-1">Neutral content surface.</Text>
          </PanelCard>
          <PanelCard variant="accent">
            <Text variant="label" tone="accent">Accent card</Text>
            <Text as="div" variant="caption" tone="muted" className="mt-1">Selected or emphasized state.</Text>
          </PanelCard>
        </div>
      </PanelSection>

      <PanelSection divided>
        <SectionHeader title="Divided section" description="PanelSection can own standard vertical rhythm and dividers." />
        <PanelCard variant="muted" padding="lg">Muted card with large padding.</PanelCard>
      </PanelSection>

      <EmptyAction onClick={() => undefined}>
        <ServerSettingsIcon size="md" />
        Add first edge device
      </EmptyAction>
    </div>
  ),
};
