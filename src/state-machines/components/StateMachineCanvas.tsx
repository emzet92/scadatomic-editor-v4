import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { useMemo } from "react";
import type { StateMachineDefinition, StateDefinition, TransitionDefinition } from "../domain/state-machine-definition";

export type MachineSelection =
  | { kind: "state"; id: string }
  | { kind: "transition"; id: string }
  | null;

type StateNodeData = {
  state: StateDefinition;
  initial: boolean;
  active: boolean;
  selected: boolean;
};
type StateNode = Node<StateNodeData, "machine-state">;

export function StateMachineCanvas({
  definition,
  selection,
  activeStateId,
  lastTransitionId,
  onSelectionChange,
  onMoveState,
  onCreateTransition,
}: {
  definition: StateMachineDefinition;
  selection: MachineSelection;
  activeStateId?: string | undefined;
  lastTransitionId?: string | null | undefined;
  onSelectionChange: (selection: MachineSelection) => void;
  onMoveState: (stateId: string, position: { x: number; y: number }) => void;
  onCreateTransition: (from: string, to: string) => void;
}) {
  const nodes = useMemo<StateNode[]>(() => Object.values(definition.states).map((state) => ({
    id: state.id,
    type: "machine-state",
    position: state.position,
    data: {
      state,
      initial: definition.initialStateId === state.id,
      active: activeStateId === state.id,
      selected: selection?.kind === "state" && selection.id === state.id,
    },
  })), [definition.states, definition.initialStateId, activeStateId, selection]);

  const edges = useMemo<Edge[]>(() => definition.transitions.map((transition) => ({
    id: transition.id,
    source: transition.from,
    target: transition.to,
    type: "smoothstep",
    animated: lastTransitionId === transition.id,
    label: transitionLabel(transition),
    markerEnd: { type: MarkerType.ArrowClosed, width: 17, height: 17 },
    style: {
      strokeWidth: selection?.kind === "transition" && selection.id === transition.id ? 2.5 : 1.6,
      stroke: lastTransitionId === transition.id ? "#7c3aed" : "#7c83a7",
    },
    labelStyle: { fill: "#52525b", fontSize: 10, fontWeight: 650 },
    labelBgStyle: { fill: "#fff", fillOpacity: 0.96 },
    labelBgPadding: [6, 4],
    labelBgBorderRadius: 6,
  })), [definition.transitions, lastTransitionId, selection]);

  function connect(connection: Connection) {
    if (!connection.source || !connection.target || connection.source === connection.target) return;
    onCreateTransition(connection.source, connection.target);
  }

  return (
    <div className="h-full min-h-[640px] overflow-hidden bg-[#f7f8fc]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={{ "machine-state": StateNodeView }}
        connectionMode={ConnectionMode.Loose}
        onConnect={connect}
        onNodeClick={(_event, node) => onSelectionChange({ kind: "state", id: node.id })}
        onEdgeClick={(_event, edge) => onSelectionChange({ kind: "transition", id: edge.id })}
        onPaneClick={() => onSelectionChange(null)}
        onNodeDragStop={(_event, node) => onMoveState(node.id, node.position)}
        fitView
        fitViewOptions={{ padding: 0.22, maxZoom: 1.05 }}
        minZoom={0.2}
        maxZoom={1.6}
        snapToGrid
        snapGrid={[20, 20]}
        deleteKeyCode={null}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="#d5d8e8" />
        <Controls position="bottom-right" />
      </ReactFlow>
    </div>
  );
}

function StateNodeView({ data }: NodeProps<StateNode>) {
  const { state, initial, active, selected } = data;
  return (
    <div
      className={`min-w-[190px] overflow-hidden rounded-2xl border bg-white shadow-[0_10px_30px_rgba(15,23,42,.08)] transition ${
        active ? "border-violet-500 ring-4 ring-violet-100" : selected ? "border-indigo-400 ring-2 ring-indigo-100" : "border-zinc-200"
      }`}
    >
      <Handle type="target" position={Position.Left} className="!size-3 !border-2 !border-white !bg-indigo-500" />
      <div className={`px-4 py-2.5 text-white ${active ? "bg-violet-600" : "bg-indigo-600"}`}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[.16em]">State</span>
          {initial ? <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-semibold">INITIAL</span> : null}
        </div>
        <div className="mt-1 text-sm font-bold">{state.name}</div>
      </div>
      <div className="space-y-2 px-4 py-3 text-[10px] text-zinc-500">
        <BlockMini label="when enter" count={state.onEnter.length} tone="emerald" />
        <BlockMini label="when exit" count={state.onExit.length} tone="amber" />
      </div>
      <Handle type="source" position={Position.Right} className="!size-3 !border-2 !border-white !bg-indigo-500" />
    </div>
  );
}

function BlockMini({ label, count, tone }: { label: string; count: number; tone: "emerald" | "amber" }) {
  return (
    <div className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 ${tone === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
      <span>{label}</span><strong>{count} action{count === 1 ? "" : "s"}</strong>
    </div>
  );
}

function transitionLabel(transition: TransitionDefinition) {
  if (transition.name) return transition.name;
  if (transition.trigger.kind === "event") return `when ${transition.trigger.event}`;
  if (transition.trigger.kind === "after") return `after ${transition.trigger.delayMs}ms`;
  return transition.guard ? "when condition" : "always";
}
