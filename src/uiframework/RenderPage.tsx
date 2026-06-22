import { useEffect, useState } from "react";
import { useEditorStore } from "./editor-store";
import { RendererRoot } from "./EditorPage";
import type {  UiTree } from "./Renderer";
import { RuntimeProvider } from "./runtime-provider";
import { useRuntimeStore } from "./runtime-store";
import { SuccessToast } from "./SuccessToast";
import { runtimeRegistry } from "./registry/runtime-registry";
import { initialNodes } from "./registry/initial-values";



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
                registry={runtimeRegistry}
            />
        </>
    );
}