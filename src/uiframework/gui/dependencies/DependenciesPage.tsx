import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import { Braces, MousePointerClick, Network, Workflow } from "lucide-react";
import { useParams } from "react-router-dom";
import { WorkspaceHeader } from "../workspace/WorkspaceHeader";

type DemoNodeData = {
  title: string;
  detail: string;
  tone?: "event" | "script" | "runtime" | "resource" | "ui";
};

type DemoNode = Node<DemoNodeData>;

const NODE_BASE = {
  width: 190,
  borderRadius: 12,
  border: "1px solid #e5e7f0",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
  padding: 0,
  background: "#ffffff",
  color: "#18181b",
} as const;

function demoNode(
  id: string,
  x: number,
  y: number,
  title: string,
  detail: string,
  tone: DemoNodeData["tone"] = "resource",
): DemoNode {
  return {
    id,
    position: { x, y },
    data: { title, detail, tone },
    type: "default",
    style: NODE_BASE,
  };
}

function demoEdge(
  id: string,
  source: string,
  target: string,
  label?: string,
): Edge {
  return {
    id,
    source,
    target,
    ...(label ? { label } : {}),
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
    style: { strokeWidth: 1.5, stroke: "#7c83a7" },
    labelStyle: { fill: "#71717a", fontSize: 11, fontWeight: 600 },
    labelBgStyle: { fill: "#ffffff", fillOpacity: 0.94 },
    labelBgPadding: [5, 3],
    labelBgBorderRadius: 4,
  };
}

const eventFlowNodes: DemoNode[] = [
  demoNode("button", 0, 110, "Button1", "UI event: onClick", "ui"),
  demoNode("handler", 260, 110, "startButton.Clicked", "Event handler", "event"),
  demoNode("script", 520, 110, "JavaScript", "Runs handler source", "script"),
  demoNode("emit", 780, 30, "sendRuntimeEvent", "pump.start.requested", "event"),
  demoNode("listener", 1040, 30, "Runtime listener", "Receives emitted event", "runtime"),
  demoNode("write", 780, 190, "TagRuntime.write", "Pump1.running = true", "runtime"),
  demoNode("driver", 1040, 190, "SimulationDriver", "write → readback", "resource"),
];

const eventFlowEdges: Edge[] = [
  demoEdge("button-handler", "button", "handler", "onClick"),
  demoEdge("handler-script", "handler", "script", "execute"),
  demoEdge("script-emit", "script", "emit", "emit event"),
  demoEdge("emit-listener", "emit", "listener", "dispatch"),
  demoEdge("script-write", "script", "write", "write tag"),
  demoEdge("write-driver", "write", "driver", "mapped source"),
];

const projectGraphNodes: DemoNode[] = [
  demoNode("layout", 0, 10, "MainLayout", "PageLayout", "ui"),
  demoNode("slot", 250, 10, "PageSlot", "Mount point", "ui"),
  demoNode("page", 500, 10, "Pumps Page", "Application page", "ui"),
  demoNode("repeat", 750, 10, "Repeat Container", "TagsByUdt<Pump>", "ui"),
  demoNode("card", 1000, 10, "PumpCard", "User Component", "ui"),

  demoNode("input", 1000, 170, "pump", "TagRef<Pump>", "resource"),
  demoNode("udt", 750, 170, "Pump", "UDT definition", "resource"),
  demoNode("tags", 500, 170, "Pump1 / Pump2 / Pump3", "UDT instances", "resource"),
  demoNode("runtime", 250, 170, "TagRuntime", "Read / write API", "runtime"),
  demoNode("driver", 0, 170, "SimulationDriver", "Mapped I/O source", "runtime"),

  demoNode("chart", 750, 330, "Trend Chart", "series: pump.rpm", "ui"),
  demoNode("binding", 1000, 330, "Relative binding", "pump.rpm", "script"),
];

const projectGraphEdges: Edge[] = [
  demoEdge("layout-slot", "layout", "slot", "contains"),
  demoEdge("slot-page", "slot", "page", "renders"),
  demoEdge("page-repeat", "page", "repeat", "contains"),
  demoEdge("repeat-card", "repeat", "card", "template"),
  demoEdge("card-input", "card", "input", "public input"),
  demoEdge("input-udt", "input", "udt", "typed as"),
  demoEdge("repeat-tags", "repeat", "tags", "resolves"),
  demoEdge("tags-udt", "tags", "udt", "instance of"),
  demoEdge("tags-runtime", "tags", "runtime", "live state"),
  demoEdge("runtime-driver", "runtime", "driver", "source mapping"),
  demoEdge("card-binding", "card", "binding", "uses"),
  demoEdge("binding-chart", "binding", "chart", "feeds series"),
];

function StaticGraph({
  nodes,
  edges,
}: {
  nodes: DemoNode[];
  edges: Edge[];
}) {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      fitView
      fitViewOptions={{ padding: 0.18, maxZoom: 1.15 }}
      minZoom={0.35}
      maxZoom={1.5}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      deleteKeyCode={null}
      proOptions={{ hideAttribution: false }}
      colorMode="light"
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={18}
        size={1.2}
        color="#d8dbea"
      />
      <Controls showInteractive={false} position="bottom-right" />
    </ReactFlow>
  );
}

function GraphNodeLegend() {
  const items: Array<[string, DemoNodeData["tone"]]> = [
    ["UI", "ui"],
    ["Event", "event"],
    ["Script", "script"],
    ["Runtime", "runtime"],
    ["Resource", "resource"],
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--editor-text-muted)]">
      {items.map(([label, tone]) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--editor-border)] bg-white px-2 py-1"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${toneDotClass(tone)}`} />
          {label}
        </span>
      ))}
    </div>
  );
}

function toneDotClass(tone: DemoNodeData["tone"]) {
  switch (tone) {
    case "ui":
      return "bg-indigo-500";
    case "event":
      return "bg-amber-500";
    case "script":
      return "bg-fuchsia-500";
    case "runtime":
      return "bg-emerald-500";
    default:
      return "bg-slate-500";
  }
}

function GraphCard({
  icon,
  title,
  description,
  nodes,
  edges,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  nodes: DemoNode[];
  edges: Edge[];
}) {
  const renderedNodes = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      label: (
        <div className="px-4 py-3 text-left">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${toneDotClass(node.data.tone)}`} />
            <span className="text-xs font-semibold text-zinc-900">{node.data.title}</span>
          </div>
          <div className="mt-1 pl-4 text-[10px] leading-4 text-zinc-500">
            {node.data.detail}
          </div>
        </div>
      ),
    },
  }));

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--editor-border)] bg-[var(--editor-surface)] shadow-sm">
      <div className="flex items-start justify-between gap-6 border-b border-[var(--editor-border)] px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 rounded-lg border border-[var(--editor-accent-border)] bg-[var(--editor-accent-soft)] p-2 text-[var(--editor-accent)]">
            {icon}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[var(--editor-text)]">{title}</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--editor-text-muted)]">{description}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">
          Static mock
        </span>
      </div>
      <div className="h-[360px] bg-[#f8f9fc]">
        <StaticGraph nodes={renderedNodes} edges={edges} />
      </div>
    </section>
  );
}

export function DependenciesPage() {
  const { projectId } = useParams();

  return (
    <div className="flex h-screen flex-col bg-[var(--editor-app-bg)] text-[var(--editor-text)]">
      <WorkspaceHeader
        active="dependencies"
        projectId={projectId}
        title="Dependencies"
        subtitle="Static React Flow exploration"
      />

      <main className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto max-w-[1500px] space-y-5 px-6 py-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--editor-accent)]">
                <Network size={14} />
                Project visualization lab
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">Dependency graphs</h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--editor-text-muted)]">
                Two hard-coded examples for evaluating React Flow inside SCADAtomic. Nothing here reads project state, executes scripts, subscribes to tags, or emits runtime events yet.
              </p>
            </div>
            <GraphNodeLegend />
          </div>

          <GraphCard
            icon={<MousePointerClick size={17} />}
            title="Event execution flow"
            description="Example of an onClick event reaching its handler and script, then branching into an emitted runtime event and a PLC-like tag write path."
            nodes={eventFlowNodes}
            edges={eventFlowEdges}
          />

          <GraphCard
            icon={<Workflow size={17} />}
            title="Project dependency graph"
            description="Example relationships between PageLayout, Page, Repeat Container, User Component, TagRef, UDT, TagRuntime, driver and a chart binding."
            nodes={projectGraphNodes}
            edges={projectGraphEdges}
          />

          <div className="flex items-center gap-2 rounded-xl border border-dashed border-[var(--editor-border-strong)] bg-white/60 px-4 py-3 text-xs text-[var(--editor-text-muted)]">
            <Braces size={15} className="text-[var(--editor-accent)]" />
            Next step, deliberately not implemented here: generate nodes and edges from the real UiDocument / script metadata.
          </div>
        </div>
      </main>
    </div>
  );
}
