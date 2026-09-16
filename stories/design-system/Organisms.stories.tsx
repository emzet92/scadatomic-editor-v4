import { Database, Plus, Trash2 } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  EntityHeader,
  Icon,
  MetricCard,
  PanelCard,
  Stack,
  Toolbar,
} from "../../src/uiframework/gui/ui";

const meta = { title: "Organisms/Core", parameters: { controls: { disable: true } } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const EntityHeaderPattern: Story = {
  render: () => (
    <EntityHeader
      eyebrow="Data"
      icon={<Icon glyph={Database} size="lg" />}
      title="Pump1"
      description="Pump UDT instance · 8 fields"
      actions={<Button variant="danger" leadingIcon={<Icon glyph={Trash2} size="sm" />}>Delete</Button>}
    />
  ),
};

export const Metrics: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-3 md:grid-cols-3">
      <MetricCard icon={<Icon glyph={Database} tone="accent" />} value="48" label="Tags" />
      <MetricCard value="12" label="UDTs" description="Reusable project-local schemas" />
      <MetricCard value="Online" label="Runtime" description="Event driven" />
    </div>
  ),
};

export const ToolbarPattern: Story = {
  render: () => (
    <PanelCard padding="none" className="overflow-hidden">
      <Toolbar
        start={<strong className="text-sm">SCADAtomic</strong>}
        center={<span className="text-xs text-[var(--editor-text-muted)]">Editor · Scripts · Dependencies</span>}
        end={<Button variant="primary" leadingIcon={<Icon glyph={Plus} size="sm" />}>Deploy</Button>}
      />
      <Stack className="p-6"><span className="text-xs text-[var(--editor-text-muted)]">Toolbar is an organism composed from layout, typography, button and surface atoms.</span></Stack>
    </PanelCard>
  ),
};
