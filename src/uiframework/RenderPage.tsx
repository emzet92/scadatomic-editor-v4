import { useEffect, useState } from "react";
import { useEditorStore } from "./editor-store";
import { RendererRoot } from "./EditorPage";
import type { ComponentRegistry, UiTree } from "./Renderer";
import { RuntimeProvider } from "./runtime-provider";
import { useRuntimeStore } from "./runtime-store";
import { Container } from "./Container";
import { SuccessToast } from "./SuccessToast";
import { getWs } from "./websocket";

const buttonClassName = `
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
`;

const registry: ComponentRegistry = {
    Container,

    Text: ({ value, ...props }) => (
        <span
            {...props}
            style={{
                color: props.color,
            }}
        >
            {String(value ?? "")}
        </span>
    ),
    Button: ({
        label,
        onClickEvent,
        id,
        ...props
    }) => (

        <button
            {...props}
            className={buttonClassName}
            onClick={() => {
                if (!onClickEvent) {
                    return;
                }
                console.log("This is the click event", JSON.stringify({
                    event:
                        onClickEvent,
                    nodeId: id,
                }));

                getWs().send(
                    JSON.stringify({
                        event:
                            onClickEvent,
                        nodeId: id,
                    })
                );
            }}
        >
            {label}
        </button>
    )
};

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
            color: "black",
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

function applyRuntimeValues(
    nodes: UiTree,
    values: Record<string, unknown>
): UiTree {
    return Object.fromEntries(
        Object.entries(nodes).map(
            ([id, node]) => {
                const tag =
                    node.props?.tag as
                    | string
                    | undefined;

                if (
                    !tag ||
                    values[tag] === undefined
                ) {
                    return [
                        id,
                        node,
                    ];
                }

                return [
                    id,
                    {
                        ...node,
                        props: {
                            ...node.props,
                            value:
                                values[tag],
                        },
                    },
                ];
            }
        )
    );
}

export function RenderPage() {

    const [showToast, setShowToast] = useState(false);

    const handleScreenUpdated =
        () => {
            setShowToast(true);

            setTimeout(() => {
                setShowToast(false);
            }, 3000);
        };

    const nodes =
        useEditorStore(
            (s) => s.nodes
        );

    const setNodes =
        useEditorStore(
            (s) => s.setNodes
        );

    const runtimeValues =
        useRuntimeStore(
            (s) => s.values
        );

    useEffect(() => {
        if (
            Object.keys(nodes)
                .length === 0
        ) {
            setNodes(
                initialNodes
            );
        }
    }, [
        nodes,
        setNodes,
    ]);

    if (!nodes.root) {
        return null;
    }

    const runtimeNodes =
        applyRuntimeValues(
            nodes,
            runtimeValues
        );

    return (
        <>
            <RuntimeProvider
                onScreenUpdated={
                    handleScreenUpdated
                }
            />

            {showToast && (
                <SuccessToast />
            )}

            <RendererRoot
                rootId="root"
                nodes={
                    runtimeNodes
                }
                registry={registry}
            />
        </>
    );
}