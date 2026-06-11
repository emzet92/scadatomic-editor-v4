import type { UiTree } from "./Renderer";
import { useEditorStore } from "./editor-store";

type Props = {
    nodes: UiTree;
    selectedNodeId: string | null;
};

export function PropertyPanel({
    nodes,
}: Props) {
    const selectedNodeId =
        useEditorStore(
            (s) => s.selectedNodeId
        );
    if (!selectedNodeId) {
        return <div>No selection</div>;
    }

    const node = nodes[selectedNodeId];

    const propsToRender =
        node.type === "Container"
            ? (node.props.style ?? {})
            : (node.props ?? {});

    return (
        <>
            <h3>{node.type}</h3>

            {Object.entries(propsToRender).map(
                ([key, value]) => (
                    <div key={key}>
                        <label>{key}</label>

                        <input
                            value={String(value)}
                            readOnly
                        />
                    </div>
                )
            )}
        </>
    );
}