export type GraphPosition = { x: number; y: number };

/** Small deterministic layered layout. React Flow remains a renderer, not a domain model. */
export function layoutDirectedGraph(
  nodeIds: readonly string[],
  edges: readonly { source: string; target: string }[],
  options: { columnWidth?: number; rowHeight?: number } = {}
): Map<string, GraphPosition> {
  const columnWidth = options.columnWidth ?? 270;
  const rowHeight = options.rowHeight ?? 130;
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();

  for (const id of nodeIds) {
    incoming.set(id, []);
    outgoing.set(id, []);
  }
  for (const edge of edges) {
    incoming.get(edge.target)?.push(edge.source);
    outgoing.get(edge.source)?.push(edge.target);
  }

  const depth = new Map<string, number>();
  const queue = nodeIds.filter((id) => (incoming.get(id)?.length ?? 0) === 0);
  for (const id of queue) depth.set(id, 0);

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const id = queue[cursor]!;
    const nextDepth = (depth.get(id) ?? 0) + 1;
    for (const child of outgoing.get(id) ?? []) {
      depth.set(child, Math.max(depth.get(child) ?? 0, nextDepth));
      if (!queue.includes(child)) queue.push(child);
    }
  }

  for (const id of nodeIds) {
    if (!depth.has(id)) depth.set(id, 0);
  }

  const rows = new Map<number, string[]>();
  for (const id of nodeIds) {
    const d = depth.get(id) ?? 0;
    const row = rows.get(d) ?? [];
    row.push(id);
    rows.set(d, row);
  }

  const result = new Map<string, GraphPosition>();
  for (const [d, ids] of rows) {
    ids.forEach((id, index) => {
      const offset = (ids.length - 1) / 2;
      result.set(id, {
        x: (index - offset) * columnWidth,
        y: d * rowHeight,
      });
    });
  }
  return result;
}
