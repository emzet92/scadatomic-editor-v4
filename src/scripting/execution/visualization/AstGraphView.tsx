import { useMemo } from "react";
import { buildAstGraph } from "../ast/ast-graph-builder";
import { parseScript } from "../ast/parse-script";
import { astGraphToReactFlow } from "./ast-graph-adapter";
import { GraphCanvas } from "./GraphCanvas";

export function AstGraphView({ source }: { source: string }) {
  const result = useMemo(() => {
    try {
      const ast = parseScript(source);
      const graph = buildAstGraph(ast, source);
      return { graph: astGraphToReactFlow(graph), error: null as string | null };
    } catch (error) {
      return {
        graph: { nodes: [], edges: [] },
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }, [source]);

  if (result.error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Acorn parse error: {result.error}
      </div>
    );
  }

  return (
    <GraphCanvas
      nodes={result.graph.nodes}
      edges={result.graph.edges}
      emptyMessage="The script does not contain AST nodes."
    />
  );
}
