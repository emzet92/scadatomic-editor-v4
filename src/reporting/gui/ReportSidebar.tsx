import {
  AddIcon,
  Box,
  Button,
  FileTextIcon,
  IconButton,
  ImagesIcon,
  SegmentedControl,
  SegmentedControlItem,
  SidebarNavItem,
  SidebarSection,
  Stack,
  TemplateIcon,
  Text,
  TypographyIcon,
} from "../../uiframework/gui/ui";
import type {
  ReportDocument,
  ReportSelection,
  ReportSurfaceTarget,
} from "../core";

export type ReportSidebarMode = "components" | "assets";

export function ReportSidebar({
  document,
  selection,
  mode,
  onModeChange,
  onSelectSurface,
  onSelectComponent,
  onAddPage,
  onAddLayout,
  onAddText,
}: {
  document: ReportDocument;
  selection: ReportSelection;
  mode: ReportSidebarMode;
  onModeChange: (mode: ReportSidebarMode) => void;
  onSelectSurface: (target: ReportSurfaceTarget) => void;
  onSelectComponent: (target: ReportSurfaceTarget, componentId: string) => void;
  onAddPage: () => void;
  onAddLayout: () => void;
  onAddText: (target: ReportSurfaceTarget) => void;
}) {
  const target = selection.target;
  const surface = target.kind === "page" ? document.pages[target.id] : document.layouts[target.id];

  return (
    <Stack gap="none" className="h-full w-[300px] min-w-[300px]">
      <Box className="border-b border-[var(--editor-border)] p-3">
        <SegmentedControl fullWidth variant="soft">
          <SegmentedControlItem
            grow
            variant="soft"
            active={mode === "components"}
            onClick={() => onModeChange("components")}
          >
            Components
          </SegmentedControlItem>
          <SegmentedControlItem
            grow
            variant="soft"
            active={mode === "assets"}
            onClick={() => onModeChange("assets")}
          >
            Assets
          </SegmentedControlItem>
        </SegmentedControl>
      </Box>

      <Box className="min-h-0 flex-1 overflow-y-auto p-3">
        {mode === "assets" ? (
          <SidebarSection
            title="Report assets"
            description="Project-local assets for reports. Image components will use this collection later."
          >
            <Box className="rounded-xl border border-dashed border-[var(--editor-border)] bg-[var(--editor-surface-muted)] p-5 text-center">
              <ImagesIcon size="lg" tone="soft" />
              <Text as="div" variant="body-sm" className="mt-2 font-medium">No report assets yet</Text>
              <Text as="div" variant="caption" tone="muted" className="mt-1">
                Placeholder for images, logos and generated resources.
              </Text>
            </Box>
          </SidebarSection>
        ) : (
          <Stack gap="xl">
            <SidebarSection
              title="Pages"
              description="Printable report pages"
              actions={
                <IconButton aria-label="Add report page" size="icon-xs" onClick={onAddPage}>
                  <AddIcon size="sm" />
                </IconButton>
              }
            >
              <Stack gap="xs">
                {document.pageOrder.map((pageId, index) => {
                  const page = document.pages[pageId];
                  if (!page) return null;
                  return (
                    <SidebarNavItem
                      key={page.id}
                      variant="row"
                      active={target.kind === "page" && target.id === page.id}
                      icon={<FileTextIcon size="sm" />}
                      title={page.name}
                      meta={String(index + 1).padStart(2, "0")}
                      onClick={() => onSelectSurface({ kind: "page", id: page.id })}
                    />
                  );
                })}
              </Stack>
            </SidebarSection>

            <SidebarSection
              title="Layouts"
              description="Reusable report page chrome"
              actions={
                <IconButton aria-label="Add report layout" size="icon-xs" onClick={onAddLayout}>
                  <AddIcon size="sm" />
                </IconButton>
              }
            >
              {document.layoutOrder.length === 0 ? (
                <Button
                  variant="ghost"
                  size="xs"
                  leadingIcon={<AddIcon size="xs" />}
                  className="w-full justify-start border border-dashed border-[var(--editor-border)]"
                  onClick={onAddLayout}
                >
                  Create first layout
                </Button>
              ) : (
                <Stack gap="xs">
                  {document.layoutOrder.map((layoutId) => {
                    const layout = document.layouts[layoutId];
                    if (!layout) return null;
                    return (
                      <SidebarNavItem
                        key={layout.id}
                        variant="row"
                        active={target.kind === "layout" && target.id === layout.id}
                        icon={<TemplateIcon size="sm" />}
                        title={layout.name}
                        onClick={() => onSelectSurface({ kind: "layout", id: layout.id })}
                      />
                    );
                  })}
                </Stack>
              )}
            </SidebarSection>

            <SidebarSection
              title="Components tree"
              description={surface ? surface.name : "Select a page or layout"}
              actions={
                surface ? (
                  <IconButton aria-label="Add text component" size="icon-xs" onClick={() => onAddText(target)}>
                    <AddIcon size="sm" />
                  </IconButton>
                ) : undefined
              }
            >
              {!surface || surface.componentIds.length === 0 ? (
                <Button
                  variant="ghost"
                  size="xs"
                  disabled={!surface}
                  leadingIcon={<AddIcon size="xs" />}
                  className="w-full justify-start border border-dashed border-[var(--editor-border)]"
                  onClick={() => surface && onAddText(target)}
                >
                  Add text
                </Button>
              ) : (
                <Stack gap="xs">
                  {surface.componentIds.map((componentId) => {
                    const component = document.components[componentId];
                    if (!component) return null;
                    return (
                      <SidebarNavItem
                        key={component.id}
                        variant="row"
                        active={selection.kind === "component" && selection.componentId === component.id}
                        icon={<TypographyIcon size="sm" />}
                        title={component.name}
                        meta={component.type}
                        onClick={() => onSelectComponent(target, component.id)}
                      />
                    );
                  })}
                </Stack>
              )}
            </SidebarSection>
          </Stack>
        )}
      </Box>
    </Stack>
  );
}
