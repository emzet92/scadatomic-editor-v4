import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  validateComponentMethodName,
} from "../../component-api";
import type { MethodRef, UiNode } from "../../core/document";

export function MethodsEditor({
  node,
  setMethod,
}: {
  node: UiNode;
  setMethod: (
    nodeId: string,
    method: string,
    script: MethodRef | null
  ) => void;
}) {
  const { projectId } = useParams();
  const [draftName, setDraftName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const methods = Object.entries(node.methods ?? {}).sort(([left], [right]) =>
    left.localeCompare(right)
  );

  function addMethod() {
    const validation = validateComponentMethodName(node, draftName);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    const scriptId = `component-method.${crypto.randomUUID()}`;
    setMethod(node.id, validation.name, { scriptId });
    setDraftName("");
    setError(null);

  }

  return (
    <div className="pt-4 border-t border-[var(--editor-border)] space-y-3">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">
          Methods
        </div>
        <div className="mt-1 text-xs text-[var(--editor-text-soft)]">
          Public methods exposed as ctx.ui.{node.name}.method().
        </div>
      </div>

      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <input
            data-editor-ignore
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
            }}
            className={`h-9 w-full rounded-md border bg-[var(--editor-surface)] px-2.5 text-sm text-[var(--editor-text)] outline-none transition focus:ring-2 focus:ring-blue-500/20 ${
              error
                ? "border-red-500 focus:border-red-500"
                : "border-[var(--editor-border)] focus:border-blue-500"
            }`}
          />
          {error ? (
            <div className="mt-1 text-[11px] leading-4 text-red-600">
              {error}
            </div>
          ) : null}
        </div>

        <button
          data-editor-ignore
          type="button"
          onClick={addMethod}
          className="h-9 shrink-0 rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface)] px-3 text-xs font-medium text-[var(--editor-text)] transition hover:bg-[var(--editor-accent-soft)]"
        >
          Add method
        </button>
      </div>

      {methods.length > 0 ? (
        <div className="space-y-2">
          {methods.map(([methodName, method]) => {
            const scriptPath = projectId
              ? `/project/${encodeURIComponent(projectId)}/scripts/${encodeURIComponent(method.scriptId)}`
              : null;

            return (
              <div
                key={methodName}
                className="flex items-center gap-3 rounded-lg border border-[var(--editor-border)] bg-[var(--editor-surface)] px-3 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-[var(--editor-text)]">
                    {methodName}()
                  </div>
                  <div className="truncate text-xs text-[var(--editor-text-muted)]">
                    {method.scriptId}
                  </div>
                </div>

                {scriptPath ? (
                  <Link
                    data-editor-ignore
                    to={scriptPath}
                    className="shrink-0 text-xs font-medium text-[var(--editor-accent)] hover:underline"
                  >
                    Open script
                  </Link>
                ) : null}

                <button
                  data-editor-ignore
                  type="button"
                  onClick={() => setMethod(node.id, methodName, null)}
                  className="shrink-0 text-xs font-medium text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-xs text-[var(--editor-text-soft)]">
          No component methods yet.
        </div>
      )}
    </div>
  );
}
