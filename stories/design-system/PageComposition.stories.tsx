import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AddIcon,
  Badge,
  Button,
  DatabaseIcon,
  EditorPage,
  Grid,
  MetricCard,
  PanelCard,
  Stack,
  Text,
} from "../../src/uiframework/gui/ui";

type CompositionArgs = {
  title: string;
  description: string;
  eyebrow: string;
  size: "md" | "lg" | "xl" | "full";
  metricCount: number;
  panelVariant: "default" | "muted" | "accent" | "warning" | "danger";
  showAction: boolean;
};

const meta = {
  title: "Templates/Composition Playground",
  args: {
    title: "Project telemetry",
    description: "A configurable whole-page composition using the shared design-system primitives.",
    eyebrow: "Data workspace",
    size: "lg",
    metricCount: 3,
    panelVariant: "default",
    showAction: true,
  },
  argTypes: {
    title: { control: "text" },
    description: { control: "text" },
    eyebrow: { control: "text" },
    size: { control: "select", options: ["md", "lg", "xl", "full"] },
    metricCount: { control: { type: "range", min: 1, max: 6, step: 1 } },
    panelVariant: { control: "select", options: ["default", "muted", "accent", "warning", "danger"] },
    showAction: { control: "boolean" },
  },
} satisfies Meta<CompositionArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <EditorPage
      size={args.size}
      eyebrow={args.eyebrow}
      title={args.title}
      description={args.description}
      icon={<DatabaseIcon size="lg" />}
      actions={args.showAction ? <Button variant="primary" leadingIcon={<AddIcon size="sm" />}>Create tag</Button> : undefined}
    >
      <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: args.metricCount }, (_, index) => (
          <MetricCard key={index} value={(index + 1) * 12} label={`Metric ${index + 1}`} description="Live project statistic" />
        ))}
      </Grid>
      <PanelCard variant={args.panelVariant} padding="lg">
        <Stack gap="sm">
          <Badge variant="accent">Composition</Badge>
          <Text variant="label">Configurable content surface</Text>
          <Text tone="muted">Use Controls to change page width, copy, metric density and semantic panel state.</Text>
        </Stack>
      </PanelCard>
    </EditorPage>
  ),
};
