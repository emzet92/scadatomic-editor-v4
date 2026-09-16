import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";
import {
  AddIcon,
  Box,
  Button,
  IconButton,
  NotificationIcon
} from "../../src/uiframework/gui/ui";
import { WorkspaceHeader } from "../../src/uiframework/gui/workspace/WorkspaceHeader";

const meta = {
  title: "Organisms/Workspace Header",
  component: WorkspaceHeader,
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
  },
} satisfies Meta<typeof WorkspaceHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Editor: Story = {
  render: () => (
    <MemoryRouter initialEntries={["/project/demo"]}>
      <Box className="min-h-[260px] bg-[var(--editor-app-bg)]">
        <WorkspaceHeader
          active="editor"
          projectId="demo"
          title="Demo project"
          subtitle="Packaging line"
          actions={
            <>
              <IconButton aria-label="Notifications"><NotificationIcon size={14} /></IconButton>
              <Button variant="primary"><AddIcon size={13} />Deploy</Button>
            </>
          }
        />
      </Box>
    </MemoryRouter>
  ),
};

export const Reports: Story = {
  render: () => (
    <MemoryRouter initialEntries={["/project/demo/reports"]}>
      <Box className="min-h-[260px] bg-[var(--editor-app-bg)]">
        <WorkspaceHeader
          active="reports"
          projectId="demo"
          title="Report Designer"
          subtitle="Page-based report authoring"
          actions={<Button variant="secondary">Preview report</Button>}
        />
      </Box>
    </MemoryRouter>
  ),
};

export const Cloud: Story = {
  render: () => (
    <MemoryRouter initialEntries={["/cloud/fleet"]}>
      <Box className="min-h-[260px] bg-[var(--editor-app-bg)]">
        <WorkspaceHeader
          active="cloud"
          title="Cloud"
          subtitle="Fleet Management"
          actions={<Button variant="primary">Create registration key</Button>}
        />
      </Box>
    </MemoryRouter>
  ),
};
