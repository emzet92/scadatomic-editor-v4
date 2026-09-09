import { Boxes, LayoutTemplate, Palette } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getProjectById, updateProject } from "../http/projects-api";
import type { UiDocument } from "./core/document";
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
import {
  PropertyPanel,
  type ComponentEditorMode,
} from "./gui/property-panel/PropertyPanel";
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
        "data-node-id": node.id,
        onPointerDown: (event: React.PointerEvent) => {
          if (event.button !== 0) {
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

export function EditorPage() {
  const { projectId } = useParams();
  const document = useEditorStore((state) => state.document);
  const setDocument = useEditorStore((state) => state.setDocument);
  const setSelectedNodeId = useEditorStore((state) => state.setSelectedNodeId);

  const [projectName, setProjectName] = useState("Untitled Project");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [componentMode, setComponentMode] =
    useState<ComponentEditorMode | null>(null);
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
    if (!componentMode) {
      return;
    }

    const node = document.nodes[componentMode.nodeId];
    if (!node?.variants?.[componentMode.variantName]) {
      setComponentMode(null);
    }
  }, [componentMode, document]);

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
    setComponentMode({ nodeId, variantName });
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

  const focusedNode = componentMode
    ? document.nodes[componentMode.nodeId]
    : undefined;

  return (
    <div className="h-screen flex flex-col bg-[var(--editor-app-bg)]">
      <Toolbar projectId={projectId} />

      <div className="flex-1 flex">
        <LeftSidebar>
          <ComponentPalette />
          <div className="border-t border-zinc-200" />
          <TreeView />
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
                  onClick={() => setComponentMode(null)}
                  className={`inline-flex items-center gap-1.5 px-3 text-xs font-medium transition ${
                    componentMode
                      ? "text-[var(--editor-text-muted)] hover:bg-[var(--editor-surface-muted)]"
                      : "bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]"
                  }`}
                >
                  <LayoutTemplate size={13} /> Designer
                </button>
                <button
                  type="button"
                  disabled={!componentMode}
                  className={`inline-flex items-center gap-1.5 border-l border-[var(--editor-border)] px-3 text-xs font-medium transition ${
                    componentMode
                      ? "bg-violet-50 text-violet-700"
                      : "cursor-default text-[var(--editor-text-muted)] opacity-40"
                  }`}
                >
                  <Boxes size={13} /> Component
                </button>
              </div>

              {componentMode && focusedNode ? (
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
                componentMode
                  ? "flex items-center justify-center p-16"
                  : "min-h-full p-8"
              }`}
            >
              {componentMode ? (
                <div className="pointer-events-none max-w-full rounded-xl border border-dashed border-violet-300 bg-white/90 p-10 shadow-sm">
                  <ComponentModeRenderer
                    document={document}
                    mode={componentMode}
                  />
                </div>
              ) : (
                <>
                  <RendererRoot document={document} registry={editorRegistry} />
                  <EditorControls registry={editorRegistry} />
                </>
              )}
            </div>
          </div>
        </Canvas>

        <RightSidebar>
          <PropertyPanel
            document={document}
            componentMode={componentMode}
            onEditVariant={editVariant}
            onExitComponentMode={() => setComponentMode(null)}
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

export default EditorPage;
