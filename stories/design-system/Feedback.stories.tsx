import { AlertTriangle, Check, Inbox, Info, Plus, X } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge, Button, Callout, EmptyState } from "../../src/uiframework/gui/ui";

const meta = {
  title: "Molecules/Feedback",
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Badges: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)] p-6">
      <Badge>Neutral</Badge>
      <Badge variant="accent">Selected</Badge>
      <Badge variant="success" icon={<Check size={9} />}>Ready</Badge>
      <Badge variant="warning" icon={<AlertTriangle size={9} />}>Default</Badge>
      <Badge variant="danger" icon={<X size={9} />}>Error</Badge>
      <Badge size="sm" variant="accent">Larger</Badge>
    </div>
  ),
};

export const Callouts: Story = {
  render: () => (
    <div className="mx-auto max-w-xl space-y-3">
      <Callout icon={<Info size={14} />}>Neutral helper copy for secondary information.</Callout>
      <Callout variant="accent">An accent callout for context related to the current selection.</Callout>
      <Callout variant="success">Configuration is valid and ready to use.</Callout>
      <Callout variant="warning">A referenced design token is missing.</Callout>
      <Callout variant="danger">The operation could not be completed.</Callout>
      <Callout dashed size="sm">Compact dashed state for empty sidebar sections.</Callout>
    </div>
  ),
};

export const EmptyStates: Story = {
  render: () => (
    <div className="mx-auto max-w-xl space-y-4">
      <EmptyState
        icon={<Inbox size={20} />}
        title="No resources yet"
        description="Create the first resource to start building this library."
        actions={<Button size="sm" variant="primary"><Plus size={13} />Create resource</Button>}
      />
      <EmptyState
        compact
        title="Nothing selected"
        description="Pick an item from the sidebar to edit its settings."
      />
    </div>
  ),
};
