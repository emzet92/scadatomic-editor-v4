import {
  Braces,
  Boxes,
  ChevronRight,
  Code2,
  Palette,
  Plus,
  Star,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import {
  validateComponentMethodName,
  validateDefinitionMethodName,
} from "../../component-api";
import type {
  UiComponentDefinition,
  UiDocument,
  UiNode,
} from "../../core/document";
import { getComponentDefinition } from "../../registry/component-definitions";

type HandlerTreeProps = {
  document: UiDocument | null;
  currentScriptId: string;
  onSelect: (scriptId: string) => void;
  onAddMethod: (nodeId: string, methodName: string) => Promise<string>;
  onRemoveMethod: (nodeId: string, methodName: string) => Promise<void>;
  onAddDefinitionMethod: (
    componentId: string,
    methodName: string,
    visibility: "public" | "private"
  ) => Promise<string>;
  onRemoveDefinitionMethod: (
    componentId: string,
    methodName: string
  ) => Promise<void>;
};

export function HandlerTree({
  document,
  currentScriptId,
  onSelect,
  onAddMethod,
  onRemoveMethod,
  onAddDefinitionMethod,
  onRemoveDefinitionMethod,
}: HandlerTreeProps) {
  const apiEntryCount = useMemo(
    () => (document ? countApiEntries(document) : 0),
    [document]
  );

  return (
    <aside className="w-80 shrink-0 border-r border-zinc-200 bg-white overflow-y-auto">
      <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Component API
            </div>
            <div className="mt-1 text-xs text-zinc-400">
              Events, methods and visual variants
            </div>
          </div>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
            {apiEntryCount}
          </span>
        </div>
      </div>

      <div className="p-2">
        {!document ? (
          <div className="px-2 py-3 text-sm text-zinc-400">Loading API…</div>
        ) : (
          <>
            {Object.keys(document.components ?? {}).length > 0 ? (
              <ComponentDefinitionsSection
                definitions={Object.values(document.components ?? {})}
                currentScriptId={currentScriptId}
                onSelect={onSelect}
                onAddMethod={onAddDefinitionMethod}
                onRemoveMethod={onRemoveDefinitionMethod}
              />
            ) : null}

            <HandlerNode
              document={document}
              nodeId={document.rootId}
              currentScriptId={currentScriptId}
              onSelect={onSelect}
              onAddMethod={onAddMethod}
              onRemoveMethod={onRemoveMethod}
              depth={0}
            />
          </>
        )}
      </div>
    </aside>
  );
}


function ComponentDefinitionsSection({
  definitions,
  currentScriptId,
  onSelect,
  onAddMethod,
  onRemoveMethod,
}: {
  definitions: UiComponentDefinition[];
  currentScriptId: string;
  onSelect: (scriptId: string) => void;
  onAddMethod: (
    componentId: string,
    methodName: string,
    visibility: "public" | "private"
  ) => Promise<string>;
  onRemoveMethod: (componentId: string, methodName: string) => Promise<void>;
}) {
  return (
    <details open className="mb-2 rounded-lg border border-violet-100 bg-violet-50/30">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-2.5 py-2 text-xs font-semibold uppercase tracking-wide text-violet-700">
        <ChevronRight
          size={12}
          className="text-violet-400 transition-transform group-open:rotate-90"
        />
        <Boxes size={13} />
        <span className="flex-1">Reusable components</span>
        <span className="rounded bg-white/80 px-1.5 py-0.5 text-[10px] text-violet-500">
          {definitions.length}
        </span>
      </summary>

      <div className="pb-1">
        {definitions
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((definition) => (
            <ComponentDefinitionRow
              key={definition.id}
              definition={definition}
              currentScriptId={currentScriptId}
              onSelect={onSelect}
              onAddMethod={onAddMethod}
              onRemoveMethod={onRemoveMethod}
            />
          ))}
      </div>
    </details>
  );
}

function ComponentDefinitionRow({
  definition,
  currentScriptId,
  onSelect,
  onAddMethod,
  onRemoveMethod,
}: {
  definition: UiComponentDefinition;
  currentScriptId: string;
  onSelect: (scriptId: string) => void;
  onAddMethod: (
    componentId: string,
    methodName: string,
    visibility: "public" | "private"
  ) => Promise<string>;
  onRemoveMethod: (componentId: string, methodName: string) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const methods = Object.entries(definition.methods ?? {});

  async function addMethod() {
    const validation = validateDefinitionMethodName(definition, draft);
    if (!validation.ok) {
      setError("error" in validation ? validation.error : "Invalid method name.");
      return;
    }
    setSaving(true);
    try {
      const scriptId = await onAddMethod(
        definition.id,
        validation.name,
        visibility
      );
      setDraft("");
      setAdding(false);
      setError(null);
      onSelect(scriptId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to add method.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <details open className="group/definition border-t border-violet-100/70 first:border-t-0">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 px-2.5 py-1.5 text-sm text-zinc-700 hover:bg-violet-50/70">
        <ChevronRight
          size={12}
          className="text-zinc-400 transition-transform group-open/definition:rotate-90"
        />
        <span className="min-w-0 flex-1 truncate font-medium">{definition.name}</span>
        <span className="text-[9px] uppercase tracking-wide text-violet-500">definition</span>
        <AddButton
          title={`Add method to ${definition.name}`}
          onClick={() => {
            setAdding(true);
            setDraft("");
            setError(null);
          }}
        />
      </summary>

      <div className="pb-1">
        {methods.map(([methodName, method]) => (
          <div key={methodName} className="group/method flex items-center pr-1" style={{ marginLeft: 28 }}>
            <button
              type="button"
              onClick={() => onSelect(method.scriptId)}
              className={`flex min-w-0 flex-1 items-start gap-2 rounded-md px-2 py-1.5 text-left ${
                currentScriptId === method.scriptId
                  ? "bg-violet-100 text-violet-800"
                  : "text-zinc-600 hover:bg-violet-50"
              }`}
            >
              <Code2 size={12} className="mt-0.5 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-mono text-xs font-medium">
                  {methodName}()
                </span>
                <span className="block text-[9px] uppercase tracking-wide opacity-55">
                  {method.visibility}
                </span>
              </span>
            </button>
            <RemoveButton
              label={`Remove ${methodName}`}
              onRemove={() => void onRemoveMethod(definition.id, methodName)}
            />
          </div>
        ))}

        {adding ? (
          <div className="mx-2 ml-7 rounded-md border border-violet-200 bg-white p-2">
            <div className="mb-2 inline-flex rounded border border-zinc-200 bg-zinc-50 p-0.5 text-[10px]">
              {(["public", "private"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setVisibility(value)}
                  className={`rounded px-2 py-1 font-medium capitalize ${
                    visibility === value
                      ? "bg-white text-violet-700 shadow-sm"
                      : "text-zinc-400"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input
                autoFocus
                value={draft}
                disabled={saving}
                placeholder="start"
                onChange={(event) => {
                  setDraft(event.target.value);
                  setError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void addMethod();
                  if (event.key === "Escape") setAdding(false);
                }}
                className="h-7 min-w-0 flex-1 rounded border border-zinc-200 px-2 font-mono text-xs outline-none focus:border-violet-400"
              />
              <button
                type="button"
                disabled={saving}
                onClick={() => void addMethod()}
                className="rounded bg-violet-600 px-2 text-[10px] font-semibold text-white"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="flex size-7 items-center justify-center rounded text-zinc-400 hover:bg-zinc-100"
              >
                <X size={12} />
              </button>
            </div>
            {error ? <div className="mt-1 text-[10px] text-red-600">{error}</div> : null}
          </div>
        ) : null}
      </div>
    </details>
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
  const [methodDraft, setMethodDraft] = useState("");
  const [methodError, setMethodError] = useState<string | null>(null);
  const [savingMethod, setSavingMethod] = useState(false);

  if (!node) {
    return null;
  }
  const currentNode = node;

  const eventEntries = Object.entries(currentNode.events ?? {});
  const reusableDefinition = currentNode.componentDefinitionId
    ? document.components?.[currentNode.componentDefinitionId]
    : undefined;
  const methodEntries = Object.entries(currentNode.methods ?? {});
  const publicDefinitionMethods = Object.entries(reusableDefinition?.methods ?? {}).filter(
    ([, method]) => method.visibility === "public"
  );
  const variantEntries = Object.entries(currentNode.variants ?? {});
  const childIds = currentNode.children ?? [];

  async function addMethod() {
    const validation = validateComponentMethodName(currentNode, methodDraft);
    if (!validation.ok) {
      setMethodError(
        "error" in validation ? validation.error : "Invalid method name."
      );
      return;
    }

    setSavingMethod(true);
    try {
      const scriptId = await onAddMethod(currentNode.id, validation.name);
      setMethodDraft("");
      setMethodError(null);
      setAddingMethod(false);
      onSelect(scriptId);
    } catch (error) {
      setMethodError(
        error instanceof Error ? error.message : "Failed to add method."
      );
    } finally {
      setSavingMethod(false);
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
          <span className="min-w-0 flex-1 truncate font-medium">{currentNode.name}</span>
          <span className="shrink-0 text-[10px] uppercase tracking-wide text-zinc-400">
            {reusableDefinition?.name ?? currentNode.type}
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
                  label={getEventLabel(currentNode, eventName)}
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
            count={reusableDefinition ? publicDefinitionMethods.length : methodEntries.length}
            action={
              !reusableDefinition && !addingMethod ? (
                <AddButton
                  title={`Add method to ${currentNode.name}`}
                  onClick={() => {
                    setAddingMethod(true);
                    setMethodDraft("");
                    setMethodError(null);
                  }}
                />
              ) : null
            }
          >
            {reusableDefinition
              ? publicDefinitionMethods.map(([methodName]) => (
                  <div
                    key={`definition-method:${node.id}:${methodName}`}
                    className="py-1.5 pr-2 font-mono text-xs text-violet-700"
                    style={{ paddingLeft: `${44 + depth * 12}px` }}
                    title={`Defined by ${reusableDefinition.name}`}
                  >
                    {methodName}()
                    <span className="ml-2 font-sans text-[9px] uppercase tracking-wide text-violet-400">
                      public
                    </span>
                  </div>
                ))
              : methodEntries.map(([methodName, method]) => (
              <MethodButton
                key={`method:${node.id}:${methodName}`}
                active={method.scriptId === currentScriptId}
                depth={depth}
                label={`${methodName}()`}
                scriptId={method.scriptId}
                onSelect={onSelect}
                onRemove={() => void onRemoveMethod(currentNode.id, methodName)}
              />
            ))}

            {!reusableDefinition && addingMethod ? (
              <InlineAddForm
                depth={depth}
                value={methodDraft}
                placeholder="enable"
                suffix="()"
                saving={savingMethod}
                error={methodError}
                hint={`ctx.ui.${currentNode.name}.${methodDraft || "method"}()`}
                onChange={(value) => {
                  setMethodDraft(value);
                  setMethodError(null);
                }}
                onSubmit={() => void addMethod()}
                onCancel={() => {
                  setAddingMethod(false);
                  setMethodError(null);
                }}
              />
            ) : null}
          </TreeSection>

          <TreeSection
            depth={depth}
            icon={<Palette size={12} />}
            label="Variants"
            count={variantEntries.length}
          >
            {variantEntries.map(([variantName]) => (
              <VariantApiRow
                key={`variant:${node.id}:${variantName}`}
                depth={depth}
                label={variantName}
                isDefault={node.defaultVariant === variantName}
                apiPath={`ctx.ui.${currentNode.name}.variant.${variantName}()`}
              />
            ))}
            {variantEntries.length === 0 ? (
              <div
                className="py-1.5 pr-2 text-[10px] text-zinc-400"
                style={{ paddingLeft: `${44 + depth * 12}px` }}
              >
                Define variants in the Designer property panel.
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

function AddButton({ title, onClick }: { title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      className="flex size-6 items-center justify-center rounded text-zinc-400 transition hover:bg-sky-50 hover:text-sky-700"
      title={title}
      aria-label={title}
    >
      <Plus size={13} />
    </button>
  );
}

function InlineAddForm({
  depth,
  value,
  placeholder,
  suffix,
  saving,
  error,
  hint,
  onChange,
  onSubmit,
  onCancel,
}: {
  depth: number;
  value: string;
  placeholder: string;
  suffix: string;
  saving: boolean;
  error: string | null;
  hint: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="mr-2 rounded-md border border-sky-200 bg-sky-50/50 p-2"
      style={{ marginLeft: `${44 + depth * 12}px` }}
    >
      <div className="flex items-center gap-1.5">
        <div className="relative min-w-0 flex-1">
          <input
            autoFocus
            value={value}
            disabled={saving}
            placeholder={placeholder}
            spellCheck={false}
            autoComplete="off"
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onSubmit();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                onCancel();
              }
            }}
            className={`h-7 w-full rounded border bg-white px-2 pr-6 font-mono text-xs outline-none focus:ring-2 focus:ring-sky-500/15 ${
              error ? "border-red-400" : "border-zinc-200 focus:border-sky-500"
            }`}
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[11px] text-zinc-400">
            {suffix}
          </span>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={onSubmit}
          className="h-7 rounded bg-sky-600 px-2 text-[10px] font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
        >
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex size-7 items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          aria-label="Cancel"
        >
          <X size={12} />
        </button>
      </div>
      {error ? (
        <div className="mt-1 text-[10px] leading-4 text-red-600">{error}</div>
      ) : (
        <div className="mt-1 truncate font-mono text-[9px] text-zinc-400">
          {hint}
        </div>
      )}
    </div>
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
      <RemoveButton label={`Remove ${label}`} onRemove={onRemove} />
    </div>
  );
}

function VariantApiRow({
  depth,
  label,
  isDefault,
  apiPath,
}: {
  depth: number;
  label: string;
  isDefault: boolean;
  apiPath: string;
}) {
  return (
    <div
      className="flex items-start gap-2 rounded-md py-1.5 pr-2 text-zinc-600"
      style={{ paddingLeft: `${44 + depth * 12}px` }}
      title={apiPath}
    >
      <Palette size={12} className="mt-0.5 shrink-0 text-violet-500" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 truncate font-mono text-xs font-medium">
          {label}()
          {isDefault ? (
            <span
              className="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1 py-0.5 font-sans text-[9px] font-semibold uppercase tracking-wide text-amber-700"
              title="Default variant"
            >
              <Star size={8} fill="currentColor" /> default
            </span>
          ) : null}
        </span>
        <span className="block truncate text-[10px] opacity-55">{apiPath}</span>
      </span>
    </div>
  );
}

function RemoveButton({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="flex size-6 shrink-0 items-center justify-center rounded text-zinc-300 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover/method:opacity-100 group-hover/variant:opacity-100"
      title={label}
      aria-label={label}
    >
      <Trash2 size={11} />
    </button>
  );
}

function getEventLabel(node: UiNode, eventName: string) {
  return getComponentDefinition(node.type)?.events?.[eventName]?.label ?? eventName;
}

function countApiEntries(document: UiDocument) {
  const nodeEntries = Object.values(document.nodes).reduce(
    (total, node) =>
      total +
      Object.keys(node.events ?? {}).length +
      Object.keys(node.methods ?? {}).length +
      Object.keys(node.variants ?? {}).length,
    0
  );
  const definitionEntries = Object.values(document.components ?? {}).reduce(
    (total, definition) => total + Object.keys(definition.methods ?? {}).length,
    0
  );
  return nodeEntries + definitionEntries;
}
