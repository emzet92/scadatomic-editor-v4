import type { ModalId, NodeId, UiDocument, UiModal } from "./document";

export function collectModalNodeIds(document: UiDocument, modalId: ModalId): NodeId[] {
  const modal = document.modals?.[modalId];
  if (!modal) return [];
  const result: NodeId[] = [];
  const visited = new Set<NodeId>();
  const stack = [modal.rootId];
  while (stack.length > 0) {
    const id = stack.pop();
    if (!id || visited.has(id)) continue;
    visited.add(id);
    const node = document.nodes[id];
    if (!node) continue;
    result.push(id);
    for (const childId of node.children ?? []) stack.push(childId);
  }
  return result;
}

export function getModalByName(document: UiDocument, name: string): UiModal | undefined {
  return Object.values(document.modals ?? {}).find((modal) => modal.name === name);
}
