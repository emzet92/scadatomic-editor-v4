export type TreeNodeData = {
  id: string;
  name: string;
  type: string;
  children?: string[] | undefined;
};

export type TreeNodes = Record<
  string,
  TreeNodeData
>;

export type TreeNodeProps = {
  nodeId: string;
  level?: number;
  nodes: TreeNodes;
  selectedNodeId?: string | null | undefined;
  setSelectedNodeId: (nodeId: string) => void;
  moveNodeUp: (nodeId: string) => void;
  moveNodeDown: (nodeId: string) => void;
};
