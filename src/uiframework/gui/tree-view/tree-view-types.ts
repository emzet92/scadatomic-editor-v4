export type TreeNodeData = {
  id: string;
  type: string;
  children?: string[];
};

export type TreeNodes = Record<
  string,
  TreeNodeData
>;

export type TreeNodeProps = {
  nodeId: string;
  level?: number;
  nodes: TreeNodes;
  selectedNodeId?: string | null;
  setSelectedNodeId: (nodeId: string) => void;
  moveNodeUp: (nodeId: string) => void;
  moveNodeDown: (nodeId: string) => void;
};
