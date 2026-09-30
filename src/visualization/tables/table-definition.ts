import type {
  UiComponentDefinition,
  UiDocument,
  UiNode,
} from "../../project/model/document";
import { createProjectComponentRepository } from "../components/component-repository";

export const TABLE_DEFINITION_KIND = "table" as const;
export const DEFAULT_TABLE_ROWS = 3;
export const DEFAULT_TABLE_COLUMNS = 3;

export type TableDimensions = {
  rows: number;
  columns: number;
};

export function isTableDefinition(
  definition: UiComponentDefinition | undefined
): definition is UiComponentDefinition & { kind: typeof TABLE_DEFINITION_KIND } {
  return definition?.kind === TABLE_DEFINITION_KIND;
}

export function listTableDefinitions(document: UiDocument): UiComponentDefinition[] {
  return createProjectComponentRepository(document)
    .list()
    .filter(isTableDefinition);
}


export function countTableDefinitionUsages(
  document: UiDocument,
  tableId: string
): number {
  let count = 0;
  for (const node of Object.values(document.nodes)) {
    if (node.type === "ComponentInstance" && node.componentDefinitionId === tableId) count += 1;
  }
  for (const definition of Object.values(document.components ?? {})) {
    if (definition.id === tableId) continue;
    for (const node of Object.values(definition.nodes)) {
      if (node.type === "ComponentInstance" && node.componentDefinitionId === tableId) count += 1;
    }
  }
  return count;
}

export function createTableDefinition(
  name: string,
  dimensions: Partial<TableDimensions> = {}
): UiComponentDefinition {
  const rows = sanitizeDimension(dimensions.rows, DEFAULT_TABLE_ROWS);
  const columns = sanitizeDimension(dimensions.columns, DEFAULT_TABLE_COLUMNS);
  const rootId = crypto.randomUUID();
  const nodes: Record<string, UiNode> = {};
  const children: string[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const cell = createTableCellNode(row, column);
      nodes[cell.id] = cell;
      children.push(cell.id);
    }
  }

  nodes[rootId] = {
    id: rootId,
    name: "Table",
    type: "Table",
    props: {
      rows,
      columns,
      width: "100%",
      minWidth: 320,
      borderSize: 1,
      borderColor: "#d4d4d8",
      borderRadius: 8,
      backgroundColor: "#ffffff",
    },
    children,
  };

  return {
    id: crypto.randomUUID(),
    name,
    rootId,
    nodes,
    kind: TABLE_DEFINITION_KIND,
  };
}

export function getTableDimensions(
  definition: UiComponentDefinition
): TableDimensions {
  const root = definition.nodes[definition.rootId];
  return {
    rows: sanitizeDimension(root?.props?.rows, DEFAULT_TABLE_ROWS),
    columns: sanitizeDimension(root?.props?.columns, DEFAULT_TABLE_COLUMNS),
  };
}

export function resizeTableDefinition(
  definition: UiComponentDefinition,
  nextDimensions: TableDimensions
): UiComponentDefinition {
  if (!isTableDefinition(definition)) return definition;

  const rows = sanitizeDimension(nextDimensions.rows, DEFAULT_TABLE_ROWS);
  const columns = sanitizeDimension(nextDimensions.columns, DEFAULT_TABLE_COLUMNS);
  const root = definition.nodes[definition.rootId];
  if (!root || root.type !== "Table") return definition;

  const currentDimensions = getTableDimensions(definition);
  const cells = getTableCells(definition, currentDimensions);
  const nextNodes = { ...definition.nodes };
  const nextChildren: string[] = [];
  const retainedCellIds = new Set<string>();

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const existing = cells.get(cellKey(row, column));
      const cell = existing ?? createTableCellNode(row, column);
      const normalizedCell: UiNode = {
        ...cell,
        name: `Cell_${row + 1}_${column + 1}`,
        props: {
          ...(cell.props ?? {}),
          row,
          column,
        },
      };
      nextNodes[normalizedCell.id] = normalizedCell;
      nextChildren.push(normalizedCell.id);
      retainedCellIds.add(normalizedCell.id);
    }
  }

  for (const cellId of root.children ?? []) {
    if (retainedCellIds.has(cellId)) continue;
    removeNodeSubtree(nextNodes, cellId);
  }

  nextNodes[root.id] = {
    ...root,
    props: {
      ...(root.props ?? {}),
      rows,
      columns,
    },
    children: nextChildren,
  };

  return {
    ...definition,
    nodes: nextNodes,
  };
}

export function getTableCellEntries(definition: UiComponentDefinition): Array<{
  node: UiNode;
  row: number;
  column: number;
}> {
  const dimensions = getTableDimensions(definition);
  const root = definition.nodes[definition.rootId];
  if (!root) return [];

  return (root.children ?? [])
    .map((id, index) => {
      const node = definition.nodes[id];
      if (!node || node.type !== "TableCell") return null;
      const inferredRow = Math.floor(index / dimensions.columns);
      const inferredColumn = index % dimensions.columns;
      return {
        node,
        row: readCoordinate(node.props?.row, inferredRow),
        column: readCoordinate(node.props?.column, inferredColumn),
      };
    })
    .filter((entry): entry is { node: UiNode; row: number; column: number } => !!entry);
}

function getTableCells(
  definition: UiComponentDefinition,
  dimensions: TableDimensions
): Map<string, UiNode> {
  const result = new Map<string, UiNode>();
  const root = definition.nodes[definition.rootId];
  if (!root) return result;

  (root.children ?? []).forEach((id, index) => {
    const node = definition.nodes[id];
    if (!node || node.type !== "TableCell") return;
    const row = readCoordinate(node.props?.row, Math.floor(index / dimensions.columns));
    const column = readCoordinate(node.props?.column, index % dimensions.columns);
    result.set(cellKey(row, column), node);
  });

  return result;
}

function createTableCellNode(row: number, column: number): UiNode {
  return {
    id: crypto.randomUUID(),
    name: `Cell_${row + 1}_${column + 1}`,
    type: "TableCell",
    props: {
      row,
      column,
      minHeight: 48,
      padding: 8,
      gap: 6,
      backgroundColor: "transparent",
      horizontalAlign: "start",
      verticalAlign: "center",
    },
    children: [],
  };
}

function removeNodeSubtree(nodes: Record<string, UiNode>, rootId: string) {
  const stack = [rootId];
  const visited = new Set<string>();
  while (stack.length > 0) {
    const id = stack.pop();
    if (!id || visited.has(id)) continue;
    visited.add(id);
    const node = nodes[id];
    if (!node) continue;
    for (const childId of node.children ?? []) stack.push(childId);
    delete nodes[id];
  }
}

function sanitizeDimension(value: unknown, fallback: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(24, Math.max(1, Math.floor(numeric)));
}

function readCoordinate(value: unknown, fallback: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : fallback;
}

function cellKey(row: number, column: number) {
  return `${row}:${column}`;
}
