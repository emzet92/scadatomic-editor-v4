import {
  Badge,
  Box,
  FormField,
  Select,
  Stack,
  Text,
  TextInput,
  TypographyIcon,
} from "../../uiframework/gui/ui";
import type {
  ReportDocument,
  ReportFontWeight,
  ReportPageId,
  ReportSelection,
  ReportTextAlign,
} from "../core";

export function ReportInspector({
  document,
  selection,
  onChangeText,
  onChangePageLayout,
  onChangePageOrientation,
}: {
  document: ReportDocument;
  selection: ReportSelection;
  onChangeText: (
    componentId: string,
    patch: Partial<{
      text: string;
      fontSize: number;
      fontWeight: ReportFontWeight;
      align: ReportTextAlign;
      color: string;
    }>
  ) => void;
  onChangePageLayout: (pageId: ReportPageId, layoutId: string | undefined) => void;
  onChangePageOrientation: (pageId: ReportPageId, orientation: "portrait" | "landscape") => void;
}) {
  if (selection.kind === "component") {
    const component = document.components[selection.componentId];
    if (!component) return null;

    return (
      <Stack gap="none" className="h-full w-[300px] min-w-[300px]">
        <Box className="border-b border-[var(--editor-border)] p-4">
          <Text as="div" variant="eyebrow" tone="muted">Properties</Text>
          <Text as="div" variant="body" className="mt-1 font-semibold">{component.name}</Text>
          <Badge variant="accent" className="mt-2" icon={<TypographyIcon size="xs" />}>Text</Badge>
        </Box>
        <Stack gap="lg" className="min-h-0 flex-1 overflow-y-auto p-4">
          <FormField label="Text">
            <TextInput value={component.props.text} onChange={(event) => onChangeText(component.id, { text: event.target.value })} />
          </FormField>
          <FormField label="Font size">
            <TextInput
              type="number"
              min={8}
              max={96}
              value={component.props.fontSize}
              onChange={(event) => onChangeText(component.id, { fontSize: Number(event.target.value) || 14 })}
            />
          </FormField>
          <FormField label="Weight">
            <Select value={component.props.fontWeight} onChange={(event) => onChangeText(component.id, { fontWeight: event.target.value as ReportFontWeight })}>
              <option value="regular">Regular</option>
              <option value="medium">Medium</option>
              <option value="semibold">Semibold</option>
              <option value="bold">Bold</option>
            </Select>
          </FormField>
          <FormField label="Alignment">
            <Select value={component.props.align} onChange={(event) => onChangeText(component.id, { align: event.target.value as ReportTextAlign })}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </Select>
          </FormField>
          <FormField label="Color" description="Temporary raw value; later this can point at report/design-system color tokens.">
            <TextInput value={component.props.color} mono onChange={(event) => onChangeText(component.id, { color: event.target.value })} />
          </FormField>
        </Stack>
      </Stack>
    );
  }

  if (selection.target.kind === "page") {
    const page = document.pages[selection.target.id];
    if (!page) return null;
    return (
      <Stack gap="none" className="h-full w-[300px] min-w-[300px]">
        <Box className="border-b border-[var(--editor-border)] p-4">
          <Text as="div" variant="eyebrow" tone="muted">Page</Text>
          <Text as="div" variant="body" className="mt-1 font-semibold">{page.name}</Text>
        </Box>
        <Stack gap="lg" className="p-4">
          <FormField label="Layout" description="Layouts are shared report surfaces rendered before page content.">
            <Select value={page.layoutId ?? ""} onChange={(event) => onChangePageLayout(page.id, event.target.value || undefined)}>
              <option value="">No layout</option>
              {document.layoutOrder.map((layoutId) => {
                const layout = document.layouts[layoutId];
                return layout ? <option key={layout.id} value={layout.id}>{layout.name}</option> : null;
              })}
            </Select>
          </FormField>
          <FormField label="Orientation">
            <Select value={page.setup.orientation} onChange={(event) => onChangePageOrientation(page.id, event.target.value as "portrait" | "landscape") }>
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </Select>
          </FormField>
          <FormField label="Page format">
            <Select value={page.setup.format} disabled>
              <option value="a4">A4</option>
            </Select>
          </FormField>
        </Stack>
      </Stack>
    );
  }

  const layout = document.layouts[selection.target.id];
  if (!layout) return null;
  return (
    <Stack gap="none" className="h-full w-[300px] min-w-[300px]">
      <Box className="border-b border-[var(--editor-border)] p-4">
        <Text as="div" variant="eyebrow" tone="muted">Layout</Text>
        <Text as="div" variant="body" className="mt-1 font-semibold">{layout.name}</Text>
      </Box>
      <Box className="p-4">
        <Text as="div" variant="body-sm" tone="muted">
          Shared components added here are inherited by pages using this layout. Named header/footer regions are intentionally left for the next report iteration.
        </Text>
      </Box>
    </Stack>
  );
}
