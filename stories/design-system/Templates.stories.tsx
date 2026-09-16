import { Database, Plus } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  EditorPage,
  Icon,
  MetricCard,
  Grid,
  PanelCard,
  WorkspaceShell,
} from "../../src/uiframework/gui/ui";

const meta = { title: "Templates/Screens", parameters: { controls: { disable: true }, layout: "fullscreen" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const EditorPageTemplate: Story = {
  render: () => (
    <div className="min-h-[620px] bg-[var(--editor-app-bg)]">
      <EditorPage
        title="Project Data"
        description="Whole-screen content template composed from organisms and atoms."
        icon={<Icon glyph={Database} size="lg" />}
        actions={<Button variant="primary" leadingIcon={<Icon glyph={Plus} size="sm" />}>Create tag</Button>}
      >
        <Grid className="md:grid-cols-3">
          <MetricCard value="24" label="Tags" />
          <MetricCard value="6" label="UDTs" />
          <MetricCard value="3" label="Drivers" />
        </Grid>
        <PanelCard className="h-52">Screen content</PanelCard>
      </EditorPage>
    </div>
  ),
};

export const WorkspaceShellTemplate: Story = {
  render: () => (
    <div className="h-[620px]">
      <WorkspaceShell
        header={<div className="border-b border-[var(--editor-border)] bg-[var(--editor-surface)] p-4 text-sm font-semibold">Header slot</div>}
        sidebar={<div className="w-56 p-4 text-xs text-[var(--editor-text-muted)]">Sidebar slot</div>}
        inspector={<div className="w-64 p-4 text-xs text-[var(--editor-text-muted)]">Inspector slot</div>}
      >
        <div className="p-8"><PanelCard className="h-80">Main workspace slot</PanelCard></div>
      </WorkspaceShell>
    </div>
  ),
};
