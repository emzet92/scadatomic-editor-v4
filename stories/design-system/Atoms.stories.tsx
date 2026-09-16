import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AddIcon,
  Box,
  Center,
  DatabaseIcon,
  Divider,
  Grid,
  Heading,
  Inline,
  NotificationIcon,
  Overlay,
  Pressable,
  Stack,
  Surface,
  Text
} from "../../src/uiframework/gui/ui";

const meta = { title: "Atoms/Core", parameters: { controls: { disable: true } } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Layout: Story = {
  render: () => (
    <Stack gap="lg" className="mx-auto max-w-3xl">
      <Heading level={1} size="lg">Layout atoms</Heading>
      <Inline wrap gap="md">
        <Surface><Text>Surface</Text></Surface>
        <Surface variant="muted"><Text>Muted</Text></Surface>
        <Surface variant="accent" border="accent"><Text tone="accent">Accent</Text></Surface>
      </Inline>
      <Grid className="grid-cols-3">
        <Center className="h-20 rounded-lg bg-[var(--editor-surface-muted)]">Center</Center>
        <Box className="h-20 rounded-lg bg-[var(--editor-surface-muted)] p-3">Box</Box>
        <Stack className="h-20 rounded-lg bg-[var(--editor-surface-muted)] p-3" gap="xs"><Text>Stack</Text><Text tone="muted">Vertical rhythm</Text></Stack>
      </Grid>
      <Divider />
      <Inline><DatabaseIcon tone="accent" /><Text variant="label">Icon + Text</Text></Inline>
    </Stack>
  ),
};

export const Typography: Story = {
  render: () => (
    <Stack gap="md" className="mx-auto max-w-2xl">
      <Heading level={1} size="xl">Display heading</Heading>
      <Heading level={2} size="lg">Section heading</Heading>
      <Text variant="body">Body text for normal product copy.</Text>
      <Text variant="body-sm" tone="muted">Muted supporting information.</Text>
      <Text variant="caption" tone="soft">Caption metadata</Text>
      <Text variant="eyebrow" tone="accent">Eyebrow label</Text>
      <Text as="code" variant="code">ctx.tags.write()</Text>
    </Stack>
  ),
};

export const PressableAndIcon: Story = {
  render: () => (
    <Inline gap="md" className="rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)] p-6">
      <Pressable className="rounded-md border border-[var(--editor-border)] px-3 py-2 text-xs">Unstyled pressable</Pressable>
      <AddIcon tone="accent" />
      <NotificationIcon tone="muted" size="lg" />
    </Inline>
  ),
};

export const OverlayAtom: Story = {
  render: () => (
    <Box className="relative h-56 overflow-hidden rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)]">
      <Center className="h-full"><Text tone="muted">Content behind overlay</Text></Center>
      <Overlay center><Surface shadow="md"><Text variant="label">Overlay + Surface</Text></Surface></Overlay>
    </Box>
  ),
};
