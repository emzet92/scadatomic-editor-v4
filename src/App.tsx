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
import { ComponentPalette } from './uiframework/PaletteItem';

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
      borderSize: 1,
    },
    children: [
      "title",
      "button",
      "panel1",
    ],
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

  panel1: {
    id: "panel1",
    type: "Container",
    props: {
      display: "flex",
      gap: 8,
      padding: 12,
      row: 1,
      borderSize: 0
    },
    children: [
      "panel1Text",
      "panel1Button",
    ],
  },

  panel1Text: {
    id: "panel1Text",
    type: "Text",
    props: {
      value: "Nested Layout",
    },
  },

  panel1Button: {
    id: "panel1Button",
    type: "Button",
    props: {
      label: "Nested Action",
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
      <ComponentPalette />
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