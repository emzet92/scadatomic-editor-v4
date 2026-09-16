import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AddIcon,
  Button,
  DataGrid,
  DataGridHeader,
  DataGridRow,
  PageContainer,
  PageHeader,
  PaletteIcon,
  PanelCard,
  PanelSection,
  SectionHeader
} from "../../src/uiframework/gui/ui";

const meta = {
  title: "Templates/Page Layout",
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const GRID = "grid-cols-[minmax(160px,1fr)_120px_100px]";

export const PageShell: Story = {
  render: () => (
    <div className="rounded-xl border border-[var(--editor-border)] bg-[var(--editor-canvas-bg)]">
      <PageContainer size="lg">
        <PageHeader
          eyebrow="Design system"
          icon={<PaletteIcon size={14} />}
          title="Color library"
          description="A standard workspace shell keeps title, description and actions aligned across token libraries."
          actions={<Button size="sm" variant="primary"><AddIcon size={13} />Add color</Button>}
        />
        <PanelSection>
          <SectionHeader title="Tokens" description="Reusable semantic values." />
          <DataGrid>
            <DataGridHeader columns={GRID}>
              <span>Name</span><span>Value</span><span>Usage</span>
            </DataGridHeader>
            <DataGridRow columns={GRID}>
              <span className="font-medium">Brand primary</span><code>#7c3aed</code><span>12 uses</span>
            </DataGridRow>
            <DataGridRow columns={GRID}>
              <span className="font-medium">Surface</span><code>#ffffff</code><span>28 uses</span>
            </DataGridRow>
          </DataGrid>
        </PanelSection>
      </PageContainer>
    </div>
  ),
};

export const PanelVariants: Story = {
  render: () => (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <PanelCard><strong>Default</strong><p className="mt-1 text-xs text-[var(--editor-text-muted)]">Normal content surface.</p></PanelCard>
      <PanelCard variant="muted"><strong>Muted</strong><p className="mt-1 text-xs text-[var(--editor-text-muted)]">Secondary grouping.</p></PanelCard>
      <PanelCard variant="accent"><strong>Accent</strong><p className="mt-1 text-xs text-[var(--editor-text-muted)]">Selected content.</p></PanelCard>
      <PanelCard variant="warning"><strong>Warning</strong><p className="mt-1 text-xs text-amber-700">Needs attention.</p></PanelCard>
      <PanelCard variant="danger"><strong>Danger</strong><p className="mt-1 text-xs text-red-700">Destructive context.</p></PanelCard>
      <PanelCard padding="none"><div className="p-3"><strong>No padding</strong><p className="mt-1 text-xs text-[var(--editor-text-muted)]">For media and custom inner layouts.</p></div></PanelCard>
    </div>
  ),
};
