import { TreeNode } from "./TreeNode";
import type { TreeNodes, TreeSelectionOptions } from "./tree-view-types";

const noopMove = () => {};
const noopDuplicate = () => null;
const noopDelete = () => {};
const never = () => false;

export type NodeTreeProps = {
  rootId: string;
  nodes: TreeNodes;
  selectedNodeId?: string | null | undefined;
  selectedNodeIds?: readonly string[] | undefined;
  selectNode: (nodeId: string, options?: TreeSelectionOptions) => void;
  moveNodeUp?: ((nodeId: string) => void) | undefined;
  moveNodeDown?: ((nodeId: string) => void) | undefined;
  duplicateNode?: ((nodeId: string) => string | null) | undefined;
  canDuplicateNode?: ((nodeId: string) => boolean) | undefined;
  deleteNode?: ((nodeId: string) => void) | undefined;
  canDeleteNode?: ((nodeId: string) => boolean) | undefined;
};

/**
 * Shared tree renderer for both page trees and reusable-component definitions.
 * Callers provide capabilities; rendering/collapse/selection stay identical.
 */
export function NodeTree({
  rootId,
  nodes,
  selectedNodeId,
  selectedNodeIds = selectedNodeId ? [selectedNodeId] : [],
  selectNode,
  moveNodeUp = noopMove,
  moveNodeDown = noopMove,
  duplicateNode = noopDuplicate,
  canDuplicateNode = never,
  deleteNode = noopDelete,
  canDeleteNode = never,
}: NodeTreeProps) {
  if (!nodes[rootId]) return null;

  return (
    <TreeNode
      nodeId={rootId}
      nodes={nodes}
      selectedNodeId={selectedNodeId}
      selectedNodeIds={selectedNodeIds}
      selectNode={selectNode}
      moveNodeUp={moveNodeUp}
      moveNodeDown={moveNodeDown}
      duplicateNode={duplicateNode}
      canDuplicateNode={canDuplicateNode}
      deleteNode={deleteNode}
      canDeleteNode={canDeleteNode}
    />
  );
}
