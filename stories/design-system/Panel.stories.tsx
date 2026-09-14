import { Plus, ServerCog } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, EmptyAction, PanelCard, SectionHeader } from "../../src/uiframework/gui/ui";

const meta = {
  title: "Primitives/Panel",
  parameters: {
    controls: { disable: true },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Gallery: Story = {
  render: () => (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)] p-5">
        <SectionHeader
          title="Edge runtime"
          description="Reusable section heading with optional action."
          action={<Button size="xs" variant="secondary"><Plus size={12} />Add</Button>}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <PanelCard>
            <div className="text-xs font-semibold">Default card</div>
            <div className="mt-1 text-[11px] text-[var(--editor-text-muted)]">Neutral content surface.</div>
          </PanelCard>
          <PanelCard accent>
            <div className="text-xs font-semibold text-[var(--editor-accent)]">Accent card</div>
            <div className="mt-1 text-[11px] text-[var(--editor-text-muted)]">Selected or emphasized state.</div>
          </PanelCard>
        </div>
      </div>

      <EmptyAction onClick={() => undefined}>
        <ServerCog size={16} />
        Add first edge device
      </EmptyAction>
    </div>
  ),
};
