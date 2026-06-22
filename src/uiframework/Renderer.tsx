import React from "react";
import { useEditorStore } from "./editor-store";
import type { ComponentRegistry } from "./registry/editor-registry";

export type NodeId = string;

export type UiNode = {
  id: NodeId;
  type: string;
  props?: Record<string, unknown>;
  children?: NodeId[];
};

export type UiTree = Record<NodeId, UiNode>;



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
  // TODO: remove shitty wrapper on pointer down.
  return (
    <Component
      {...node.props}
      data-node-id={id}
      onPointerDown={(e: React.PointerEvent) => {
        e.stopPropagation();

        useEditorStore
          .getState()
          .startNodeDrag(id);
      }}
    >
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