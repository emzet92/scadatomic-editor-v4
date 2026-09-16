import { KeyRound } from "lucide-react";
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ConfirmDialog, Dialog, FormField, TextInput } from "../../src/uiframework/gui/ui";

const meta = {
  title: "Organisms/Dialog",
  parameters: {
    controls: { disable: true },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function DialogDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog
        open={open}
        title="Create registration key"
        description="Generate a short-lived key for onboarding a new edge agent."
        icon={<div className="flex size-8 items-center justify-center rounded-full bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]"><KeyRound size={15} /></div>}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setOpen(false)}>Create key</Button>
          </>
        }
      >
        <FormField label="Key name" description="Use a descriptive label for audit logs.">
          <TextInput placeholder="Packaging line 02" autoFocus />
        </FormField>
      </Dialog>
    </>
  );
}

function ConfirmDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>Delete device</Button>
      <ConfirmDialog
        open={open}
        destructive
        title="Delete edge device?"
        description="This action removes the device from the fleet."
        confirmLabel="Delete device"
        onCancel={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      />
    </>
  );
}

export const Standard: Story = {
  render: () => <DialogDemo />,
};

export const Confirmation: Story = {
  render: () => <ConfirmDemo />,
};
