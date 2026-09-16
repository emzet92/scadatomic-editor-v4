import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Checkbox,
  FormField,
  Inline,
  Select,
  Stack,
  Surface,
  Text,
  TextInput,
} from "../../src/uiframework/gui/ui";

type FormControlStoryArgs = {
  label: string;
  description: string;
  placeholder: string;
  controlSize: "sm" | "md";
  invalid: boolean;
  mono: boolean;
  compact: boolean;
  disabled: boolean;
};

const meta = {
  title: "Atoms/Form Controls",
  args: {
    label: "Project name",
    description: "Shown in the cloud workspace.",
    placeholder: "North plant",
    controlSize: "md",
    invalid: false,
    mono: false,
    compact: false,
    disabled: false,
  },
  argTypes: {
    label: { control: "text" },
    description: { control: "text" },
    placeholder: { control: "text" },
    controlSize: { control: "select", options: ["sm", "md"] },
    invalid: { control: "boolean" },
    mono: { control: "boolean" },
    compact: { control: "boolean" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<FormControlStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InputPlayground: Story = {
  render: (args) => (
    <Surface className="mx-auto max-w-xl">
      <FormField
        label={args.label}
        description={args.invalid ? undefined : args.description}
        error={args.invalid ? "This value is not valid." : undefined}
        compact={args.compact}
      >
        <TextInput
          placeholder={args.placeholder}
          controlSize={args.controlSize}
          invalid={args.invalid}
          mono={args.mono}
          disabled={args.disabled}
        />
      </FormField>
    </Surface>
  ),
};

export const Gallery: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
      <Surface padding="lg">
        <Stack gap="lg">
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
        </Stack>
      </Surface>

      <Surface padding="lg">
        <Stack gap="lg">
          <FormField label="Invalid value" error="This field is required.">
            <TextInput invalid placeholder="Required" />
          </FormField>
          <FormField label="Disabled control">
            <TextInput disabled defaultValue="Managed by policy" />
          </FormField>
          <Inline gap="md">
            <Checkbox defaultChecked />
            <Text>Enable automatic updates</Text>
          </Inline>
        </Stack>
      </Surface>
    </div>
  ),
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Surface className="mx-auto max-w-xl" padding="lg">
      <Stack gap="lg">
        <FormField label="Small input"><TextInput controlSize="sm" placeholder="Small" /></FormField>
        <FormField label="Medium input"><TextInput controlSize="md" placeholder="Medium" /></FormField>
      </Stack>
    </Surface>
  ),
};
