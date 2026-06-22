import type {
  PropEntry,
  UpdateNode,
} from "./property-panel-types";
import { PropInput } from "./PropInput";
import { TextStyleToolbar } from "./TextStyleToolbar";
import { BorderSettings } from "./BorderSettings";

const textStyleProps =
  new Set([
    "fontWeight",
    "italic",
    "underline",
  ]);

const borderProps =
  new Set([
    "borderSize",
    "borderColor",
    "borderRadius",
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

  const hasBorderSettings =
    "borderSize" in propsMap ||
    "borderColor" in propsMap ||
    "borderRadius" in propsMap;

  const visibleProps =
    props.filter(
      ([key]) =>
        !textStyleProps.has(key) &&
        !borderProps.has(key)
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

      {hasBorderSettings && (
        <BorderSettings
          nodeId={nodeId}
          borderSize={propsMap.borderSize}
          borderColor={propsMap.borderColor}
          borderRadius={propsMap.borderRadius}
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