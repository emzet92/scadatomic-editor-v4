import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  DatabaseIcon,
  Grid,
  Heading,
  Inline,
  Stack,
  Surface,
  Text,
  editorIconCatalog,
  editorIconSizes,
  editorIconStrokeWidths,
  editorIconTones,
} from "../../src/uiframework/gui/ui";

const meta = {
  title: "Foundations/Iconography",
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const categories = Array.from(new Set(editorIconCatalog.map((icon) => icon.category)));

export const Catalog: Story = {
  render: () => (
    <Stack gap="xl" className="mx-auto max-w-7xl">
      <Stack gap="xs">
        <Text variant="eyebrow" tone="accent">Foundations</Text>
        <Heading level={1} size="xl">Iconography</Heading>
        <Text tone="muted" className="max-w-3xl">
          Feature code imports semantic design-system icons. Lucide stays an implementation detail inside the icon atoms.
        </Text>
      </Stack>

      {categories.map((category) => (
        <Stack key={category} gap="md">
          <Heading level={2} size="sm">{category}</Heading>
          <Grid className="grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {editorIconCatalog
              .filter((entry) => entry.category === category)
              .map((entry) => {
                const Glyph = entry.component;
                return (
                  <Surface key={entry.name} padding="md" className="min-w-0">
                    <Stack gap="sm">
                      <Inline className="h-10" align="center">
                        <Glyph size="lg" tone="accent" />
                      </Inline>
                      <Stack gap="none">
                        <Text variant="label" truncate>{entry.name}Icon</Text>
                        <Text variant="caption" tone="muted" truncate>Lucide: {entry.source}</Text>
                      </Stack>
                    </Stack>
                  </Surface>
                );
              })}
          </Grid>
        </Stack>
      ))}
    </Stack>
  ),
};

export const Tokens: Story = {
  render: () => (
    <Stack gap="xl" className="mx-auto max-w-5xl">
      <Stack gap="xs">
        <Text variant="eyebrow" tone="accent">Icon tokens</Text>
        <Heading level={1} size="lg">Size, stroke and tone</Heading>
        <Text tone="muted">Every named icon consumes the same icon foundation tokens.</Text>
      </Stack>

      <Stack gap="md">
        <Heading level={2} size="sm">Sizes</Heading>
        <Inline wrap gap="lg" align="end">
          {Object.entries(editorIconSizes).map(([name, value]) => (
            <Stack key={name} gap="xs" align="center">
              <DatabaseIcon size={name as keyof typeof editorIconSizes} tone="accent" />
              <Text variant="caption" tone="muted">{name} · {value}px</Text>
            </Stack>
          ))}
        </Inline>
      </Stack>

      <Stack gap="md">
        <Heading level={2} size="sm">Stroke weights</Heading>
        <Inline wrap gap="xl">
          {Object.entries(editorIconStrokeWidths).map(([name, value]) => (
            <Stack key={name} gap="xs" align="center">
              <DatabaseIcon size="xl" weight={name as keyof typeof editorIconStrokeWidths} />
              <Text variant="caption" tone="muted">{name} · {value}</Text>
            </Stack>
          ))}
        </Inline>
      </Stack>

      <Stack gap="md">
        <Heading level={2} size="sm">Semantic tones</Heading>
        <Inline wrap gap="xl">
          {Object.keys(editorIconTones).map((name) => (
            <Stack key={name} gap="xs" align="center">
              <DatabaseIcon size="lg" tone={name as keyof typeof editorIconTones} />
              <Text variant="caption" tone="muted">{name}</Text>
            </Stack>
          ))}
        </Inline>
      </Stack>
    </Stack>
  ),
};
