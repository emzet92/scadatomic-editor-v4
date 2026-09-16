import { Plus, Settings, Trash2 } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, IconButton } from "../../src/uiframework/gui/ui";

const meta = {
  title: "Atoms/Button",
  component: Button,
  args: {
    children: "Button",
    variant: "secondary",
    size: "sm",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "danger", "text"],
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "icon-xs", "icon-sm", "icon"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)] p-6">
      <Button variant="primary">Create project</Button>
      <Button variant="secondary">Cancel</Button>
      <Button variant="ghost">More</Button>
      <Button variant="danger">Delete</Button>
      <Button variant="text">Learn more</Button>
      <Button variant="primary" disabled>Disabled</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)] p-6">
      <Button size="xs">Extra small</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
    </div>
  ),
};

export const IconButtons: Story = {
  render: () => (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)] p-6">
      <IconButton aria-label="Add" variant="primary"><Plus size={14} /></IconButton>
      <IconButton aria-label="Settings"><Settings size={14} /></IconButton>
      <IconButton aria-label="Delete" variant="danger"><Trash2 size={14} /></IconButton>
    </div>
  ),
};
