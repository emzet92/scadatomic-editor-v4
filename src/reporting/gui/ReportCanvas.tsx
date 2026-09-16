import {
  AddIcon,
  Badge,
  Box,
  Button,
  Center,
  FileTextIcon,
  Inline,
  Pressable,
  Stack,
  Surface,
  TemplateIcon,
  Text,
  Toolbar,
} from "../../uiframework/gui/ui";
import type {
  ReportComponent,
  ReportDocument,
  ReportSelection,
  ReportSurfaceTarget,
} from "../core";

export function ReportCanvas({
  document,
  selection,
  onSelectSurface,
  onSelectComponent,
  onAddText,
}: {
  document: ReportDocument;
  selection: ReportSelection;
  onSelectSurface: (target: ReportSurfaceTarget) => void;
  onSelectComponent: (target: ReportSurfaceTarget, componentId: string) => void;
  onAddText: (target: ReportSurfaceTarget) => void;
}) {
  const target = selection.target;
  const page = target.kind === "page" ? document.pages[target.id] : undefined;
  const layout = target.kind === "layout" ? document.layouts[target.id] : undefined;
  const surface = page ?? layout;
  const inheritedLayout = page?.layoutId ? document.layouts[page.layoutId] : undefined;

  if (!surface) {
    return <Center className="h-full"><Text tone="muted">Select a report surface.</Text></Center>;
  }

  const pageClassName = page?.setup.orientation === "landscape"
    ? "w-[980px] min-h-[690px]"
    : "w-[720px] min-h-[1018px]";

  return (
    <Stack gap="none" className="h-full min-h-0">
      <Toolbar
        compact
        start={
          <Inline gap="sm">
            {target.kind === "page" ? <FileTextIcon size="sm" tone="accent" /> : <TemplateIcon size="sm" tone="accent" />}
            <Text variant="label">{surface.name}</Text>
            <Badge variant="accent">{target.kind}</Badge>
          </Inline>
        }
        end={
          <Inline gap="sm">
            {page ? <Badge>{page.setup.format.toUpperCase()} · {page.setup.orientation}</Badge> : null}
            <Button size="xs" variant="secondary" leadingIcon={<AddIcon size="xs" />} onClick={() => onAddText(target)}>
              Add text
            </Button>
          </Inline>
        }
      />

      <Box className="min-h-0 flex-1 overflow-auto bg-[var(--editor-canvas-bg)] p-10">
        <Center className="min-h-full items-start">
          <Surface
            variant="default"
            border="default"
            radius="sm"
            padding="none"
            shadow="md"
            className={`${pageClassName} overflow-hidden`}
            onClick={() => onSelectSurface(target)}
          >
            <Stack gap="none" className="min-h-[inherit]">
              {inheritedLayout ? (
                <Box className="border-b border-dashed border-[var(--editor-accent-border)] bg-[var(--editor-accent-soft)]/35 px-12 py-7">
                  <Inline justify="between" className="mb-4">
                    <Text variant="eyebrow" tone="accent">Layout · {inheritedLayout.name}</Text>
                    <Badge variant="accent">Inherited</Badge>
                  </Inline>
                  <ReportComponentList
                    document={document}
                    componentIds={inheritedLayout.componentIds}
                    target={{ kind: "layout", id: inheritedLayout.id }}
                    selection={selection}
                    onSelectComponent={onSelectComponent}
                    readOnly
                  />
                </Box>
              ) : null}

              <Box className="flex-1 px-12 py-10">
                {target.kind === "layout" ? (
                  <Text as="div" variant="eyebrow" tone="accent" className="mb-5">Shared layout content</Text>
                ) : null}

                <ReportComponentList
                  document={document}
                  componentIds={surface.componentIds}
                  target={target}
                  selection={selection}
                  onSelectComponent={onSelectComponent}
                />

                <Button
                  variant="ghost"
                  size="sm"
                  leadingIcon={<AddIcon size="sm" />}
                  className="mt-4 w-full justify-center border border-dashed border-[var(--editor-border-strong)] py-8 text-[var(--editor-text-muted)]"
                  onClick={(event) => {
                    event.stopPropagation();
                    onAddText(target);
                  }}
                >
                  Add report component
                </Button>
              </Box>
            </Stack>
          </Surface>
        </Center>
      </Box>
    </Stack>
  );
}

function ReportComponentList({
  document,
  componentIds,
  target,
  selection,
  onSelectComponent,
  readOnly = false,
}: {
  document: ReportDocument;
  componentIds: string[];
  target: ReportSurfaceTarget;
  selection: ReportSelection;
  onSelectComponent: (target: ReportSurfaceTarget, componentId: string) => void;
  readOnly?: boolean;
}) {
  if (componentIds.length === 0) {
    return (
      <Text as="div" variant="caption" tone="soft" className="py-4 text-center">
        No components yet.
      </Text>
    );
  }

  return (
    <Stack gap="sm">
      {componentIds.map((componentId) => {
        const component = document.components[componentId];
        if (!component) return null;
        const selected = selection.kind === "component" && selection.componentId === component.id;
        return (
          <ReportComponentPreview
            key={component.id}
            component={component}
            selected={selected}
            readOnly={readOnly}
            onClick={() => onSelectComponent(target, component.id)}
          />
        );
      })}
    </Stack>
  );
}

function ReportComponentPreview({
  component,
  selected,
  readOnly,
  onClick,
}: {
  component: ReportComponent;
  selected: boolean;
  readOnly: boolean;
  onClick: () => void;
}) {
  return (
    <Pressable
      className={`w-full rounded-md border px-3 py-2 text-left transition ${
        selected
          ? "border-[var(--editor-accent)] bg-[var(--editor-accent-soft)]/50"
          : readOnly
            ? "border-transparent hover:border-[var(--editor-accent-border)]"
            : "border-transparent hover:border-[var(--editor-border)] hover:bg-[var(--editor-surface-muted)]"
      }`}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <Text
        as="div"
        tone="inherit"
        style={{
          color: component.props.color,
          fontSize: `${component.props.fontSize}px`,
          fontWeight: weightToCss(component.props.fontWeight),
          textAlign: component.props.align,
          lineHeight: 1.45,
        }}
      >
        {component.props.text || "Empty text"}
      </Text>
    </Pressable>
  );
}

function weightToCss(weight: ReportComponent["props"]["fontWeight"]): number {
  switch (weight) {
    case "medium": return 500;
    case "semibold": return 600;
    case "bold": return 700;
    default: return 400;
  }
}
