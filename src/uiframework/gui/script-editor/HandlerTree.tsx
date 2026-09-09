import { ChevronRight, Code2 } from "lucide-react";
import { useMemo } from "react";
import type { UiDocument, UiNode } from "../../core/document";
import { getComponentDefinition } from "../../registry/component-definitions";

type HandlerTreeProps = {
  document: UiDocument | null;
  currentScriptId: string;
  onSelect: (scriptId: string) => void;
};

export function HandlerTree({
  document,
  currentScriptId,
  onSelect,
}: HandlerTreeProps) {
  const scriptCount = useMemo(
    () => (document ? countScripts(document) : 0),
    [document]
  );

  return (
    <aside className="w-72 shrink-0 border-r border-zinc-200 bg-white overflow-y-auto">
      <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Handlers & Methods
            </div>
            <div className="mt-1 text-xs text-zinc-400">
              Project component scripts
            </div>
          </div>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
            {scriptCount}
          </span>
        </div>
      </div>

      <div className="p-2">
        {!document ? (
          <div className="px-2 py-3 text-sm text-zinc-400">Loading scripts…</div>
        ) : scriptCount === 0 ? (
          <div className="px-2 py-3 text-sm text-zinc-400">
            No component scripts yet.
          </div>
        ) : (
          <HandlerNode
            document={document}
            nodeId={document.rootId}
            currentScriptId={currentScriptId}
            onSelect={onSelect}
            depth={0}
          />
        )}
      </div>
    </aside>
  );
}

type HandlerNodeProps = {
  document: UiDocument;
  nodeId: string;
  currentScriptId: string;
  onSelect: (scriptId: string) => void;
  depth: number;
};

function HandlerNode({
  document,
  nodeId,
  currentScriptId,
  onSelect,
  depth,
}: HandlerNodeProps) {
  const node = document.nodes[nodeId];
  if (!node || !subtreeHasScript(document, nodeId, new Set())) {
    return null;
  }

  const eventEntries = Object.entries(node.events ?? {});
  const methodEntries = Object.entries(node.methods ?? {});
  const childIds = (node.children ?? []).filter((childId) =>
    subtreeHasScript(document, childId, new Set())
  );

  return (
    <div>
      <details open className="group">
        <summary
          className="flex cursor-pointer list-none items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
          style={{ paddingLeft: `${8 + depth * 12}px` }}
        >
          <ChevronRight
            size={13}
            className="shrink-0 text-zinc-400 transition-transform group-open:rotate-90"
          />
          <span className="min-w-0 flex-1 truncate font-medium">{node.name}</span>
          <span className="shrink-0 text-[10px] uppercase tracking-wide text-zinc-400">
            {node.type}
          </span>
        </summary>

        <div>
          {eventEntries.map(([eventName, handler]) => (
            <ScriptButton
              key={`event:${node.id}:${eventName}`}
              active={handler.handlerId === currentScriptId}
              depth={depth}
              label={getEventLabel(node, eventName)}
              kind="Event"
              scriptId={handler.handlerId}
              onSelect={onSelect}
            />
          ))}

          {methodEntries.map(([methodName, method]) => (
            <ScriptButton
              key={`method:${node.id}:${methodName}`}
              active={method.scriptId === currentScriptId}
              depth={depth}
              label={`${methodName}()`}
              kind="Method"
              scriptId={method.scriptId}
              onSelect={onSelect}
            />
          ))}

          {childIds.map((childId) => (
            <HandlerNode
              key={childId}
              document={document}
              nodeId={childId}
              currentScriptId={currentScriptId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      </details>
    </div>
  );
}

function ScriptButton({
  active,
  depth,
  label,
  kind,
  scriptId,
  onSelect,
}: {
  active: boolean;
  depth: number;
  label: string;
  kind: "Event" | "Method";
  scriptId: string;
  onSelect: (scriptId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(scriptId)}
      className={`flex w-full items-start gap-2 rounded-md py-2 pr-2 text-left transition ${
        active
          ? "bg-sky-50 text-sky-700"
          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
      }`}
      style={{ paddingLeft: `${28 + depth * 12}px` }}
      title={scriptId}
    >
      <Code2 size={13} className="mt-0.5 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium">{label}</span>
        <span className="block truncate text-[11px] opacity-65">{scriptId}</span>
      </span>
      <span className="mt-0.5 shrink-0 text-[9px] uppercase tracking-wide opacity-50">
        {kind}
      </span>
    </button>
  );
}

function getEventLabel(node: UiNode, eventName: string) {
  return getComponentDefinition(node.type)?.events?.[eventName]?.label ?? eventName;
}

function countScripts(document: UiDocument) {
  return Object.values(document.nodes).reduce(
    (total, node) =>
      total +
      Object.keys(node.events ?? {}).length +
      Object.keys(node.methods ?? {}).length,
    0
  );
}

function subtreeHasScript(
  document: UiDocument,
  nodeId: string,
  visited: Set<string>
): boolean {
  if (visited.has(nodeId)) {
    return false;
  }
  visited.add(nodeId);

  const node = document.nodes[nodeId];
  if (!node) {
    return false;
  }

  if (
    Object.keys(node.events ?? {}).length > 0 ||
    Object.keys(node.methods ?? {}).length > 0
  ) {
    return true;
  }

  return (node.children ?? []).some((childId) =>
    subtreeHasScript(document, childId, visited)
  );
}
