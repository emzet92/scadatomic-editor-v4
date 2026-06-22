import type { UiTree } from "../../Renderer";

export type UiNode = UiTree[string];

export type PropEntry = [string, unknown];

export type UpdateNode = (
  nodeId: string,
  updater: (node: UiNode) => UiNode
) => void;
