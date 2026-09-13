import type { ComponentDefinitionId } from "../core/document";
import type { TagCollectionSource } from "../data/collections/TagCollectionSource";

export type StaticContentBehavior = {
  kind: "static";
};

export type RepeatContentBehavior = {
  kind: "repeat";
  source: TagCollectionSource;
  template: {
    componentDefinitionId: ComponentDefinitionId;
    inputName: string;
  };
};

export type ContainerContentBehavior = StaticContentBehavior | RepeatContentBehavior;

export function isContainerContentBehavior(
  value: unknown
): value is ContainerContentBehavior {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  if (candidate.kind === "static") return true;
  if (candidate.kind !== "repeat") return false;
  const source = candidate.source;
  const template = candidate.template;
  return (
    !!source &&
    typeof source === "object" &&
    !Array.isArray(source) &&
    (source as Record<string, unknown>).kind === "tagsByUdt" &&
    typeof (source as Record<string, unknown>).udtId === "string" &&
    !!template &&
    typeof template === "object" &&
    !Array.isArray(template) &&
    typeof (template as Record<string, unknown>).componentDefinitionId === "string" &&
    typeof (template as Record<string, unknown>).inputName === "string"
  );
}


export type ContainerChildHost = {
  type: string;
  contentBehavior?: ContainerContentBehavior | undefined;
};

/**
 * Repeat containers own their rendered children at runtime. Static designer
 * children would never be rendered, so all manual insert/move/duplicate paths
 * must treat the container as read-only while repeat mode is active.
 */
export function canAcceptManualChildren(node: ContainerChildHost): boolean {
  return !(node.type === "Container" && node.contentBehavior?.kind === "repeat");
}

export function isRepeatContainer(node: ContainerChildHost): boolean {
  return node.type === "Container" && node.contentBehavior?.kind === "repeat";
}
