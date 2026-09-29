import type { Node as AcornNode, Program } from "acorn";

export type AstGraphNode = {
  id: string;
  type: string;
  label: string;
  sourcePreview?: string | undefined;
  location?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  } | undefined;
};

export type AstGraphEdge = {
  id: string;
  source: string;
  target: string;
  role: string;
};

export type AstGraph = {
  nodes: AstGraphNode[];
  edges: AstGraphEdge[];
};

type NodeLike = AcornNode & Record<string, unknown>;

export function buildAstGraph(program: Program, source: string): AstGraph {
  const nodes: AstGraphNode[] = [];
  const edges: AstGraphEdge[] = [];
  const seen = new WeakSet<object>();

  function visit(node: NodeLike, parentId?: string, role = "root") {
    if (seen.has(node)) return;
    seen.add(node);

    const id = astNodeId(node);
    nodes.push({
      id,
      type: node.type,
      label: describeAstNode(node),
      sourcePreview: previewSource(source, node.start, node.end),
      ...(node.loc
        ? {
            location: {
              startLine: node.loc.start.line,
              startColumn: node.loc.start.column,
              endLine: node.loc.end.line,
              endColumn: node.loc.end.column,
            },
          }
        : {}),
    });

    if (parentId) {
      edges.push({
        id: `${parentId}->${id}:${role}`,
        source: parentId,
        target: id,
        role,
      });
    }

    for (const [key, value] of Object.entries(node)) {
      if (IGNORED_KEYS.has(key)) continue;
      if (isNode(value)) {
        visit(value, id, key);
        continue;
      }
      if (Array.isArray(value)) {
        value.forEach((entry, index) => {
          if (isNode(entry)) visit(entry, id, `${key}[${index}]`);
        });
      }
    }
  }

  visit(program as unknown as NodeLike);
  return { nodes, edges };
}

const IGNORED_KEYS = new Set(["type", "start", "end", "loc", "range"]);

function astNodeId(node: NodeLike): string {
  return `${node.type}:${node.start}:${node.end}`;
}

function isNode(value: unknown): value is NodeLike {
  return !!value && typeof value === "object" && typeof (value as { type?: unknown }).type === "string";
}

function describeAstNode(node: NodeLike): string {
  const name = typeof node.name === "string" ? node.name : undefined;
  if (name) return `${node.type} · ${name}`;

  const operator = typeof node.operator === "string" ? node.operator : undefined;
  if (operator) return `${node.type} · ${operator}`;

  if (node.type === "Literal" && "value" in node) {
    return `${node.type} · ${formatValue(node.value)}`;
  }

  const kind = typeof node.kind === "string" ? node.kind : undefined;
  if (kind) return `${node.type} · ${kind}`;

  return node.type;
}

function previewSource(source: string, start: number, end: number): string | undefined {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return undefined;
  const compact = source.slice(start, end).replace(/\s+/g, " ").trim();
  if (!compact) return undefined;
  return compact.length > 72 ? `${compact.slice(0, 69)}...` : compact;
}

function formatValue(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (value === null) return "null";
  return String(value);
}
