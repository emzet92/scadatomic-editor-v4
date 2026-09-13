import { useMemo } from "react";
import { buildSemanticCodeGraph } from "../ast/semantic-code-graph-builder";
import { parseScript } from "../ast/parse-script";
import { semanticCodeGraphToReactFlow } from "./semantic-code-graph-adapter";
import { GraphCanvas } from "./GraphCanvas";

export function CodeGraphView({ source }: { source: string }) {
  const result = useMemo(() => {
    try {
      const ast = parseScript(source);
      const graph = buildSemanticCodeGraph(ast);
      return {
        graph: semanticCodeGraphToReactFlow(graph),
        error: null as string | null,
      };
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
        This handler cannot be visualized because its flow could not be understood.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
        <div className="text-sm font-semibold text-zinc-900">Handler flow</div>
        <div className="mt-1 text-xs text-zinc-500">
          A simplified view of what this handler does. Programming syntax and parser details are intentionally hidden.
        </div>
      </div>
      <GraphCanvas
        nodes={result.graph.nodes}
        edges={result.graph.edges}
        emptyMessage="The script does not contain executable flow."
      />
    </div>
  );
}
