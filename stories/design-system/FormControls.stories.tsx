import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox, FormField, Select, TextInput } from "../../src/uiframework/gui/ui";

const meta = {
  title: "Primitives/Form Controls",
  parameters: {
    controls: { disable: true },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Gallery: Story = {
  render: () => (
    <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
      <div className="space-y-5 rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)] p-5">
        <FormField label="Project name" description="Shown in the cloud workspace.">
          <TextInput placeholder="North plant" />
        </FormField>
        <FormField label="Runtime channel">
          <Select defaultValue="stable">
            <option value="stable">Stable</option>
            <option value="preview">Preview</option>
            <option value="nightly">Nightly</option>
          </Select>
        </FormField>
        <FormField label="Registration key" compact>
          <TextInput mono defaultValue="edge_reg_d44f-72a1" />
        </FormField>
      </div>

      <div className="space-y-5 rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)] p-5">
        <FormField label="Invalid value" error="This field is required.">
          <TextInput invalid placeholder="Required" />
        </FormField>
        <FormField label="Disabled control">
          <TextInput disabled defaultValue="Managed by policy" />
        </FormField>
        <label className="flex items-center gap-3 text-sm text-[var(--editor-text)]">
          <Checkbox defaultChecked />
          Enable automatic updates
        </label>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="mx-auto max-w-xl space-y-4 rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)] p-5">
      <FormField label="Small input">
        <TextInput controlSize="sm" placeholder="Small" />
      </FormField>
      <FormField label="Medium input">
        <TextInput controlSize="md" placeholder="Medium" />
      </FormField>
    </div>
  ),
};
