import {
  useEffect,
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

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:8080';

type UiProjectResponse = {
  id: string;
  name: string;
  tree: UiTree;
};

async function loadProject(
  projectId: string
): Promise<UiProjectResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/projects/${projectId}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load project ${projectId}: ${response.status}`
    );
  }

  return response.json();
}

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

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!projectId) {
        setNodes(initialNodes);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const project =
          await loadProject(projectId);

        if (cancelled) {
          return;
        }

        setNodes(project.tree);
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

    load();

    return () => {
      cancelled = true;
    };
  }, [
    projectId,
    setNodes,
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
    <div className="h-screen flex flex-col">
      <Toolbar />

      <div className="flex-1 flex">
        <LeftSidebar>
          <ComponentPalette />

          <div className="border-t border-zinc-200" />

          <TreeView />
        </LeftSidebar>

        <Canvas>
          <div className="min-h-full bg-zinc-100 p-8">
            <div
              className="
                min-h-full
                p-8
                bg-white
                bg-[radial-gradient(circle,#cbd5e1_1px,transparent_1px)]
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
    </div>
  );
}

export default EditorPage;