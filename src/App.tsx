import { useState } from 'react'
import './App.css'
import { type ComponentRegistry, type UiTree, type Ren, RenderNode } from './uiframework/Renderer';

const registry: ComponentRegistry = {
  Container: ({ children, ...props }) => <div {...props}>{children}</div>,

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
  const [count, setCount] = useState(0)

  return (
    <>
      <RendererRoot rootId="root" nodes={nodes} registry={registry} />;
    </>
  )
}

export default App
