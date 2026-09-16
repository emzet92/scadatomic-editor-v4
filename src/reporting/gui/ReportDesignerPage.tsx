import { useState } from "react";
import { useParams } from "react-router-dom";
import { WorkspaceHeader } from "../../uiframework/gui/workspace/WorkspaceHeader";
import {
  Badge,
  FileTextIcon,
  Inline,
  PlayIcon,
  SegmentedControl,
  SegmentedControlItem,
  Text,
  WorkspaceShell,
} from "../../uiframework/gui/ui";
import {
  addReportLayout,
  addReportPage,
  addReportText,
  createReportDocument,
  updateReportComponent,
  updateReportPage,
  type ReportFontWeight,
  type ReportSelection,
  type ReportSurfaceTarget,
  type ReportTextAlign,
} from "../core";
import { ReportCanvas } from "./ReportCanvas";
import { ReportInspector } from "./ReportInspector";
import { ReportPreview } from "./ReportPreview";
import { ReportSidebar, type ReportSidebarMode } from "./ReportSidebar";

export function ReportDesignerPage() {
  const { projectId } = useParams();
  const resolvedProjectId = projectId ?? "demo";
  return <ReportDesigner key={resolvedProjectId} projectId={resolvedProjectId} />;
}

function ReportDesigner({ projectId }: { projectId: string }) {
  const [document, setDocument] = useState(() => createReportDocument(projectId));
  const initialPageId = document.pageOrder[0]!;
  const [sidebarMode, setSidebarMode] = useState<ReportSidebarMode>("components");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [selection, setSelection] = useState<ReportSelection>(() => ({
    kind: "surface",
    target: { kind: "page", id: initialPageId },
  }));

  function selectSurface(target: ReportSurfaceTarget) {
    setSelection({ kind: "surface", target });
  }

  function addPage() {
    const result = addReportPage(document);
    setDocument(result.document);
    selectSurface({ kind: "page", id: result.page.id });
    setSidebarMode("components");
  }

  function addLayout() {
    const result = addReportLayout(document);
    setDocument(result.document);
    selectSurface({ kind: "layout", id: result.layout.id });
    setSidebarMode("components");
  }

  function addText(target: ReportSurfaceTarget) {
    const result = addReportText(document, target);
    setDocument(result.document);
    setSelection({ kind: "component", target, componentId: result.component.id });
  }

  function changeText(
    componentId: string,
    patch: Partial<{
      text: string;
      fontSize: number;
      fontWeight: ReportFontWeight;
      align: ReportTextAlign;
      color: string;
    }>
  ) {
    setDocument((current) => updateReportComponent(current, componentId, (component) => ({
      ...component,
      props: { ...component.props, ...patch },
    })));
  }

  const header = (
    <WorkspaceHeader
      active="reports"
      projectId={projectId}
      title="Report Designer"
      subtitle={mode === "preview" ? "Report preview" : "Page-based report authoring"}
      actions={
        <Inline gap="sm">
          <SegmentedControl variant="soft">
            <SegmentedControlItem
              variant="soft"
              active={mode === "edit"}
              aria-label="Edit report"
              onClick={() => setMode("edit")}
            >
              <Inline gap="xs">
                <PlayIcon size="xs" />
                <Text variant="caption" tone="inherit">Edit</Text>
              </Inline>
            </SegmentedControlItem>
            <SegmentedControlItem
              variant="soft"
              active={mode === "preview"}
              aria-label="Preview report"
              onClick={() => setMode("preview")}
            >
              <Inline gap="xs">
                <PlayIcon size="xs" />
                <Text variant="caption" tone="inherit">Preview</Text>
              </Inline>
            </SegmentedControlItem>
          </SegmentedControl>
          <Badge variant="warning" icon={<FileTextIcon size="xs" />}>Placeholder</Badge>
        </Inline>
      }
    />
  );

  if (mode === "preview") {
    return (
      <WorkspaceShell header={header}>
        <ReportPreview document={document} />
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell
      header={header}
      sidebar={
        <ReportSidebar
          document={document}
          selection={selection}
          mode={sidebarMode}
          onModeChange={setSidebarMode}
          onSelectSurface={selectSurface}
          onSelectComponent={(target, componentId) => setSelection({ kind: "component", target, componentId })}
          onAddPage={addPage}
          onAddLayout={addLayout}
          onAddText={addText}
        />
      }
      inspector={
        <ReportInspector
          document={document}
          selection={selection}
          onChangeText={changeText}
          onChangePageLayout={(pageId, layoutId) => {
            setDocument((current) => updateReportPage(current, pageId, (page) => ({ ...page, layoutId })));
          }}
          onChangePageOrientation={(pageId, orientation) => {
            setDocument((current) => updateReportPage(current, pageId, (page) => ({
              ...page,
              setup: { ...page.setup, orientation },
            })));
          }}
        />
      }
    >
      <ReportCanvas
        document={document}
        selection={selection}
        onSelectSurface={selectSurface}
        onSelectComponent={(target, componentId) => setSelection({ kind: "component", target, componentId })}
        onAddText={addText}
      />
    </WorkspaceShell>
  );
}
