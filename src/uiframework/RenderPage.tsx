import {
    type ComponentRegistry,
    type UiTree,
} from "./Renderer";

import { Container } from "./Container";
import { useEditorStore } from "./editor-store";
import { useEffect } from "react";
import { RendererRoot } from "./EditorPage";

const registry: ComponentRegistry = {
    Container,

    Text: ({ value, ...props }) => (
        <span {...props}>
            {String(value ?? "")}
        </span>
    ),

    Button: ({ label, ...props }) => (

        <button className="inline-flex items-center justify-center gap-2 h-9 px-4 
    rounded-md bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium transition-colors 
    disabled:opacity-50 disabled:pointer-events-none" {...props}>
            {String(label ?? "Button")}
        </button>
    ),
};


// TMP solution delete later
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

// TMP solution

export function RenderPage() {
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
        <RendererRoot
            rootId="root"
            nodes={nodes}
            registry={registry}
        />
    );
}