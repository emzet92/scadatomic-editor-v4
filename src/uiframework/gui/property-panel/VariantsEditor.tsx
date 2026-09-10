import { Check, Palette, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { useState } from "react";
import {
  createComponentVariantSnapshot,
  validateComponentVariantName,
} from "../../component-variants";
import type { UiNode } from "../../core/document";
import type { UpdateNode } from "./property-panel-types";
import {
  Button,
  EmptyAction,
  IconButton,
  PanelCard,
  SectionHeader,
  TextInput,
} from "../ui";

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
      <SectionHeader
        title="Variants"
        description="Visual states exposed as generated API methods."
        action={
          !adding ? (
            <Button
              onClick={() => {
                setAdding(true);
                setDraft("");
                setError(null);
              }}
            >
              <Plus size={13} /> Add
            </Button>
          ) : null
        }
      />

      {adding ? (
        <PanelCard accent>
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <TextInput
                autoFocus
                controlSize="sm"
                mono
                value={draft}
                invalid={!!error}
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
                className="pr-7"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[var(--editor-text-muted)]">
                ()
              </span>
            </div>
            <IconButton
              variant="primary"
              size="icon"
              aria-label="Add variant"
              onClick={addVariant}
              title="Add variant"
            >
              <Check size={13} />
            </IconButton>
            <IconButton
              size="icon"
              aria-label="Cancel adding variant"
              onClick={() => {
                setAdding(false);
                setError(null);
              }}
              title="Cancel"
            >
              <X size={13} />
            </IconButton>
          </div>
          {error ? (
            <div className="mt-1.5 text-[10px] leading-4 text-red-600">{error}</div>
          ) : (
            <div className="mt-1.5 truncate font-mono text-[9px] text-[var(--editor-text-muted)] opacity-70">
              ctx.ui.{node.name}.variant.{draft || "enabled"}()
            </div>
          )}
        </PanelCard>
      ) : null}

      {variants.length === 0 ? (
        <EmptyAction onClick={() => setAdding(true)}>
          <Palette size={14} /> Add the first visual variant
        </EmptyAction>
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
                  <IconButton
                    aria-label={`Set ${variantName} as default variant`}
                    onClick={() => setDefaultVariant(variantName)}
                    className="opacity-60 hover:bg-amber-50 hover:text-amber-700"
                    title="Set as default variant"
                  >
                    <Star size={12} />
                  </IconButton>
                ) : null}

                <IconButton
                  variant="text"
                  aria-label={`Edit ${variantName} variant`}
                  onClick={() => onEditVariant(node.id, variantName)}
                  className="opacity-60"
                  title="Edit variant in Component mode"
                >
                  <Pencil size={12} />
                </IconButton>

                <IconButton
                  variant="danger"
                  aria-label={`Delete ${variantName} variant`}
                  onClick={() => removeVariant(variantName)}
                  className="opacity-40 group-hover:opacity-100"
                  title="Delete variant"
                >
                  <Trash2 size={12} />
                </IconButton>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
