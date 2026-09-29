import type { UiNode } from "../../project/model/document";

export type { UiNode };
export type PropEntry = [string, unknown];

export type UpdateNode = (
  nodeId: string,
  updater: (node: UiNode) => UiNode
) => void;
