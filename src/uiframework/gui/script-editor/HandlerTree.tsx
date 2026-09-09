import {
  ChevronRight,
  Code2,
  Plus,
  Trash2,
  X,
  Zap,
  Braces,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import {
  validateComponentMethodName,
} from "../../component-api";
import type { UiDocument, UiNode } from "../../core/document";
import { getComponentDefinition } from "../../registry/component-definitions";

type HandlerTreeProps = {
  document: UiDocument | null;
  currentScriptId: string;
  onSelect: (scriptId: string) => void;
  onAddMethod: (nodeId: string, methodName: string) => Promise<string>;
  onRemoveMethod: (nodeId: string, methodName: string) => Promise<void>;
};

export function HandlerTree({
  document,
  currentScriptId,
  onSelect,
  onAddMethod,
  onRemoveMethod,
}: HandlerTreeProps) {
  const scriptCount = useMemo(
    () => (document ? countScripts(document) : 0),
    [document]
  );

  return (
    <aside className="w-80 shrink-0 border-r border-zinc-200 bg-white overflow-y-auto">
      <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Component Scripts
            </div>
            <div className="mt-1 text-xs text-zinc-400">
              Events and public component API
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
        ) : (
          <HandlerNode
            document={document}
            nodeId={document.rootId}
            currentScriptId={currentScriptId}
            onSelect={onSelect}
            onAddMethod={onAddMethod}
            onRemoveMethod={onRemoveMethod}
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
  onAddMethod: (nodeId: string, methodName: string) => Promise<string>;
  onRemoveMethod: (nodeId: string, methodName: string) => Promise<void>;
  depth: number;
};

function HandlerNode({
  document,
  nodeId,
  currentScriptId,
  onSelect,
  onAddMethod,
  onRemoveMethod,
  depth,
}: HandlerNodeProps) {
  const node = document.nodes[nodeId];
  const [addingMethod, setAddingMethod] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!node) {
    return null;
  }

  const eventEntries = Object.entries(node.events ?? {});
  const methodEntries = Object.entries(node.methods ?? {});
  const childIds = node.children ?? [];

  async function addMethod() {
    const validation = validateComponentMethodName(node, draftName);
    if (!validation.ok) {
      setFormError(validation.error);
      return;
    }

    setSaving(true);
    try {
      const scriptId = await onAddMethod(node.id, validation.name);
      setDraftName("");
      setFormError(null);
      setAddingMethod(false);
      onSelect(scriptId);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to add method.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <details open className="group/component">
        <summary
          className="flex cursor-pointer list-none items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
          style={{ paddingLeft: `${8 + depth * 12}px` }}
        >
          <ChevronRight
            size={13}
            className="shrink-0 text-zinc-400 transition-transform group-open/component:rotate-90"
          />
          <span className="min-w-0 flex-1 truncate font-medium">{node.name}</span>
          <span className="shrink-0 text-[10px] uppercase tracking-wide text-zinc-400">
            {node.type}
          </span>
        </summary>

        <div>
          {eventEntries.length > 0 ? (
            <TreeSection
              depth={depth}
              icon={<Zap size={12} />}
              label="Events"
              count={eventEntries.length}
            >
              {eventEntries.map(([eventName, handler]) => (
                <ScriptButton
                  key={`event:${node.id}:${eventName}`}
                  active={handler.handlerId === currentScriptId}
                  depth={depth}
                  label={getEventLabel(node, eventName)}
                  scriptId={handler.handlerId}
                  onSelect={onSelect}
                />
              ))}
            </TreeSection>
          ) : null}

          <TreeSection
            depth={depth}
            icon={<Braces size={12} />}
            label="Methods"
            count={methodEntries.length}
            action={
              !addingMethod ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setAddingMethod(true);
                    setDraftName("");
                    setFormError(null);
                  }}
                  className="flex size-6 items-center justify-center rounded text-zinc-400 transition hover:bg-sky-50 hover:text-sky-700"
                  title={`Add method to ${node.name}`}
                  aria-label={`Add method to ${node.name}`}
                >
                  <Plus size={13} />
                </button>
              ) : null
            }
          >
            {methodEntries.map(([methodName, method]) => (
              <MethodButton
                key={`method:${node.id}:${methodName}`}
                active={method.scriptId === currentScriptId}
                depth={depth}
                label={`${methodName}()`}
                scriptId={method.scriptId}
                onSelect={onSelect}
                onRemove={() => void onRemoveMethod(node.id, methodName)}
              />
            ))}

            {addingMethod ? (
              <div
                className="mr-2 rounded-md border border-sky-200 bg-sky-50/50 p-2"
                style={{ marginLeft: `${44 + depth * 12}px` }}
              >
                <div className="flex items-center gap-1.5">
                  <div className="relative min-w-0 flex-1">
                    <input
                      autoFocus
                      value={draftName}
                      disabled={saving}
                      placeholder="enable"
                      spellCheck={false}
                      autoComplete="off"
                      onChange={(event) => {
                        setDraftName(event.target.value);
                        setFormError(null);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void addMethod();
                        }
                        if (event.key === "Escape") {
                          event.preventDefault();
                          setAddingMethod(false);
                          setFormError(null);
                        }
                      }}
                      className={`h-7 w-full rounded border bg-white px-2 pr-6 font-mono text-xs outline-none focus:ring-2 focus:ring-sky-500/15 ${
                        formError ? "border-red-400" : "border-zinc-200 focus:border-sky-500"
                      }`}
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[11px] text-zinc-400">
                      ()
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void addMethod()}
                    className="h-7 rounded bg-sky-600 px-2 text-[10px] font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingMethod(false);
                      setFormError(null);
                    }}
                    className="flex size-7 items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                    aria-label="Cancel adding method"
                  >
                    <X size={12} />
                  </button>
                </div>
                {formError ? (
                  <div className="mt-1 text-[10px] leading-4 text-red-600">{formError}</div>
                ) : (
                  <div className="mt-1 truncate font-mono text-[9px] text-zinc-400">
                    ctx.ui.{node.name}.{draftName || "method"}()
                  </div>
                )}
              </div>
            ) : null}
          </TreeSection>

          {childIds.map((childId) => (
            <HandlerNode
              key={childId}
              document={document}
              nodeId={childId}
              currentScriptId={currentScriptId}
              onSelect={onSelect}
              onAddMethod={onAddMethod}
              onRemoveMethod={onRemoveMethod}
              depth={depth + 1}
            />
          ))}
        </div>
      </details>
    </div>
  );
}

function TreeSection({
  depth,
  icon,
  label,
  count,
  action,
  children,
}: {
  depth: number;
  icon: ReactNode;
  label: string;
  count: number;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <details open className="group/section">
      <summary
        className="flex cursor-pointer list-none items-center gap-1.5 rounded-md py-1 pr-2 text-[11px] font-medium text-zinc-500 hover:bg-zinc-50"
        style={{ paddingLeft: `${26 + depth * 12}px` }}
      >
        <ChevronRight
          size={11}
          className="shrink-0 text-zinc-300 transition-transform group-open/section:rotate-90"
        />
        <span className="text-zinc-400">{icon}</span>
        <span className="min-w-0 flex-1">{label}</span>
        <span className="text-[10px] tabular-nums text-zinc-300">{count}</span>
        {action}
      </summary>
      <div>{children}</div>
    </details>
  );
}

function ScriptButton({
  active,
  depth,
  label,
  scriptId,
  onSelect,
}: {
  active: boolean;
  depth: number;
  label: string;
  scriptId: string;
  onSelect: (scriptId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(scriptId)}
      className={`flex w-full items-start gap-2 rounded-md py-1.5 pr-2 text-left transition ${
        active
          ? "bg-sky-50 text-sky-700"
          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
      }`}
      style={{ paddingLeft: `${44 + depth * 12}px` }}
      title={scriptId}
    >
      <Code2 size={12} className="mt-0.5 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium">{label}</span>
        <span className="block truncate text-[10px] opacity-55">{scriptId}</span>
      </span>
    </button>
  );
}

function MethodButton({
  active,
  depth,
  label,
  scriptId,
  onSelect,
  onRemove,
}: {
  active: boolean;
  depth: number;
  label: string;
  scriptId: string;
  onSelect: (scriptId: string) => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={`group/method flex items-center rounded-md pr-1 transition ${
        active ? "bg-sky-50 text-sky-700" : "text-zinc-600 hover:bg-zinc-50"
      }`}
      style={{ marginLeft: `${36 + depth * 12}px` }}
    >
      <button
        type="button"
        onClick={() => onSelect(scriptId)}
        className="flex min-w-0 flex-1 items-start gap-2 py-1.5 pl-2 text-left"
        title={scriptId}
      >
        <Code2 size={12} className="mt-0.5 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-mono text-xs font-medium">{label}</span>
          <span className="block truncate text-[10px] opacity-55">{scriptId}</span>
        </span>
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="flex size-6 shrink-0 items-center justify-center rounded text-zinc-300 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover/method:opacity-100"
        title="Remove method"
        aria-label={`Remove ${label}`}
      >
        <Trash2 size={11} />
      </button>
    </div>
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
