import { Boxes, Database, LayoutTemplate, Palette } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getProjectById, updateProject } from "../http/projects-api";
import { getPage, type UiDocument } from "./core/document";
import { createComponentDefinitionDocument } from "./reusable-components";
import { PageDesignerSurface } from "./designer/PageDesignerSurface";
import {
  Canvas,
  LeftSidebar,
  RightSidebar,
  StatusBar,
  Toolbar,
} from "./EditorLayout";
import { RenderNode } from "./Renderer";
import {
  getComponentVariantProps,
  getDefaultComponentVariantProps,
} from "./component-variants";
import { useEditorStore } from "./editor-store";
import { ComponentPalette } from "./gui/components-palette/PaletteItem";
import { PageTree } from "./gui/pages/PageTree";
import { PageViewportFrame } from "./gui/page/PageViewportFrame";
import { NavigationRuntimeProvider } from "./navigation/NavigationRuntimeProvider";
import { buildNavigationTree, resolveNavigationPath } from "./navigation/navigation";
import { PropertyPanel } from "./gui/property-panel/PropertyPanel";
import {
  resolveComponentDefinitionEditorMode,
  resolveComponentEditorMode,
  scopeMode,
  type ComponentDefinitionEditorMode,
  type ComponentEditorMode,
  type PageScopedMode,
} from "./editor/component-mode";
import { ComponentStructureTree } from "./gui/reusable-component/ComponentStructureTree";
import { ComponentDesignerSurface } from "./designer/ComponentDesignerSurface";
import { TreeView } from "./gui/tree-view/TreeView";
import {
  editorRegistry,
  type ComponentRegistry,
} from "./registry/editor-registry";
import { initialDocument } from "./registry/initial-values";
import { DataPanel } from "./gui/data/DataPanel";
import { DataWorkspace } from "./gui/data/DataWorkspace";
import type { DataSelection } from "./gui/data/data-selection";
import { SegmentedControl, SegmentedControlItem } from "./gui/ui";
import { designerSimulationSession } from "./data/simulation/designer-simulation-session";
import { sendWsMessage } from "./websocket";
import { connectMockDesignerRuntimeSession } from "../mock/mock-designer-runtime-session";

export function RendererRoot({
  document,
  registry,
}: {
  document: UiDocument;
  registry: ComponentRegistry;
}) {
  return (
    <RenderNode
      id={document.rootId}
      document={document}
      registry={registry}
      decorateProps={(node) => ({
        ...getDefaultComponentVariantProps(node),
        ...(node.type === "Page"
          ? {
              style: {
                boxShadow: "0 1px 3px rgba(15,23,42,.08), 0 0 0 1px rgba(148,163,184,.35)",
              },
            }
          : {}),
        "data-node-id": node.id,
      })}
    />
  );
}

function ComponentModeRenderer({
  document,
  mode,
}: {
  document: UiDocument;
  mode: ComponentEditorMode;
}) {
  return (
    <RenderNode
      id={mode.nodeId}
      document={document}
      registry={editorRegistry}
      decorateProps={(node) => ({
        ...(node.id === mode.nodeId
          ? getComponentVariantProps(node, mode.variantName)
          : getDefaultComponentVariantProps(node)),
      })}
    />
  );
}

function ComponentDefinitionRenderer({
  document,
  mode,
}: {
  document: UiDocument;
  mode: ComponentDefinitionEditorMode;
}) {
  const definition = document.components?.[mode.componentId];
  if (!definition) return null;
  const componentDocument = createComponentDefinitionDocument(document, definition);

  return (
    <RenderNode
      id={definition.rootId}
      document={componentDocument}
      registry={editorRegistry}
      decorateProps={(node) => ({
        ...(node.id === mode.selectedInternalNodeId && mode.variantName
          ? getComponentVariantProps(node, mode.variantName)
          : getDefaultComponentVariantProps(node)),
        "data-component-node-id": node.id,
      })}
    />
  );
}

export function EditorPage() {
  const { projectId } = useParams();
  const document = useEditorStore((state) => state.document);
  const activePageId = useEditorStore((state) => state.activePageId);
  const setActivePageId = useEditorStore((state) => state.setActivePageId);
  const setDocument = useEditorStore((state) => state.setDocument);
  const setSelectedNodeId = useEditorStore((state) => state.setSelectedNodeId);

  const [projectName, setProjectName] = useState("Untitled Project");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scopedComponentMode, setScopedComponentMode] =
    useState<PageScopedMode<ComponentEditorMode> | null>(null);
  const [scopedComponentDefinitionMode, setScopedComponentDefinitionMode] =
    useState<PageScopedMode<ComponentDefinitionEditorMode> | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [editorArea, setEditorArea] = useState<"design" | "data">("design");
  const [dataSelection, setDataSelection] = useState<DataSelection>(null);

  const loadedRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const revisionRef = useRef<number | undefined>(undefined);
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());
  const pendingSaveRef = useRef<{
    projectId: string;
    projectName: string;
    document: UiDocument;
    snapshot: string;
  } | null>(null);

  const flushPendingSave = useCallback((updateUi: boolean) => {
    const pending = pendingSaveRef.current;
    if (!pending || pending.snapshot === lastSavedSnapshotRef.current) {
      pendingSaveRef.current = null;
      return;
    }

    pendingSaveRef.current = null;
    if (updateUi) {
      setSaveStatus("saving");
    }

    saveChainRef.current = saveChainRef.current
      .catch(() => undefined)
      .then(async () => {
        const savedProject = await updateProject(
          pending.projectId,
          {
            name: pending.projectName,
            tree: pending.document,
          },
          revisionRef.current
        );

        revisionRef.current = savedProject.revision ?? revisionRef.current;
        lastSavedSnapshotRef.current = pending.snapshot;
      })
      .then(() => {
        if (updateUi) {
          setSaveStatus("saved");
        }
      })
      .catch((error) => {
        console.error("Autosave failed", error);
        if (!pendingSaveRef.current) {
          pendingSaveRef.current = pending;
        }
        if (updateUi) {
          setSaveStatus("error");
        }
      });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProject() {
      try {
        setLoading(true);
        setError(null);
        setSaveStatus("idle");
        setScopedComponentMode(null);
        setScopedComponentDefinitionMode(null);
        setEditorArea("design");
        setDataSelection(null);
        loadedRef.current = false;
        lastSavedSnapshotRef.current = null;
        revisionRef.current = undefined;
        pendingSaveRef.current = null;

        if (!projectId) {
          setProjectName("Untitled Project");
          setDocument(initialDocument);
          lastSavedSnapshotRef.current = JSON.stringify({
            name: "Untitled Project",
            tree: initialDocument,
          });
          loadedRef.current = true;
          return;
        }

        const project = await getProjectById(projectId);
        if (cancelled) {
          return;
        }

        const loadedName = project.name;
        const loadedDocument = project.tree;

        setProjectName(loadedName);
        setDocument(loadedDocument);
        revisionRef.current = project.revision;
        lastSavedSnapshotRef.current = JSON.stringify({
          name: loadedName,
          tree: loadedDocument,
        });
        loadedRef.current = true;
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error ? error.message : "Failed to load project"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProject();

    return () => {
      cancelled = true;
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
      flushPendingSave(false);
    };
  }, [projectId, setDocument, flushPendingSave]);


  useEffect(() => {
    if (
      !projectId ||
      !loadedRef.current ||
      loading ||
      !document.nodes[document.rootId]
    ) {
      return;
    }

    const snapshot = JSON.stringify({
      name: projectName,
      tree: document,
    });

    if (snapshot === lastSavedSnapshotRef.current) {
      return;
    }

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }

    pendingSaveRef.current = {
      projectId,
      projectName,
      document,
      snapshot,
    };

    saveTimerRef.current = window.setTimeout(() => {
      flushPendingSave(true);
    }, 500);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [projectId, projectName, document, loading, flushPendingSave]);

  useEffect(() => {
    if (!projectId || loading) return;
    connectMockDesignerRuntimeSession(
      projectId,
      document.data ?? { udts: {}, tags: {} }
    );
  }, [document.data, loading, projectId]);

  useEffect(() => {
    designerSimulationSession.configure(document.data ?? { udts: {}, tags: {} });
  }, [document.data]);

  useEffect(() => {
    return () => {
      designerSimulationSession.stop();
      if (projectId) sendWsMessage({ type: "driver.stop", driver: "simulation", projectId });
    };
  }, [projectId]);

  function setComponentMode(mode: ComponentEditorMode | null) {
    setScopedComponentMode(mode ? scopeMode(activePageId, mode) : null);
  }

  function setComponentDefinitionMode(
    mode: ComponentDefinitionEditorMode | null
  ) {
    setScopedComponentDefinitionMode(
      mode ? scopeMode(activePageId, mode) : null
    );
  }

  function editVariant(nodeId: string, variantName: string) {
    setSelectedNodeId(nodeId);
    setComponentDefinitionMode(null);
    setComponentMode({ nodeId, variantName });
  }

  function editComponentDefinition(componentId: string) {
    const definition = document.components?.[componentId];
    if (!definition) return;
    setComponentMode(null);
    setComponentDefinitionMode({
      componentId,
      selectedInternalNodeId: definition.rootId,
    });
  }

  function editComponentDefinitionVariant(
    componentId: string,
    nodeId: string,
    variantName: string
  ) {
    const definition = document.components?.[componentId];
    if (!definition?.nodes[nodeId]?.variants?.[variantName]) return;
    setComponentMode(null);
    setComponentDefinitionMode({
      componentId,
      selectedInternalNodeId: nodeId,
      variantName,
    });
  }

  function exitComponentMode() {
    setComponentMode(null);
    setComponentDefinitionMode(null);
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-sm text-zinc-500">
        Loading project...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (!document.nodes[document.rootId]) {
    return null;
  }

  const activePage = getPage(document, activePageId);
  const componentMode = resolveComponentEditorMode(
    document,
    activePageId,
    scopedComponentMode
  );
  const componentDefinitionMode = resolveComponentDefinitionEditorMode(
    document,
    activePageId,
    scopedComponentDefinitionMode
  );
  const activeDocument: UiDocument = { ...document, rootId: activePage.rootId };
  const focusedNode = componentMode
    ? document.nodes[componentMode.nodeId]
    : undefined;
  const focusedDefinition = componentDefinitionMode
    ? document.components?.[componentDefinitionMode.componentId]
    : undefined;
  const inComponentMode = !!componentMode || !!componentDefinitionMode;
  const rootPage = document.nodes[activePage.rootId];
  const navigationTree = buildNavigationTree(document);
  const pageWidth = Math.max(1, Number(rootPage?.props?.width ?? 1440) || 1440);
  const pageHeight = Math.max(1, Number(rootPage?.props?.height ?? 900) || 900);
  const pageDeviceMode = getPageDeviceMode(rootPage?.props?.deviceMode);
  const projectData = document.data ?? { udts: {}, tags: {} };

  function switchEditorArea(area: "design" | "data") {
    if (area === "data") exitComponentMode();
    setEditorArea(area);
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--editor-app-bg)]">
      <Toolbar projectId={projectId} />

      <div className="flex-1 flex">
        <LeftSidebar>
          <SegmentedControl className="w-full">
            <SegmentedControlItem
              active={editorArea === "design"}
              className="flex-1 gap-1.5 text-xs"
              onClick={() => switchEditorArea("design")}
            >
              <LayoutTemplate size={13} /> Design
            </SegmentedControlItem>
            <SegmentedControlItem
              active={editorArea === "data"}
              className="flex-1 gap-1.5 text-xs"
              onClick={() => switchEditorArea("data")}
            >
              <Database size={13} /> Data
            </SegmentedControlItem>
          </SegmentedControl>

          {editorArea === "data" ? (
            <DataPanel
              data={projectData}
              selection={dataSelection}
              onSelect={setDataSelection}
              projectId={projectId}
            />
          ) : componentDefinitionMode && focusedDefinition ? (
            <>
              <ComponentStructureTree
                definition={focusedDefinition}
                selectedNodeId={componentDefinitionMode.selectedInternalNodeId}
                onSelect={(nodeId) =>
                  setComponentDefinitionMode({
                    componentId: componentDefinitionMode.componentId,
                    selectedInternalNodeId: nodeId,
                  })
                }
              />
              <div className="border-t border-zinc-200" />
              <ComponentPalette
                ownerComponentId={focusedDefinition.id}
                onEditComponentDefinition={editComponentDefinition}
              />
            </>
          ) : (
            <>
              <PageTree />
              <div className="border-t border-zinc-200" />
              <ComponentPalette onEditComponentDefinition={editComponentDefinition} />
              <div className="border-t border-zinc-200" />
              <TreeView />
            </>
          )}
        </LeftSidebar>

        <Canvas>
          {editorArea === "data" ? (
            <div className="min-h-full bg-[var(--editor-canvas-bg)]">
              <DataWorkspace
                data={projectData}
                selection={dataSelection}
                onSelect={setDataSelection}
                projectId={projectId}
              />
            </div>
          ) : (
            <div className="min-h-full bg-[var(--editor-canvas-bg)] p-8">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div
                  data-editor-ignore
                  className="inline-flex h-9 overflow-hidden rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface)]"
                >
                  <button
                    type="button"
                    onClick={exitComponentMode}
                    className={`inline-flex items-center gap-1.5 px-3 text-xs font-medium transition ${
                      inComponentMode
                        ? "text-[var(--editor-text-muted)] hover:bg-[var(--editor-surface-muted)]"
                        : "bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]"
                    }`}
                  >
                    <LayoutTemplate size={13} /> Designer
                  </button>
                  <button
                    type="button"
                    disabled={!inComponentMode}
                    className={`inline-flex items-center gap-1.5 border-l border-[var(--editor-border)] px-3 text-xs font-medium transition ${
                      inComponentMode
                        ? "bg-violet-50 text-violet-700"
                        : "cursor-default text-[var(--editor-text-muted)] opacity-40"
                    }`}
                  >
                    <Boxes size={13} /> Component
                  </button>
                </div>

                {componentDefinitionMode && focusedDefinition ? (
                  <div
                    data-editor-ignore
                    className="inline-flex items-center gap-2 rounded-md border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-700"
                  >
                    <Boxes size={13} />
                    <span className="font-medium">{focusedDefinition.name}</span>
                    <span className="opacity-50">/</span>
                    {componentDefinitionMode.variantName ? (
                      <span className="font-mono">
                        {focusedDefinition.nodes[componentDefinitionMode.selectedInternalNodeId]?.name}.
                        {componentDefinitionMode.variantName}()
                      </span>
                    ) : (
                      <span>private implementation</span>
                    )}
                  </div>
                ) : componentMode && focusedNode ? (
                  <div
                    data-editor-ignore
                    className="inline-flex items-center gap-2 rounded-md border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-700"
                  >
                    <Palette size={13} />
                    <span className="font-medium">{focusedNode.name}</span>
                    <span className="opacity-50">/</span>
                    <span className="font-mono">{componentMode.variantName}()</span>
                  </div>
                ) : (
                  <div className="text-xs text-[var(--editor-text-muted)]">
                    Designer mode
                  </div>
                )}
              </div>

              <div
                data-editor-canvas
                className={`min-h-[520px] bg-[var(--editor-surface)] bg-[radial-gradient(circle,var(--editor-grid-dot)_1px,transparent_1px)] bg-[size:20px_20px] ${
                  inComponentMode
                    ? "flex items-center justify-center p-16"
                    : "min-h-full"
                }`}
              >
                <NavigationRuntimeProvider
                  value={{
                    items: navigationTree,
                    currentPageId: activePageId,
                    navigateTo: (path) => {
                      const target = resolveNavigationPath(document, path);
                      if (target) setActivePageId(target.pageId);
                    },
                  }}
                >
                {componentDefinitionMode && focusedDefinition ? (
                  <>
                    <div
                      data-editor-component-canvas
                      className="max-w-full rounded-xl border border-dashed border-violet-300 bg-white/90 p-10 shadow-sm"
                    >
                      <ComponentDefinitionRenderer
                        document={document}
                        mode={componentDefinitionMode}
                      />
                    </div>
                    <ComponentDesignerSurface
                      componentId={focusedDefinition.id}
                      registry={editorRegistry}
                      selectedNodeId={componentDefinitionMode.selectedInternalNodeId}
                      onSelectNode={(nodeId) =>
                        setComponentDefinitionMode({
                          componentId: componentDefinitionMode.componentId,
                          selectedInternalNodeId: nodeId,
                        })
                      }
                    />
                  </>
                ) : componentMode ? (
                  <div className="pointer-events-none max-w-full rounded-xl border border-dashed border-violet-300 bg-white/90 p-10 shadow-sm">
                    <ComponentModeRenderer
                      document={document}
                      mode={componentMode}
                    />
                  </div>
                ) : (
                  <>
                    <PageViewportFrame
                      width={pageWidth}
                      height={pageHeight}
                      deviceMode={pageDeviceMode}
                    >
                      <RendererRoot document={activeDocument} registry={editorRegistry} />
                    </PageViewportFrame>
                    <PageDesignerSurface registry={editorRegistry} />
                  </>
                )}
                </NavigationRuntimeProvider>
              </div>
            </div>
          )}
        </Canvas>

        {editorArea === "design" ? (
          <RightSidebar>
            <PropertyPanel
              document={activeDocument}
              componentMode={componentMode}
              componentDefinitionMode={componentDefinitionMode}
              onEditVariant={editVariant}
              onEditComponentDefinition={editComponentDefinition}
              onEditComponentDefinitionVariant={editComponentDefinitionVariant}
              onExitComponentMode={exitComponentMode}
            />
          </RightSidebar>
        ) : null}
      </div>
      <StatusBar />

      <div className="fixed bottom-3 right-4 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs shadow-sm text-zinc-500">
        {saveStatus === "idle" && projectName}
        {saveStatus === "saving" && "Saving..."}
        {saveStatus === "saved" && "Saved"}
        {saveStatus === "error" && "Save error"}
      </div>
    </div>
  );
}

function getPageDeviceMode(value: unknown): "desktop" | "tablet" | "mobile" {
  return value === "tablet" || value === "mobile" ? value : "desktop";
}

export default EditorPage;
