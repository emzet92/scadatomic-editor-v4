import { Check, RotateCcw, Save, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { getResolvedComponentProps } from "../../component-api";
import type { UiDocument, UiNode } from "../../core/document";
import { RenderNode } from "../../Renderer";
import { editorRegistry } from "../../registry/editor-registry";
import { getComponentDefinition } from "../../registry/component-definitions";
import { PropInput } from "../property-panel/PropInput";
import type { UpdateNode } from "../property-panel/property-panel-types";

export function VariantEditor({
  document,
  nodeId,
  variantName,
  onSave,
  onSetDefault,
}: {
  document: UiDocument;
  nodeId: string;
  variantName: string;
  onSave: (
    nodeId: string,
    variantName: string,
    props: Record<string, unknown>
  ) => Promise<void>;
  onSetDefault: (nodeId: string, variantName: string) => Promise<void>;
}) {
  const node = document.nodes[nodeId];
  const variant = node?.variants?.[variantName];
  const definition = node ? getComponentDefinition(node.type) : undefined;
  const [draftProps, setDraftProps] = useState<Record<string, unknown>>(() => ({
    ...(variant?.props ?? {}),
  }));
  const [savedProps, setSavedProps] = useState<Record<string, unknown>>(() => ({
    ...(variant?.props ?? {}),
  }));
  const [saving, setSaving] = useState(false);
  const [settingDefault, setSettingDefault] = useState(false);

  const dirty = JSON.stringify(draftProps) !== JSON.stringify(savedProps);
  const isDefault = node?.defaultVariant === variantName;

  const previewDocument = useMemo(() => {
    if (!node) {
      return null;
    }

    const previewNode: UiNode = {
      ...node,
      props: {
        ...getResolvedComponentProps(node),
        ...draftProps,
      },
      defaultVariant: undefined,
    };

    return {
      ...document,
      rootId: node.id,
      nodes: {
        ...document.nodes,
        [node.id]: previewNode,
      },
    } satisfies UiDocument;
  }, [document, node, draftProps]);

  if (!node || !variant || !definition || !previewDocument) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Variant or component no longer exists.
      </div>
    );
  }

  const updateDraft: UpdateNode = (_ignoredNodeId, updater) => {
    const next = updater({
      ...node,
      props: draftProps,
    });

    setDraftProps({ ...(next.props ?? {}) });
  };

  async function save() {
    setSaving(true);
    try {
      await onSave(node.id, variantName, draftProps);
      setSavedProps({ ...draftProps });
    } finally {
      setSaving(false);
    }
  }

  async function makeDefault() {
    setSettingDefault(true);
    try {
      await onSetDefault(node.id, variantName);
    } finally {
      setSettingDefault(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-violet-500">
            Visual Variant
          </div>
          <h1 className="mt-1 text-xl font-semibold text-zinc-900">
            {node.name}.variant.{variantName}()
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Edit one component in isolation. This generates the runtime API method automatically.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isDefault ? (
            <span className="inline-flex h-9 items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-700">
              <Star size={13} fill="currentColor" /> Default
            </span>
          ) : (
            <button
              type="button"
              disabled={settingDefault || dirty}
              onClick={() => void makeDefault()}
              title={dirty ? "Save variant before making it default" : "Use this variant by default"}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50"
            >
              <Star size={13} /> Set default
            </button>
          )}

          <button
            type="button"
            disabled={!dirty || saving}
            onClick={() => void save()}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-sky-600 px-3 text-xs font-semibold text-white transition hover:bg-sky-500 disabled:cursor-default disabled:opacity-40"
          >
            {saving ? <Check size={13} /> : <Save size={13} />}
            {saving ? "Saved" : "Save variant"}
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_320px]">
        <section className="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Focused Preview
              </div>
              <div className="mt-0.5 text-xs text-zinc-400">
                Only {node.name} and its own subtree
              </div>
            </div>
            <code className="rounded bg-violet-50 px-2 py-1 text-[11px] text-violet-700">
              ctx.ui.{node.name}.variant.{variantName}()
            </code>
          </div>

          <div className="flex min-h-[360px] items-center justify-center overflow-auto bg-zinc-50 p-12 bg-[radial-gradient(circle,#d4d4d8_1px,transparent_1px)] bg-[size:18px_18px]">
            <div className="pointer-events-none max-w-full rounded-xl border border-dashed border-violet-300 bg-white/90 p-8 shadow-sm">
              <RenderNode
                id={node.id}
                document={previewDocument}
                registry={editorRegistry}
              />
            </div>
          </div>
        </section>

        <aside className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Variant Props
              </div>
              <div className="mt-1 text-xs text-zinc-400">
                Complete visual snapshot
              </div>
            </div>
            <button
              type="button"
              disabled={!dirty}
              onClick={() => setDraftProps({ ...savedProps })}
              className="flex size-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-25"
              title="Reset unsaved changes"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {Object.entries(definition.inspector).map(([propName, control]) => (
              <PropInput
                key={propName}
                nodeId={node.id}
                propName={propName}
                value={draftProps[propName]}
                values={draftProps}
                control={control}
                updateNode={updateDraft}
              />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
