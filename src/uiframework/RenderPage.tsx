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

    //
    // LEVEL 1
    //
    panel1: {
        id: "panel1",
        type: "Container",
        props: {
            display: "flex",
            gap: 8,
            padding: 12,
            row: 0,
            borderSize: 1,
        },
        children: [
            "panel1Text",
            "panel1Button",
            "panel2",
        ],
    },

    panel1Text: {
        id: "panel1Text",
        type: "Text",
        props: {
            value: "Level 1",
        },
    },

    panel1Button: {
        id: "panel1Button",
        type: "Button",
        props: {
            label: "Action 1",
        },
    },

    //
    // LEVEL 2
    //
    panel2: {
        id: "panel2",
        type: "Container",
        props: {
            display: "flex",
            gap: 8,
            padding: 12,
            row: 0,
            borderSize: 1,
        },
        children: [
            "panel2Text",
            "panel2Button",
            "panel3",
        ],
    },

    panel2Text: {
        id: "panel2Text",
        type: "Text",
        props: {
            value: "Level 2",
        },
    },

    panel2Button: {
        id: "panel2Button",
        type: "Button",
        props: {
            label: "Action 2",
        },
    },

    //
    // LEVEL 3
    //
    panel3: {
        id: "panel3",
        type: "Container",
        props: {
            display: "flex",
            gap: 8,
            padding: 12,
            row: 0,
            borderSize: 1,
        },
        children: [
            "panel3Text",
            "panel3Button",
            "panel4",
        ],
    },

    panel3Text: {
        id: "panel3Text",
        type: "Text",
        props: {
            value: "Level 3",
        },
    },

    panel3Button: {
        id: "panel3Button",
        type: "Button",
        props: {
            label: "Action 3",
        },
    },

    //
    // LEVEL 4
    //
    panel4: {
        id: "panel4",
        type: "Container",
        props: {
            display: "flex",
            gap: 8,
            padding: 12,
            row: 0,
            borderSize: 1,
        },
        children: [
            "panel4Text",
            "panel4Button",
        ],
    },

    panel4Text: {
        id: "panel4Text",
        type: "Text",
        props: {
            value: "Level 4",
        },
    },

    panel4Button: {
        id: "panel4Button",
        type: "Button",
        props: {
            label: "Action 4",
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