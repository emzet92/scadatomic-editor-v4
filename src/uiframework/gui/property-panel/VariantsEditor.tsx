import { Check, Palette, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { useState } from "react";
import {
  createComponentVariantSnapshot,
  validateComponentVariantName,
} from "../../component-variants";
import type { UiNode } from "../../core/document";
import type { UpdateNode } from "./property-panel-types";

export function VariantsEditor({
  node,
  updateNode,
  onEditVariant,
}: {
  node: UiNode;
  updateNode: UpdateNode;
  onEditVariant: (nodeId: string, variantName: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const variants = Object.keys(node.variants ?? {}).sort((left, right) =>
    left.localeCompare(right)
  );

  function addVariant() {
    const validation = validateComponentVariantName(node, draft);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    const variantName = validation.name;

    updateNode(node.id, (current) => ({
      ...current,
      variants: {
        ...(current.variants ?? {}),
        [variantName]: {
          props: createComponentVariantSnapshot(current),
        },
      },
      defaultVariant: current.defaultVariant ?? variantName,
    }));

    setDraft("");
    setError(null);
    setAdding(false);
    onEditVariant(node.id, variantName);
  }

  function removeVariant(variantName: string) {
    updateNode(node.id, (current) => {
      const nextVariants = { ...(current.variants ?? {}) };
      delete nextVariants[variantName];
      const remaining = Object.keys(nextVariants);

      if (remaining.length === 0) {
        return {
          ...current,
          variants: undefined,
          defaultVariant: undefined,
        };
      }

      return {
        ...current,
        variants: nextVariants,
        defaultVariant:
          current.defaultVariant === variantName
            ? remaining[0]
            : current.defaultVariant ?? remaining[0],
      };
    });
  }

  function setDefaultVariant(variantName: string) {
    updateNode(node.id, (current) => ({
      ...current,
      defaultVariant: variantName,
    }));
  }

  return (
    <section className="space-y-3 border-t border-[var(--editor-border)] pt-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">
            Variants
          </div>
          <div className="mt-1 text-[11px] text-[var(--editor-text-muted)] opacity-70">
            Visual states exposed as generated API methods.
          </div>
        </div>

        {!adding ? (
          <button
            type="button"
            data-editor-ignore
            onClick={() => {
              setAdding(true);
              setDraft("");
              setError(null);
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface)] px-2.5 text-xs font-medium text-[var(--editor-text)] transition hover:border-[var(--editor-accent-border)] hover:bg-[var(--editor-accent-soft)]"
          >
            <Plus size={13} /> Add
          </button>
        ) : null}
      </div>

      {adding ? (
        <div className="rounded-lg border border-[var(--editor-accent-border)] bg-[var(--editor-accent-soft)] p-3">
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <input
                autoFocus
                data-editor-ignore
                value={draft}
                placeholder="enabled"
                spellCheck={false}
                autoComplete="off"
                onChange={(event) => {
                  setDraft(event.target.value);
                  setError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addVariant();
                  }
                  if (event.key === "Escape") {
                    event.preventDefault();
                    setAdding(false);
                    setError(null);
                  }
                }}
                className={`h-8 w-full rounded-md border bg-[var(--editor-surface)] px-2 pr-7 font-mono text-xs text-[var(--editor-text)] outline-none ${
                  error
                    ? "border-red-400"
                    : "border-[var(--editor-border)] focus:border-[var(--editor-accent-border)]"
                }`}
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[var(--editor-text-muted)]">
                ()
              </span>
            </div>
            <button
              type="button"
              data-editor-ignore
              onClick={addVariant}
              className="flex size-8 items-center justify-center rounded-md bg-[var(--editor-accent)] text-white hover:bg-[var(--editor-accent-hover)]"
              title="Add variant"
            >
              <Check size={13} />
            </button>
            <button
              type="button"
              data-editor-ignore
              onClick={() => {
                setAdding(false);
                setError(null);
              }}
              className="flex size-8 items-center justify-center rounded-md text-[var(--editor-text-muted)] hover:bg-[var(--editor-surface)]"
              title="Cancel"
            >
              <X size={13} />
            </button>
          </div>
          {error ? (
            <div className="mt-1.5 text-[10px] leading-4 text-red-600">{error}</div>
          ) : (
            <div className="mt-1.5 truncate font-mono text-[9px] text-[var(--editor-text-muted)] opacity-70">
              ctx.ui.{node.name}.variant.{draft || "enabled"}()
            </div>
          )}
        </div>
      ) : null}

      {variants.length === 0 ? (
        <button
          type="button"
          data-editor-ignore
          onClick={() => setAdding(true)}
          className="flex w-full items-center gap-2 rounded-lg border border-dashed border-[var(--editor-border)] px-3 py-3 text-left text-xs text-[var(--editor-text-muted)] transition hover:border-[var(--editor-accent-border)] hover:bg-[var(--editor-accent-soft)]"
        >
          <Palette size={14} /> Add the first visual variant
        </button>
      ) : (
        <div className="space-y-1.5">
          {variants.map((variantName) => {
            const isDefault = node.defaultVariant === variantName;
            return (
              <div
                key={variantName}
                className="group flex items-center gap-2 rounded-lg border border-[var(--editor-border)] bg-[var(--editor-surface)] px-2.5 py-2"
              >
                <button
                  type="button"
                  data-editor-ignore
                  onClick={() => onEditVariant(node.id, variantName)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-mono text-xs font-medium text-[var(--editor-text)]">
                      {variantName}()
                    </span>
                    {isDefault ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700">
                        <Star size={8} fill="currentColor" /> default
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 truncate font-mono text-[9px] text-[var(--editor-text-muted)] opacity-60">
                    ctx.ui.{node.name}.variant.{variantName}()
                  </div>
                </button>

                {!isDefault ? (
                  <button
                    type="button"
                    data-editor-ignore
                    onClick={() => setDefaultVariant(variantName)}
                    className="flex size-7 shrink-0 items-center justify-center rounded text-[var(--editor-text-muted)] opacity-60 transition hover:bg-amber-50 hover:text-amber-700"
                    title="Set as default variant"
                  >
                    <Star size={12} />
                  </button>
                ) : null}

                <button
                  type="button"
                  data-editor-ignore
                  onClick={() => onEditVariant(node.id, variantName)}
                  className="flex size-7 shrink-0 items-center justify-center rounded text-[var(--editor-text-muted)] opacity-60 transition hover:bg-[var(--editor-accent-soft)] hover:text-[var(--editor-accent)]"
                  title="Edit variant in Component mode"
                >
                  <Pencil size={12} />
                </button>

                <button
                  type="button"
                  data-editor-ignore
                  onClick={() => removeVariant(variantName)}
                  className="flex size-7 shrink-0 items-center justify-center rounded text-[var(--editor-text-muted)] opacity-40 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                  title="Delete variant"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
