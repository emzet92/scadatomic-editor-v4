import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  useParams,
} from 'react-router-dom';

import {
  type UiTree,
  RenderNode,
} from './Renderer';

import { EditorControls } from './EditorControls';
import { PropertyPanel } from './gui/property-panel/PropertyPanel';
import { useEditorStore } from './editor-store';
import { ComponentPalette } from './gui/components-palette/PaletteItem';
import {
  Canvas,
  LeftSidebar,
  RightSidebar,
  StatusBar,
  Toolbar,
} from './EditorLayout';
import { TreeView } from './gui/tree-view/TreeView';
import {
  editorRegistry,
  type ComponentRegistry,
} from './registry/editor-registry';
import { initialNodes } from './registry/initial-values';

import {
  getProjectById,
  updateProject,
} from '../http/projects-api';

export function RendererRoot({
  rootId,
  nodes,
  registry,
}: {
  rootId: string;
  nodes: UiTree;
  registry: ComponentRegistry;
}) {
  return (
    <RenderNode
      id={rootId}
      nodes={nodes}
      registry={registry}
    />
  );
}

export function EditorPage() {
  const { projectId } =
    useParams();

  const nodes = useEditorStore(
    (s) => s.nodes
  );

  const setNodes = useEditorStore(
    (s) => s.setNodes
  );

  const [projectName, setProjectName] =
    useState('Untitled Project');

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [saveStatus, setSaveStatus] =
    useState<
      | 'idle'
      | 'saving'
      | 'saved'
      | 'error'
    >('idle');

  const loadedRef =
    useRef(false);

  const saveTimerRef =
    useRef<number | null>(null);

  const lastSavedSnapshotRef =
    useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProject() {
      try {
        setLoading(true);
        setError(null);
        setSaveStatus('idle');

        loadedRef.current = false;
        lastSavedSnapshotRef.current = null;

        if (!projectId) {
          const snapshot =
            JSON.stringify({
              name: 'Untitled Project',
              tree: initialNodes,
            });

          setProjectName('Untitled Project');
          setNodes(initialNodes);

          lastSavedSnapshotRef.current =
            snapshot;

          loadedRef.current = true;

          return;
        }

        const project =
          await getProjectById(projectId);

        if (cancelled) {
          return;
        }

        const loadedName =
          project.name ??
          'Untitled Project';

        const loadedTree =
          project.tree ??
          initialNodes;

        const snapshot =
          JSON.stringify({
            name: loadedName,
            tree: loadedTree,
          });

        setProjectName(loadedName);
        setNodes(loadedTree);

        lastSavedSnapshotRef.current =
          snapshot;

        loadedRef.current = true;
      } catch (error) {
        if (cancelled) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : 'Failed to load project'
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProject();

    return () => {
      cancelled = true;

      if (saveTimerRef.current) {
        window.clearTimeout(
          saveTimerRef.current
        );
      }
    };
  }, [
    projectId,
    setNodes,
  ]);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    if (!loadedRef.current) {
      return;
    }

    if (loading) {
      return;
    }

    if (!nodes.root) {
      return;
    }

    const snapshot =
      JSON.stringify({
        name: projectName,
        tree: nodes,
      });

    if (
      snapshot ===
      lastSavedSnapshotRef.current
    ) {
      return;
    }

    if (saveTimerRef.current) {
      window.clearTimeout(
        saveTimerRef.current
      );
    }

    saveTimerRef.current =
      window.setTimeout(
        async () => {
          try {
            setSaveStatus('saving');

            await updateProject(
              projectId,
              {
                name: projectName,
                tree: nodes,
              }
            );

            lastSavedSnapshotRef.current =
              snapshot;

            setSaveStatus('saved');
          } catch (error) {
            console.error(
              'Autosave failed',
              error
            );

            setSaveStatus('error');
          }
        },
        500
      );

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(
          saveTimerRef.current
        );
      }
    };
  }, [
    projectId,
    projectName,
    nodes,
    loading,
  ]);

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

  if (!nodes.root) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--editor-app-bg)]">
      <Toolbar />

      <div className="flex-1 flex">
        <LeftSidebar>
          <ComponentPalette />

          <div className="border-t border-zinc-200" />

          <TreeView />
        </LeftSidebar>

        <Canvas>
          <div className="min-h-full bg-[var(--editor-canvas-bg)] p-8">
            <div
              className="
                min-h-full
                p-8
                bg-[var(--editor-surface)]
                bg-[radial-gradient(circle,var(--editor-grid-dot)_1px,transparent_1px)]
                bg-[size:20px_20px]
              "
            >
              <RendererRoot
                rootId="root"
                nodes={nodes}
                registry={editorRegistry}
              />

              <EditorControls
                registry={editorRegistry}
              />
            </div>
          </div>
        </Canvas>

        <RightSidebar>
          <PropertyPanel
            nodes={nodes}
          />
        </RightSidebar>
      </div>

      <StatusBar />

      <div
        className="
          fixed
          bottom-3
          right-4
          rounded-full
          border
          border-zinc-200
          bg-white
          px-3
          py-1
          text-xs
          shadow-sm
          text-zinc-500
        "
      >
        {saveStatus === 'idle' && projectName}
        {saveStatus === 'saving' && 'Saving...'}
        {saveStatus === 'saved' && 'Saved'}
        {saveStatus === 'error' && 'Save error'}
      </div>
    </div>
  );
}

export default EditorPage;