import type { ReactNode } from "react";
import type { ComponentRegistry } from "./registry/editor-registry";
import type { NodeId, UiDocument, UiNode } from "./core/document";

export type RenderNodeDecorator = (
  node: UiNode
) => Record<string, unknown>;

export type RenderNodeProps = {
  id: NodeId;
  document: UiDocument;
  registry: ComponentRegistry;
  decorateProps?: RenderNodeDecorator | undefined;
  visited?: ReadonlySet<NodeId>;
};

export function RenderNode({
  id,
  document,
  registry,
  decorateProps,
  visited = new Set<NodeId>(),
}: RenderNodeProps): ReactNode {
  const node = document.nodes[id];

  if (!node) {
    return <UnknownNode message={`Missing node: ${id}`} />;
  }

  if (visited.has(id)) {
    return <UnknownNode message={`Recursive node: ${id}`} />;
  }

  const Component = registry[node.type];

  if (!Component) {
    return <UnknownNode message={`Unknown component: ${node.type}`} />;
  }

  const nextVisited = new Set(visited);
  nextVisited.add(id);

  const environmentProps = decorateProps?.(node) ?? {};

  return (
    <Component
      {...node.props}
      {...environmentProps}
    >
      {node.children?.map((childId) => (
        <RenderNode
          key={childId}
          id={childId}
          document={document}
          registry={registry}
          decorateProps={decorateProps}
          visited={nextVisited}
        />
      ))}
    </Component>
  );
}

function UnknownNode({ message }: { message: string }) {
  return (
    <div
      role="alert"
      style={{
        padding: 8,
        border: "1px dashed #f59e0b",
        background: "#fffbeb",
        color: "#92400e",
        fontSize: 12,
        borderRadius: 6,
      }}
    >
      {message}
    </div>
  );
}
