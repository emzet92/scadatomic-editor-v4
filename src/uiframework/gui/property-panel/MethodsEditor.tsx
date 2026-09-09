import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Braces,
  ChevronDown,
  Code2,
  ExternalLink,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { validateComponentMethodName } from "../../component-api";
import type { MethodRef, UiNode } from "../../core/document";

export function MethodsEditor({
  node,
  setMethod,
}: {
  node: UiNode;
  setMethod: (
    nodeId: string,
    method: string,
    script: MethodRef | null,
  ) => void;
}) {
  const { projectId } = useParams();
  const [expanded, setExpanded] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const methods = Object.entries(node.methods ?? {}).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  function resetAddForm() {
    setAdding(false);
    setDraftName("");
    setError(null);
  }

  function addMethod() {
    const validation = validateComponentMethodName(node, draftName);

    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    const scriptId = `component-method.${crypto.randomUUID()}`;
    setMethod(node.id, validation.name, { scriptId });
    resetAddForm();
    setExpanded(true);
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)]">
      <div className="flex min-h-12 items-center gap-2 border-b border-[var(--editor-border)] px-3">
        <button
          data-editor-ignore
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-center gap-2 py-3 text-left"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]">
            <Braces size={15} strokeWidth={1.8} />
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--editor-text)]">
                Component API
              </span>
              <span className="rounded-full bg-[var(--editor-background)] px-1.5 py-0.5 text-[10px] tabular-nums text-[var(--editor-text-muted)]">
                {methods.length}
              </span>
            </span>
            <span className="block truncate text-[11px] text-[var(--editor-text-soft)]">
              Public methods exposed on ctx.ui.{node.name}
            </span>
          </span>

          <ChevronDown
            size={15}
            className={`shrink-0 text-[var(--editor-text-muted)] transition-transform ${
              expanded ? "rotate-0" : "-rotate-90"
            }`}
          />
        </button>

        <button
          data-editor-ignore
          type="button"
          aria-label="Add component method"
          title="Add method"
          onClick={() => {
            setExpanded(true);
            setAdding(true);
            setError(null);
          }}
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-[var(--editor-text-muted)] transition hover:bg-[var(--editor-accent-soft)] hover:text-[var(--editor-accent)]"
        >
          <Plus size={16} />
        </button>
      </div>

      {expanded ? (
        <div className="p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--editor-text-muted)]">
              Methods
            </div>
            {!adding ? (
              <button
                data-editor-ignore
                type="button"
                onClick={() => {
                  setAdding(true);
                  setError(null);
                }}
                className="flex items-center gap-1 text-[11px] font-medium text-[var(--editor-accent)] hover:underline"
              >
                <Plus size={12} />
                Add method
              </button>
            ) : null}
          </div>

          {adding ? (
            <div className="mb-3 rounded-lg border border-[var(--editor-border)] bg-[var(--editor-background)] p-2.5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-xs font-medium text-[var(--editor-text)]">
                  New method
                </div>
                <button
                  data-editor-ignore
                  type="button"
                  aria-label="Cancel adding method"
                  onClick={resetAddForm}
                  className="flex size-6 items-center justify-center rounded text-[var(--editor-text-muted)] hover:bg-[var(--editor-surface)] hover:text-[var(--editor-text)]"
                >
                  <X size={13} />
                </button>
              </div>

              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="relative">
                    <input
                      data-editor-ignore
                      autoFocus
                      value={draftName}
                      placeholder="enable"
                      spellCheck={false}
                      autoComplete="off"
                      onChange={(event) => {
                        setDraftName(event.target.value);
                        setError(null);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addMethod();
                        }

                        if (event.key === "Escape") {
                          event.preventDefault();
                          resetAddForm();
                        }
                      }}
                      className={`h-8 w-full rounded-md border bg-[var(--editor-surface)] px-2.5 pr-7 font-mono text-xs text-[var(--editor-text)] outline-none transition focus:ring-2 focus:ring-blue-500/15 ${
                        error
                          ? "border-red-500 focus:border-red-500"
                          : "border-[var(--editor-border)] focus:border-blue-500"
                      }`}
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-mono text-xs text-[var(--editor-text-soft)]">
                      ()
                    </span>
                  </div>
                  {error ? (
                    <div className="mt-1 text-[11px] leading-4 text-red-600">
                      {error}
                    </div>
                  ) : (
                    <div className="mt-1 text-[10px] text-[var(--editor-text-soft)]">
                      Available as ctx.ui.{node.name}.{draftName || "method"}()
                    </div>
                  )}
                </div>

                <button
                  data-editor-ignore
                  type="button"
                  onClick={addMethod}
                  className="h-8 shrink-0 rounded-md bg-[var(--editor-accent)] px-2.5 text-[11px] font-semibold text-white transition hover:opacity-90"
                >
                  Add
                </button>
              </div>
            </div>
          ) : null}

          {methods.length > 0 ? (
            <div className="space-y-1">
              {methods.map(([methodName, method]) => {
                const scriptPath = projectId
                  ? `/project/${encodeURIComponent(projectId)}/scripts/${encodeURIComponent(method.scriptId)}`
                  : null;

                return (
                  <div
                    key={methodName}
                    className="group flex min-h-10 items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-[var(--editor-background)]"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface)] text-[var(--editor-text-muted)]">
                      <Code2 size={14} strokeWidth={1.8} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-xs font-medium text-[var(--editor-text)]">
                        {methodName}()
                      </div>
                      <div className="truncate text-[10px] text-[var(--editor-text-soft)]">
                        ctx.ui.{node.name}.{methodName}()
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-0.5 opacity-70 transition group-hover:opacity-100">
                      {scriptPath ? (
                        <Link
                          data-editor-ignore
                          to={scriptPath}
                          aria-label={`Open ${methodName} script`}
                          title="Open script"
                          className="flex size-7 items-center justify-center rounded-md text-[var(--editor-text-muted)] transition hover:bg-[var(--editor-surface)] hover:text-[var(--editor-accent)]"
                        >
                          <ExternalLink size={13} />
                        </Link>
                      ) : null}

                      <button
                        data-editor-ignore
                        type="button"
                        aria-label={`Remove ${methodName} method`}
                        title="Remove method"
                        onClick={() => setMethod(node.id, methodName, null)}
                        className="flex size-7 items-center justify-center rounded-md text-[var(--editor-text-muted)] transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : !adding ? (
            <button
              data-editor-ignore
              type="button"
              onClick={() => setAdding(true)}
              className="flex w-full items-center gap-2 rounded-lg border border-dashed border-[var(--editor-border)] px-3 py-3 text-left transition hover:border-[var(--editor-accent)] hover:bg-[var(--editor-accent-soft)]"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[var(--editor-background)] text-[var(--editor-text-muted)]">
                <Plus size={14} />
              </span>
              <span>
                <span className="block text-xs font-medium text-[var(--editor-text)]">
                  Add first method
                </span>
                <span className="block text-[10px] text-[var(--editor-text-soft)]">
                  Create reusable behavior for this component.
                </span>
              </span>
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
