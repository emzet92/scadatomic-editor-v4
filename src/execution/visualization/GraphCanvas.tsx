import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";

export function GraphCanvas({
  nodes,
  edges,
  emptyMessage,
}: {
  nodes: Node[];
  edges: Edge[];
  emptyMessage: string;
}) {
  if (nodes.length === 0) {
    return (
      <div className="flex h-[520px] items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white text-sm text-zinc-500">
        {emptyMessage}
      </div>
    );
  }

  const renderedNodes = nodes.map((node) => ({
    ...node,
    style: {
      width: 230,
      borderRadius: 12,
      border: "1px solid #e4e4e7",
      background: "#ffffff",
      boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
      padding: 0,
      ...node.style,
    },
    data: {
      ...node.data,
      label: (
        <div className="px-4 py-3 text-left">
          <div className="flex items-start gap-3">
            {node.data.icon ? (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-700">
                {String(node.data.icon)}
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              {node.data.eyebrow ? (
                <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  {String(node.data.eyebrow)}
                </div>
              ) : null}
              <div className="text-xs font-semibold text-zinc-900">
                {String(node.data.title ?? node.id)}
              </div>
              {node.data.detail ? (
                <div className="mt-1 break-words text-[10px] leading-4 text-zinc-500">
                  {String(node.data.detail)}
                </div>
              ) : null}
            </div>
          </div>
          {node.data.status ? (
            <div className="mt-2 text-[9px] font-semibold uppercase tracking-wide text-zinc-400">
              {String(node.data.status)}
            </div>
          ) : null}
        </div>
      ),
    },
  }));

  return (
    <div className="h-[620px] overflow-hidden rounded-xl border border-zinc-200 bg-[#f8f9fc]">
      <ReactFlow
        nodes={renderedNodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1.1 }}
        nodesDraggable={false}
        nodesConnectable={false}
        deleteKeyCode={null}
        minZoom={0.2}
        maxZoom={1.5}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="#d8dbea" />
        <Controls showInteractive={false} position="bottom-right" />
      </ReactFlow>
    </div>
  );
}
