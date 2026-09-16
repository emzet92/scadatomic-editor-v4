import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box, Inline, Stack, Surface, Text } from "../../src/uiframework/gui/ui";

type LayoutStoryArgs = {
  direction: "stack" | "inline";
  gap: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  align: "start" | "center" | "end" | "stretch" | "baseline";
  justify: "start" | "center" | "end" | "between" | "around";
  wrap: boolean;
  itemCount: number;
};

const meta = {
  title: "Atoms/Layout Primitives",
  args: {
    direction: "inline",
    gap: "md",
    align: "center",
    justify: "start",
    wrap: true,
    itemCount: 4,
  },
  argTypes: {
    direction: { control: "radio", options: ["stack", "inline"] },
    gap: { control: "select", options: ["none", "xs", "sm", "md", "lg", "xl"] },
    align: { control: "select", options: ["start", "center", "end", "stretch", "baseline"] },
    justify: { control: "select", options: ["start", "center", "end", "between", "around"] },
    wrap: { control: "boolean" },
    itemCount: { control: { type: "range", min: 1, max: 8, step: 1 } },
  },
} satisfies Meta<LayoutStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

function DemoItem({ index }: { index: number }) {
  return (
    <Surface variant={index % 2 === 0 ? "accent" : "muted"} padding="sm" className="min-w-24">
      <Text variant="label">Item {index + 1}</Text>
    </Surface>
  );
}

export const Playground: Story = {
  render: (args) => {
    const items = Array.from({ length: args.itemCount }, (_, index) => <DemoItem key={index} index={index} />);
    return (
      <Surface variant="canvas" border="strong" padding="lg" className="mx-auto min-h-64 max-w-4xl">
        {args.direction === "stack" ? (
          <Stack gap={args.gap} align={args.align} className="min-h-52">{items}</Stack>
        ) : (
          <Inline gap={args.gap} align={args.align} justify={args.justify} wrap={args.wrap} className="min-h-52">{items}</Inline>
        )}
      </Surface>
    );
  },
};

export const NestedComposition: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Surface className="mx-auto max-w-3xl" padding="lg">
      <Stack gap="lg">
        <Inline justify="between">
          <Stack gap="none">
            <Text variant="eyebrow" tone="accent">Layout recipe</Text>
            <Text variant="label">Header row</Text>
          </Stack>
          <Surface variant="accent" padding="xs"><Text variant="caption" tone="accent">Action</Text></Surface>
        </Inline>
        <Box className="grid grid-cols-3 gap-3">
          <Surface variant="muted" className="h-24" />
          <Surface variant="muted" className="h-24" />
          <Surface variant="muted" className="h-24" />
        </Box>
      </Stack>
    </Surface>
  ),
};
