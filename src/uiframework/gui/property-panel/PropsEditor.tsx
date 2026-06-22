import type {
  PropEntry,
  UpdateNode,
} from "./property-panel-types";
import { PropInput } from "./PropInput";
import { TextStyleToolbar } from "./TextStyleToolbar";

const textStyleProps =
  new Set([
    "fontWeight",
    "italic",
    "underline",
  ]);

export function PropsEditor({
  nodeId,
  props,
  updateNode,
}: {
  nodeId: string;
  props: PropEntry[];
  updateNode: UpdateNode;
}) {
  const propsMap =
    Object.fromEntries(props);

  const hasTextStyleToolbar =
    "fontWeight" in propsMap ||
    "italic" in propsMap ||
    "underline" in propsMap;

  const visibleProps =
    props.filter(
      ([key]) => !textStyleProps.has(key)
    );

  return (
    <div className="space-y-4">
      {hasTextStyleToolbar && (
        <TextStyleToolbar
          nodeId={nodeId}
          fontWeight={propsMap.fontWeight}
          italic={propsMap.italic}
          underline={propsMap.underline}
          updateNode={updateNode}
        />
      )}

      {visibleProps.map(([key, value]) => (
        <PropInput
          key={key}
          nodeId={nodeId}
          propName={key}
          value={value}
          updateNode={updateNode}
        />
      ))}
    </div>
  );
}