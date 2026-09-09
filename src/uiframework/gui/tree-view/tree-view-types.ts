export type TreeNodeData = {
  id: string;
  name: string;
  type: string;
  children?: string[] | undefined;
};

export type TreeNodes = Record<string, TreeNodeData>;

export type TreeSelectionOptions = {
  toggle?: boolean;
  additive?: boolean;
};

export type TreeNodeProps = {
  nodeId: string;
  level?: number;
  nodes: TreeNodes;
  selectedNodeId?: string | null | undefined;
  selectedNodeIds?: readonly string[] | undefined;
  selectNode: (nodeId: string, options?: TreeSelectionOptions) => void;
  moveNodeUp: (nodeId: string) => void;
  moveNodeDown: (nodeId: string) => void;
};
