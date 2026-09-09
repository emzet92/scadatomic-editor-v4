import { useEffect, useRef, useState } from "react";
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
import { getDefaultComponentVariantProps } from "./component-variants";
import { useEditorStore } from "./editor-store";
import { ComponentPalette } from "./gui/components-palette/PaletteItem";
import { PropertyPanel } from "./gui/property-panel/PropertyPanel";
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

export function EditorPage() {
  const { projectId } = useParams();
  const document = useEditorStore((state) => state.document);
  const setDocument = useEditorStore((state) => state.setDocument);

  const [projectName, setProjectName] = useState("Untitled Project");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const loadedRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const revisionRef = useRef<number | undefined>(undefined);
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let cancelled = false;

    async function loadProject() {
      try {
        setLoading(true);
        setError(null);
        setSaveStatus("idle");
        loadedRef.current = false;
        lastSavedSnapshotRef.current = null;
        revisionRef.current = undefined;

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
    };
  }, [projectId, setDocument]);

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

    saveTimerRef.current = window.setTimeout(() => {
      setSaveStatus("saving");

      saveChainRef.current = saveChainRef.current
        .catch(() => undefined)
        .then(async () => {
          if (snapshot === lastSavedSnapshotRef.current) {
            return;
          }

          const savedProject = await updateProject(
            projectId,
            {
              name: projectName,
              tree: document,
            },
            revisionRef.current
          );

          revisionRef.current =
            savedProject.revision ?? revisionRef.current;
          lastSavedSnapshotRef.current = snapshot;
        })
        .then(() => setSaveStatus("saved"))
        .catch((error) => {
          console.error("Autosave failed", error);
          setSaveStatus("error");
        });
    }, 500);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [projectId, projectName, document, loading]);

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
            <div
              data-editor-canvas
              className="min-h-full p-8 bg-[var(--editor-surface)] bg-[radial-gradient(circle,var(--editor-grid-dot)_1px,transparent_1px)] bg-[size:20px_20px]"
            >
              <RendererRoot document={document} registry={editorRegistry} />
              <EditorControls registry={editorRegistry} />
            </div>
          </div>
        </Canvas>

        <RightSidebar>
          <PropertyPanel document={document} />
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
