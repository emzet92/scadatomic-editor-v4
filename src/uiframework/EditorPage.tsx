import { useEffect } from 'react'


import {
  type UiTree,
  RenderNode
} from './Renderer';

import { Container } from './components/Container';
import { EditorControls } from './EditorControls';
import { PropertyPanel } from './PropertyPanel';
import { useEditorStore } from './editor-store';
import { ComponentPalette } from './PaletteItem';
import { Canvas, LeftSidebar, RightSidebar, StatusBar, Toolbar } from './EditorLayout';
import { TreeView } from './TreeView';
import { editorRegistry } from './registry/editor-registry';




const EditorButton = ({
  label,
  ...props
}: any) => (
  <button
    {...props}
    className="
      inline-flex
      items-center
      justify-center
      gap-2
      h-9
      px-4

      rounded-md

      bg-sky-600
      hover:bg-sky-500

      text-white
      text-sm
      font-medium

      transition-colors

      disabled:opacity-50
      disabled:pointer-events-none
    "
  >
    {String(
      label ?? "Button"
    )}
  </button>
);


console.log("sram ci na matke");

const initialNodes: UiTree = {
  root: {
    id: "root",
    type: "Container",
    props: {
      padding: 16,
      gap: 12,
      borderSize: 1,
    },
    children: [
      "stationTitle",
      "levelLiters",
      "levelPercent",
      "flowRate",
      "startButton",
      "stopButton",
    ],
  },

  stationTitle: {
    id: "stationTitle",
    type: "Text",
    props: {
      value: "Pump Station P-101",
      tag: "pump.stationName",
      color: "black"
    },
  },

  levelLiters: {
    id: "levelLiters",
    type: "Text",
    props: {
      value: "1240 L",
      tag: "tank.levelLiters",
    },
  },

  levelPercent: {
    id: "levelPercent",
    type: "Text",
    props: {
      value: "62 %",
      tag: "tank.levelPercent",
    },
  },

  flowRate: {
    id: "flowRate",
    type: "Text",
    props: {
      value: "85 m³/h",
      tag: "pump.flowRate",
    },
  },

  startButton: {
    id: "startButton",
    type: "Button",
    props: {
      label: "START",
      tag: "pump.startCommand",
      onClickEvent: "startButton.Clicked"
    },
  },

  stopButton: {
    id: "stopButton",
    type: "Button",
    props: {
      label: "STOP",
      tag: "pump.stopCommand",
    },
  },
};

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