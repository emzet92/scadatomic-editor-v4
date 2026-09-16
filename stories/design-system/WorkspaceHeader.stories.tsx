import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";
import {
  AddIcon,
  Box,
  Button,
  IconButton,
  NotificationIcon,
} from "../../src/uiframework/gui/ui";
import { WorkspaceHeader } from "../../src/uiframework/gui/workspace/WorkspaceHeader";

const meta = {
  title: "Organisms/Workspace Header",
  component: WorkspaceHeader,
  args: {
    active: "editor",
    projectId: "demo",
    scriptId: "default",
    title: "Demo project",
    subtitle: "Packaging line",
  },
  argTypes: {
    active: { control: "select", options: ["editor", "scripts", "dependencies", "reports", "cloud"] },
    projectId: { control: "text" },
    scriptId: { control: "text" },
    title: { control: "text" },
    subtitle: { control: "text" },
    actions: { control: false },
    onBeforeNavigate: { control: false },
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof WorkspaceHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <MemoryRouter initialEntries={["/project/demo"]}>
      <Box className="min-h-[260px] bg-[var(--editor-app-bg)]">
        <WorkspaceHeader
          {...args}
          actions={
            <>
              <IconButton aria-label="Notifications"><NotificationIcon size="sm" /></IconButton>
              <Button variant="primary" leadingIcon={<AddIcon size="sm" />}>Deploy</Button>
            </>
          }
        />
      </Box>
    </MemoryRouter>
  ),
};

export const Reports: Story = {
  args: { active: "reports", title: "Report Designer", subtitle: "Page-based report authoring" },
  render: (args) => (
    <MemoryRouter initialEntries={["/project/demo/reports"]}>
      <Box className="min-h-[260px] bg-[var(--editor-app-bg)]">
        <WorkspaceHeader {...args} actions={<Button variant="secondary">Preview report</Button>} />
      </Box>
    </MemoryRouter>
  ),
};

export const Cloud: Story = {
  args: { active: "cloud", projectId: undefined, title: "Cloud", subtitle: "Fleet Management" },
  render: (args) => (
    <MemoryRouter initialEntries={["/cloud/fleet"]}>
      <Box className="min-h-[260px] bg-[var(--editor-app-bg)]">
        <WorkspaceHeader {...args} actions={<Button variant="primary">Create registration key</Button>} />
      </Box>
    </MemoryRouter>
  ),
};
