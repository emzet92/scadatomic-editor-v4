import React from "react";

export type NodeId = string;

export type UiNode = {
  id: NodeId;
  type: string;
  props?: Record<string, unknown>;
  children?: NodeId[];
};

export type UiTree = Record<NodeId, UiNode>;

export type ScadatomicComponent<P = any> = React.ComponentType<
  P & {
    children?: React.ReactNode;
    "data-node-id"?: string;
  }
>;

export type ComponentRegistry = Record<string, ScadatomicComponent>;

export type RenderNodeProps = {
  id: NodeId;
  nodes: UiTree;
  registry: ComponentRegistry;
  visited?: Set<NodeId>;
};

export function RenderNode({
  id,
  nodes,
  registry,
  visited = new Set(),
}: RenderNodeProps) {
  const node = nodes[id];

  if (!node) {
    throw new Error(`Node not found: ${id}`);
  }

  const Component = registry[node.type];

  if (!Component) {
    throw new Error(`Component not found: ${node.type}`);
  }

  if (visited.has(id)) {
    console.warn("Recursive node detected:", id);
    return null;
  }

  const nextVisited = new Set(visited);
  nextVisited.add(id);

  return (
    <Component {...node.props} data-node-id={id}>
      {node.children?.map((childId) => (
        <RenderNode
          key={childId}
          id={childId}
          nodes={nodes}
          registry={registry}
          visited={nextVisited}
        />
      ))}
    </Component>
  );
}