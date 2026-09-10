import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Braces,
  ChevronDown,
  Code2,
  ExternalLink,
  Plus,
  Trash2,
} from "lucide-react";
import { validateComponentMethodName } from "../../component-api";
import type { MethodRef, UiNode } from "../../core/document";
import { MethodCreateForm } from "../component-api/MethodCreateForm";
import { Button, EmptyAction, IconButton } from "../ui";

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

        <IconButton
          size="icon"
          variant="text"
          aria-label="Add component method"
          title="Add method"
          onClick={() => {
            setExpanded(true);
            setAdding(true);
            setError(null);
          }}
        >
          <Plus size={16} />
        </IconButton>
      </div>

      {expanded ? (
        <div className="p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--editor-text-muted)]">
              Methods
            </div>
            {!adding ? (
              <Button
                variant="text"
                size="xs"
                onClick={() => {
                  setAdding(true);
                  setError(null);
                }}
              >
                <Plus size={12} />
                Add method
              </Button>
            ) : null}
          </div>

          {adding ? (
            <MethodCreateForm
              value={draftName}
              error={error}
              hint={`Available as ctx.ui.${node.name}.${draftName || "method"}()`}
              onChange={(value) => {
                setDraftName(value);
                setError(null);
              }}
              onSubmit={addMethod}
              onCancel={resetAddForm}
              className="mb-3 bg-[var(--editor-background)]"
            />
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

                      <IconButton
                        variant="danger"
                        aria-label={`Remove ${methodName} method`}
                        title="Remove method"
                        onClick={() => setMethod(node.id, methodName, null)}
                      >
                        <Trash2 size={13} />
                      </IconButton>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : !adding ? (
            <EmptyAction onClick={() => setAdding(true)}>
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
            </EmptyAction>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
