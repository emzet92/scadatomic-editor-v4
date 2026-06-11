import { useEffect } from 'react'
import './App.css'

import {
  type ComponentRegistry,
  type UiTree,
  RenderNode
} from './uiframework/Renderer';

import { Container } from './uiframework/Container';
import { EditorControls } from './uiframework/EditorControls';
import { PropertyPanel } from './uiframework/PropertyPanel';
import { useEditorStore } from './uiframework/editor-store';

const registry: ComponentRegistry = {
  Container,

  Text: ({ value, ...props }) => (
    <span {...props}>
      {String(value ?? "")}
    </span>
  ),

  Button: ({ label, ...props }) => (
    <button {...props}>
      {String(label ?? "Button")}
    </button>
  ),
};

console.log("sram ci na matke");

const initialNodes: UiTree = {
  root: {
    id: "root",
    type: "Container",
    props: {
      display: "flex",
      gap: 12,
      padding: 16,
      row: 1,
    },
    children: ["title", "button"],
  },

  title: {
    id: "title",
    type: "Text",
    props: {
      value: "Scadatomic Renderer",
    },
  },

  button: {
    id: "button",
    type: "Button",
    props: {
      label: "Start",
    },
  },
};

function RendererRoot({
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

function App() {
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
    <>
      <RendererRoot
        rootId="root"
        nodes={nodes}
        registry={registry}
      />

      <EditorControls />

        <PropertyPanel
          nodes={nodes}
        />
    </>
  );
}

export default App;