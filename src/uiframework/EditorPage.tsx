import { Boxes, LayoutTemplate, Palette } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getProjectById, updateProject } from "../http/projects-api";
import { getPage, type UiDocument } from "./core/document";
import { createComponentDefinitionDocument } from "./reusable-components";
import { EditorControls } from "./EditorControls";
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
import { NavigationRuntimeProvider } from "./navigation/navigation-context";
import { buildNavigationTree, resolveNavigationPath } from "./navigation/navigation";
import {
  PropertyPanel,
  type ComponentDefinitionEditorMode,
  type ComponentEditorMode,
} from "./gui/property-panel/PropertyPanel";
import { ComponentStructureTree } from "./gui/reusable-component/ComponentStructureTree";
import { ComponentDefinitionControls } from "./gui/reusable-component/ComponentDefinitionControls";
import { TreeView } from "./gui/tree-view/TreeView";
import {
  editorRegistry,
  type ComponentRegistry,
} from "./registry/editor-registry";
import { initialDocument } from "./registry/initial-values";

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
        onPointerDown: (event: React.PointerEvent) => {
          if (
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey
          ) {
            return;
          }

          event.stopPropagation();
          useEditorStore
            .getState()
            .startNodeDragCandidate(
              node.id,
              event.clientX,
              event.clientY
            );
        },
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
  onSelectInternalNode,
}: {
  document: UiDocument;
  mode: ComponentDefinitionEditorMode;
  onSelectInternalNode: (nodeId: string) => void;
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
        onPointerDown: (event: React.PointerEvent) => {
          if (event.button !== 0) return;
          event.stopPropagation();
          onSelectInternalNode(node.id);
          if (!event.metaKey && !event.ctrlKey && !event.shiftKey) {
            useEditorStore
              .getState()
              .startNodeDragCandidate(
                node.id,
                event.clientX,
                event.clientY
              );
          }
        },
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
  const [componentMode, setComponentMode] =
    useState<ComponentEditorMode | null>(null);
  const [componentDefinitionMode, setComponentDefinitionMode] =
    useState<ComponentDefinitionEditorMode | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

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
        setComponentMode(null);
        setComponentDefinitionMode(null);
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
    setComponentMode(null);
    setComponentDefinitionMode(null);
  }, [activePageId]);

  useEffect(() => {
    if (!componentMode) {
      return;
    }

    const node = document.nodes[componentMode.nodeId];
    if (!node?.variants?.[componentMode.variantName]) {
      setComponentMode(null);
    }
  }, [componentMode, document]);

  useEffect(() => {
    if (!componentDefinitionMode) return;
    const definition = document.components?.[componentDefinitionMode.componentId];
    if (!definition) {
      setComponentDefinitionMode(null);
      return;
    }
    const selectedInternalNode =
      definition.nodes[componentDefinitionMode.selectedInternalNodeId];
    if (!selectedInternalNode) {
      setComponentDefinitionMode({
        componentId: definition.id,
        selectedInternalNodeId: definition.rootId,
      });
      return;
    }
    if (
      componentDefinitionMode.variantName &&
      !selectedInternalNode.variants?.[componentDefinitionMode.variantName]
    ) {
      setComponentDefinitionMode({
        componentId: definition.id,
        selectedInternalNodeId: selectedInternalNode.id,
      });
    }
  }, [componentDefinitionMode, document]);

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

  return (
    <div className="h-screen flex flex-col bg-[var(--editor-app-bg)]">
      <Toolbar projectId={projectId} />

      <div className="flex-1 flex">
        <LeftSidebar>
          {componentDefinitionMode && focusedDefinition ? (
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
              <ComponentPalette ownerComponentId={focusedDefinition.id} />
            </>
          ) : (
            <>
              <PageTree />
              <div className="border-t border-zinc-200" />
              <ComponentPalette />
              <div className="border-t border-zinc-200" />
              <TreeView />
            </>
          )}
        </LeftSidebar>

        <Canvas>
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
                      onSelectInternalNode={(nodeId) =>
                        setComponentDefinitionMode({
                          componentId: componentDefinitionMode.componentId,
                          selectedInternalNodeId: nodeId,
                        })
                      }
                    />
                  </div>
                  <ComponentDefinitionControls
                    projectDocument={document}
                    definition={focusedDefinition}
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
                  <EditorControls registry={editorRegistry} />
                </>
              )}
              </NavigationRuntimeProvider>
            </div>
          </div>
        </Canvas>

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
