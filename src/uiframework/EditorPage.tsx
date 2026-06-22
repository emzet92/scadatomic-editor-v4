import { useEffect } from 'react'


import {
  type UiTree,
  RenderNode
} from './Renderer';

import { EditorControls } from './EditorControls';
import { PropertyPanel } from './PropertyPanel';
import { useEditorStore } from './editor-store';
import { ComponentPalette } from './PaletteItem';
import { Canvas, LeftSidebar, RightSidebar, StatusBar, Toolbar } from './EditorLayout';
import { TreeView } from './TreeView';
import { editorRegistry, type ComponentRegistry } from './registry/editor-registry';
import { initialNodes } from './registry/initial-values';





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
  const nodes = useEditorStore(
    (s) => s.nodes
  );

  const setNodes = useEditorStore(
    (s) => s.setNodes
  );

  useEffect(() => {
    if (Object.keys(nodes).length === 0) {
      setNodes(initialNodes);
    }
  }, [nodes, setNodes]);

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
          <PropertyPanel nodes={nodes} />
        </RightSidebar>
      </div>

      <StatusBar />
    </div>
  );
}

export default EditorPage;