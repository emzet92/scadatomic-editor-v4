import { useEffect } from 'react'


import {
    type ComponentRegistry,
    type UiTree,
    RenderNode
} from './Renderer';

import { Container } from './Container';
import { EditorControls } from './EditorControls';
import { PropertyPanel } from './PropertyPanel';
import { useEditorStore } from './editor-store';
import { ComponentPalette } from './PaletteItem';
import { Canvas, LeftSidebar, RightSidebar, StatusBar, Toolbar } from './EditorLayout';
import { TreeView } from './TreeView';

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
                                registry={registry}
                            />

                            <EditorControls
                                registry={registry}
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