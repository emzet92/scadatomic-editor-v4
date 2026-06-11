import type { UiTree } from "./Renderer";
import { useEditorStore } from "./editor-store";

type Props = {
    nodes: UiTree;
};

export function PropertyPanel({ nodes }: Props) {
    const selectedNodeId = useEditorStore(
        (s) => s.selectedNodeId
    );

    const updateNode = useEditorStore(
        (s) => s.updateNode
    );

    if (!selectedNodeId) {
        return <div data-editor-ignore>No selection</div>;
    }

    const node = nodes[selectedNodeId];

    if (!node) {
        return <div data-editor-ignore>Node not found</div>;
    }

    const propsToRender = node.props ?? {};

    return (
        <div data-editor-ignore>
            <h3>
                {node.type} / {node.id}
            </h3>

            {Object.entries(propsToRender).map(([key, value]) => (
                <div key={key}>
                    <label>{key}</label>

                    <input
                        data-editor-ignore
                        value={String(value)}
                        onChange={(e) => {
                            const nextValue = e.target.value;

                            updateNode(node.id, (currentNode) => ({
                                ...currentNode,
                                props: {
                                    ...currentNode.props,
                                    [key]: nextValue,
                                },
                            }));
                        }}
                    />
                </div>
            ))}
        </div>
    );
}