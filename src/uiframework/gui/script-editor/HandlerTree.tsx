import {
  Braces,
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
import { validateComponentMethodName } from "../../component-api";
import { validateComponentVariantName } from "../../component-variants";
import type { UiDocument, UiNode } from "../../core/document";
import { getComponentDefinition } from "../../registry/component-definitions";

export type SelectedVariant = {
  nodeId: string;
  variantName: string;
};

type HandlerTreeProps = {
  document: UiDocument | null;
  currentScriptId: string;
  selectedVariant: SelectedVariant | null;
  onSelect: (scriptId: string) => void;
  onSelectVariant: (nodeId: string, variantName: string) => void;
  onAddMethod: (nodeId: string, methodName: string) => Promise<string>;
  onRemoveMethod: (nodeId: string, methodName: string) => Promise<void>;
  onAddVariant: (nodeId: string, variantName: string) => Promise<void>;
  onRemoveVariant: (nodeId: string, variantName: string) => Promise<void>;
};

export function HandlerTree({
  document,
  currentScriptId,
  selectedVariant,
  onSelect,
  onSelectVariant,
  onAddMethod,
  onRemoveMethod,
  onAddVariant,
  onRemoveVariant,
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
          <HandlerNode
            document={document}
            nodeId={document.rootId}
            currentScriptId={currentScriptId}
            selectedVariant={selectedVariant}
            onSelect={onSelect}
            onSelectVariant={onSelectVariant}
            onAddMethod={onAddMethod}
            onRemoveMethod={onRemoveMethod}
            onAddVariant={onAddVariant}
            onRemoveVariant={onRemoveVariant}
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
  selectedVariant: SelectedVariant | null;
  onSelect: (scriptId: string) => void;
  onSelectVariant: (nodeId: string, variantName: string) => void;
  onAddMethod: (nodeId: string, methodName: string) => Promise<string>;
  onRemoveMethod: (nodeId: string, methodName: string) => Promise<void>;
  onAddVariant: (nodeId: string, variantName: string) => Promise<void>;
  onRemoveVariant: (nodeId: string, variantName: string) => Promise<void>;
  depth: number;
};

function HandlerNode({
  document,
  nodeId,
  currentScriptId,
  selectedVariant,
  onSelect,
  onSelectVariant,
  onAddMethod,
  onRemoveMethod,
  onAddVariant,
  onRemoveVariant,
  depth,
}: HandlerNodeProps) {
  const node = document.nodes[nodeId];
  const [addingMethod, setAddingMethod] = useState(false);
  const [methodDraft, setMethodDraft] = useState("");
  const [methodError, setMethodError] = useState<string | null>(null);
  const [savingMethod, setSavingMethod] = useState(false);
  const [addingVariant, setAddingVariant] = useState(false);
  const [variantDraft, setVariantDraft] = useState("");
  const [variantError, setVariantError] = useState<string | null>(null);
  const [savingVariant, setSavingVariant] = useState(false);

  if (!node) {
    return null;
  }

  const eventEntries = Object.entries(node.events ?? {});
  const methodEntries = Object.entries(node.methods ?? {});
  const variantEntries = Object.entries(node.variants ?? {});
  const childIds = node.children ?? [];

  async function addMethod() {
    const validation = validateComponentMethodName(node, methodDraft);
    if (!validation.ok) {
      setMethodError(validation.error);
      return;
    }

    setSavingMethod(true);
    try {
      const scriptId = await onAddMethod(node.id, validation.name);
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

  async function addVariant() {
    const validation = validateComponentVariantName(node, variantDraft);
    if (!validation.ok) {
      setVariantError(validation.error);
      return;
    }

    setSavingVariant(true);
    try {
      await onAddVariant(node.id, validation.name);
      setVariantDraft("");
      setVariantError(null);
      setAddingVariant(false);
      onSelectVariant(node.id, validation.name);
    } catch (error) {
      setVariantError(
        error instanceof Error ? error.message : "Failed to add variant."
      );
    } finally {
      setSavingVariant(false);
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
                  active={
                    selectedVariant === null &&
                    handler.handlerId === currentScriptId
                  }
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
                <AddButton
                  title={`Add method to ${node.name}`}
                  onClick={() => {
                    setAddingMethod(true);
                    setMethodDraft("");
                    setMethodError(null);
                  }}
                />
              ) : null
            }
          >
            {methodEntries.map(([methodName, method]) => (
              <MethodButton
                key={`method:${node.id}:${methodName}`}
                active={
                  selectedVariant === null &&
                  method.scriptId === currentScriptId
                }
                depth={depth}
                label={`${methodName}()`}
                scriptId={method.scriptId}
                onSelect={onSelect}
                onRemove={() => void onRemoveMethod(node.id, methodName)}
              />
            ))}

            {addingMethod ? (
              <InlineAddForm
                depth={depth}
                value={methodDraft}
                placeholder="enable"
                suffix="()"
                saving={savingMethod}
                error={methodError}
                hint={`ctx.ui.${node.name}.${methodDraft || "method"}()`}
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
            action={
              !addingVariant ? (
                <AddButton
                  title={`Add variant to ${node.name}`}
                  onClick={() => {
                    setAddingVariant(true);
                    setVariantDraft("");
                    setVariantError(null);
                  }}
                />
              ) : null
            }
          >
            {variantEntries.map(([variantName]) => (
              <VariantButton
                key={`variant:${node.id}:${variantName}`}
                active={
                  selectedVariant?.nodeId === node.id &&
                  selectedVariant.variantName === variantName
                }
                depth={depth}
                label={variantName}
                isDefault={node.defaultVariant === variantName}
                apiPath={`ctx.ui.${node.name}.variant.${variantName}()`}
                onSelect={() => onSelectVariant(node.id, variantName)}
                onRemove={() => void onRemoveVariant(node.id, variantName)}
              />
            ))}

            {addingVariant ? (
              <InlineAddForm
                depth={depth}
                value={variantDraft}
                placeholder="enabled"
                suffix="()"
                saving={savingVariant}
                error={variantError}
                hint={`ctx.ui.${node.name}.variant.${variantDraft || "variant"}()`}
                onChange={(value) => {
                  setVariantDraft(value);
                  setVariantError(null);
                }}
                onSubmit={() => void addVariant()}
                onCancel={() => {
                  setAddingVariant(false);
                  setVariantError(null);
                }}
              />
            ) : null}
          </TreeSection>

          {childIds.map((childId) => (
            <HandlerNode
              key={childId}
              document={document}
              nodeId={childId}
              currentScriptId={currentScriptId}
              selectedVariant={selectedVariant}
              onSelect={onSelect}
              onSelectVariant={onSelectVariant}
              onAddMethod={onAddMethod}
              onRemoveMethod={onRemoveMethod}
              onAddVariant={onAddVariant}
              onRemoveVariant={onRemoveVariant}
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

function VariantButton({
  active,
  depth,
  label,
  isDefault,
  apiPath,
  onSelect,
  onRemove,
}: {
  active: boolean;
  depth: number;
  label: string;
  isDefault: boolean;
  apiPath: string;
  onSelect: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={`group/variant flex items-center rounded-md pr-1 transition ${
        active ? "bg-violet-50 text-violet-700" : "text-zinc-600 hover:bg-zinc-50"
      }`}
      style={{ marginLeft: `${36 + depth * 12}px` }}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-start gap-2 py-1.5 pl-2 text-left"
        title={apiPath}
      >
        <Palette size={12} className="mt-0.5 shrink-0" />
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
      </button>
      <RemoveButton label={`Remove variant ${label}`} onRemove={onRemove} />
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
  return Object.values(document.nodes).reduce(
    (total, node) =>
      total +
      Object.keys(node.events ?? {}).length +
      Object.keys(node.methods ?? {}).length +
      Object.keys(node.variants ?? {}).length,
    0
  );
}
