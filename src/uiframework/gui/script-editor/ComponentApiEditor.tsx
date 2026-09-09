import { useState } from "react";
import { Code2, Plus, Trash2, X } from "lucide-react";
import {
  validateComponentMethodName,
  type ComponentApiDescription,
} from "../../component-api";
import type { UiDocument } from "../../core/document";

type Props = {
  document: UiDocument | null;
  components: ComponentApiDescription[];
  error: string | null;
  currentScriptId: string;
  onSelectScript: (scriptId: string) => void;
  onAddMethod: (nodeId: string, methodName: string) => Promise<string>;
  onRemoveMethod: (nodeId: string, methodName: string) => Promise<void>;
};

export function ComponentApiEditor({
  document,
  components,
  error,
  currentScriptId,
  onSelectScript,
  onAddMethod,
  onRemoveMethod,
}: Props) {
  const [addingNodeId, setAddingNodeId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function closeAddForm() {
    setAddingNodeId(null);
    setDraftName("");
    setFormError(null);
  }

  async function addMethod(nodeId: string) {
    const node = document?.nodes[nodeId];
    if (!node) {
      setFormError("Component no longer exists in the document.");
      return;
    }

    const validation = validateComponentMethodName(node, draftName);
    if (!validation.ok) {
      setFormError(validation.error);
      return;
    }

    setSaving(true);
    try {
      const scriptId = await onAddMethod(nodeId, validation.name);
      closeAddForm();
      onSelectScript(scriptId);
    } catch (addError) {
      setFormError(
        addError instanceof Error ? addError.message : "Failed to add method."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-4 py-3.5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Component API
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Define the public API exposed through <code>ctx.ui.ComponentName</code>.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500">
          {components.length} components
        </span>
      </div>

      {error ? (
        <div className="m-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : components.length === 0 ? (
        <div className="p-4 text-sm text-zinc-400">Loading component API…</div>
      ) : (
        <div className="grid gap-3 p-4 xl:grid-cols-2">
          {components.map((component) => {
            const adding = addingNodeId === component.nodeId;

            return (
              <article
                key={component.nodeId}
                className="min-w-0 rounded-lg border border-zinc-200 bg-zinc-50/60"
              >
                <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-3 py-2.5">
                  <div className="min-w-0">
                    <code className="block truncate text-sm font-semibold text-zinc-900">
                      ctx.ui.{component.name}
                    </code>
                    <div className="mt-0.5 text-[11px] text-zinc-400">
                      {component.type}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAddingNodeId(component.nodeId);
                      setDraftName("");
                      setFormError(null);
                    }}
                    className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 transition hover:border-sky-300 hover:text-sky-700"
                  >
                    <Plus size={13} />
                    Method
                  </button>
                </div>

                <div className="p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                    Props · read / write
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {component.properties.map((property) => (
                      <code
                        key={property.name}
                        className="rounded border border-zinc-200 bg-white px-1.5 py-1 text-xs text-zinc-700"
                        title={`ctx.ui.${component.name}.${property.name}`}
                      >
                        .{property.name}
                        <span className="ml-1 text-zinc-400">
                          :{property.valueType}
                        </span>
                      </code>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                      Methods
                    </div>
                    <span className="text-[10px] tabular-nums text-zinc-400">
                      {component.methods.length}
                    </span>
                  </div>

                  {adding ? (
                    <div className="mt-2 rounded-lg border border-sky-200 bg-white p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-medium text-zinc-800">
                          New public method
                        </div>
                        <button
                          type="button"
                          aria-label="Cancel adding method"
                          onClick={closeAddForm}
                          className="flex size-6 items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                        >
                          <X size={13} />
                        </button>
                      </div>

                      <div className="mt-2 flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="relative">
                            <input
                              autoFocus
                              value={draftName}
                              placeholder="enable"
                              spellCheck={false}
                              autoComplete="off"
                              disabled={saving}
                              onChange={(event) => {
                                setDraftName(event.target.value);
                                setFormError(null);
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  void addMethod(component.nodeId);
                                }

                                if (event.key === "Escape") {
                                  event.preventDefault();
                                  closeAddForm();
                                }
                              }}
                              className={`h-8 w-full rounded-md border bg-white px-2.5 pr-7 font-mono text-xs text-zinc-800 outline-none transition focus:ring-2 focus:ring-sky-500/15 ${
                                formError
                                  ? "border-red-400 focus:border-red-500"
                                  : "border-zinc-200 focus:border-sky-500"
                              }`}
                            />
                            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-mono text-xs text-zinc-400">
                              ()
                            </span>
                          </div>

                          {formError ? (
                            <div className="mt-1 text-[11px] leading-4 text-red-600">
                              {formError}
                            </div>
                          ) : (
                            <div className="mt-1 truncate text-[10px] text-zinc-400">
                              ctx.ui.{component.name}.{draftName || "method"}()
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void addMethod(component.nodeId)}
                          className="h-8 shrink-0 rounded-md bg-sky-600 px-2.5 text-[11px] font-semibold text-white transition hover:bg-sky-500 disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {component.methods.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {component.methods.map((method) => {
                        const active = currentScriptId === method.scriptId;

                        return (
                          <div
                            key={method.name}
                            className={`group flex min-h-9 items-center gap-2 rounded-md border px-2 py-1.5 transition ${
                              active
                                ? "border-sky-200 bg-sky-50"
                                : "border-transparent hover:border-zinc-200 hover:bg-white"
                            }`}
                          >
                            <span
                              className={`flex size-6 shrink-0 items-center justify-center rounded ${
                                active
                                  ? "bg-sky-100 text-sky-700"
                                  : "bg-white text-zinc-400"
                              }`}
                            >
                              <Code2 size={13} />
                            </span>

                            <button
                              type="button"
                              onClick={() => onSelectScript(method.scriptId)}
                              className="min-w-0 flex-1 truncate text-left font-mono text-xs font-medium text-zinc-800"
                              title={`Open ctx.ui.${component.name}.${method.name}()`}
                            >
                              {method.name}()
                            </button>

                            <button
                              type="button"
                              aria-label={`Remove ${method.name} method`}
                              title="Remove method"
                              onClick={() => {
                                void onRemoveMethod(component.nodeId, method.name);
                              }}
                              className="flex size-7 shrink-0 items-center justify-center rounded text-zinc-400 opacity-60 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : !adding ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAddingNodeId(component.nodeId);
                        setDraftName("");
                        setFormError(null);
                      }}
                      className="mt-2 flex w-full items-center gap-2 rounded-md border border-dashed border-zinc-200 bg-white/60 px-2.5 py-2 text-left text-xs text-zinc-500 transition hover:border-sky-300 hover:text-sky-700"
                    >
                      <Plus size={13} />
                      Add first method
                    </button>
                  ) : null}

                  <div className="mt-3 text-[10px] font-mono text-zinc-400">
                    .setProp(prop, value)
                    {component.colorProperty ? " · .setColor(color)" : ""}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
