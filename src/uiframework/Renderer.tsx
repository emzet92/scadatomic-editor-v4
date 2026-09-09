import type { ReactNode } from "react";
import type { ComponentRegistry } from "./registry/editor-registry";
import type { NodeId, UiDocument, UiNode } from "./core/document";
import { getDefaultComponentVariantProps } from "./component-variants";
import {
  applyComponentInstanceInputs,
  getComponentDefinitionForInstance,
} from "./reusable-components";

export type RenderNodeContext = {
  componentInstanceId?: string | undefined;
  componentDefinitionId?: string | undefined;
  internal?: boolean | undefined;
};

export type RenderNodeDecorator = (
  node: UiNode,
  context: RenderNodeContext
) => Record<string, unknown>;

export type RenderNodeProps = {
  id: NodeId;
  document: UiDocument;
  registry: ComponentRegistry;
  decorateProps?: RenderNodeDecorator | undefined;
  decorateComponentInternals?: boolean | undefined;
  visited?: ReadonlySet<NodeId>;
  context?: RenderNodeContext;
};

export function RenderNode({
  id,
  document,
  registry,
  decorateProps,
  decorateComponentInternals = false,
  visited = new Set<NodeId>(),
  context = {},
}: RenderNodeProps): ReactNode {
  const node = document.nodes[id];

  if (!node) return <UnknownNode message={`Missing node: ${id}`} />;
  if (visited.has(id)) return <UnknownNode message={`Recursive node: ${id}`} />;

  if (node.type === "ComponentInstance") {
    const definition = getComponentDefinitionForInstance(document, node);
    if (!definition) {
      return <UnknownNode message={`Missing component definition: ${node.componentDefinitionId ?? "unknown"}`} />;
    }

    const componentDocument = applyComponentInstanceInputs(
      document,
      definition,
      node
    );
    const instanceContext: RenderNodeContext = {
      componentInstanceId: node.id,
      componentDefinitionId: definition.id,
      internal: true,
    };

    const internalDecorator: RenderNodeDecorator = (internalNode, internalContext) => ({
      ...getDefaultComponentVariantProps(internalNode),
      ...(decorateComponentInternals
        ? decorateProps?.(internalNode, internalContext) ?? {}
        : {}),
    });

    const instanceEnvironmentProps = decorateProps?.(node, context) ?? {};

    return (
      <div {...instanceEnvironmentProps}>
        <RenderNode
          id={definition.rootId}
          document={componentDocument}
          registry={registry}
          decorateProps={internalDecorator}
          decorateComponentInternals={decorateComponentInternals}
          visited={new Set<NodeId>()}
          context={instanceContext}
        />
      </div>
    );
  }

  const Component = registry[node.type];
  if (!Component) return <UnknownNode message={`Unknown component: ${node.type}`} />;

  const nextVisited = new Set(visited);
  nextVisited.add(id);
  const environmentProps = decorateProps?.(node, context) ?? {};

  return (
    <Component {...node.props} {...environmentProps}>
      {node.children?.map((childId) => (
        <RenderNode
          key={childId}
          id={childId}
          document={document}
          registry={registry}
          decorateProps={decorateProps}
          decorateComponentInternals={decorateComponentInternals}
          visited={nextVisited}
          context={context}
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
