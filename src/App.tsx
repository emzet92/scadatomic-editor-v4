import { useState } from 'react'
import './App.css'
import { type ComponentRegistry, type UiTree, RenderNode } from './uiframework/Renderer';
import { Container } from './uiframework/Container';
import { EditorControls } from './uiframework/EditorControls';
import { PropertyPanel } from './uiframework/PropertyPanel';

const registry: ComponentRegistry = {
  Container: Container,

  Text: ({ value, ...props }) => <span {...props}>{String(value ?? "")}</span>,

  Button: ({ label, ...props }) => (
    <button {...props}>
      {String(label ?? "Button")}
    </button>
  ),
};

const nodes: UiTree = {
  root: {
    id: "root",
    type: "Container",
    props: {
      style: {
        display: "flex",
        gap: 12,
        padding: 16,
      },
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
  return <RenderNode id={rootId} nodes={nodes} registry={registry} />;
}


function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      <RendererRoot rootId="root" nodes={nodes} registry={registry} />
      <EditorControls onSelect={setSelectedId}/>
      <PropertyPanel
        nodes={nodes}
        selectedNodeId={selectedId}
      />
    </>
  )
}

export default App
