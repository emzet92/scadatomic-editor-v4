import { Link2, Unlink } from "lucide-react";
import {
  createReactivePropertyBinding,
  type BindingExpression,
  type ReactivePropertyBinding,
  type TagReactiveRef,
} from "../../../reactivity";
import type {
  Binding,
  ComponentInputDefinition,
  UiNode,
} from "../../core/document";
import {
  findTagFieldRefByPath,
  resolveTagFieldRef,
} from "../../data/tags/TagFieldRef";
import { useEditorStore } from "../../editor-store";
import type { BindingDefinition } from "../../registry/component-definition-types";
import { Button, FormField, SectionHeader, Select, TextInput } from "../ui";
import {
  formatBindingPath,
  getKnownBindingPaths,
  parseBindingPath,
} from "./binding-paths";

type TransformKind = "direct" | "not" | "equals" | "conditional";

export function BindingsEditor({
  node,
  definitions,
  bindings,
  setBinding,
  componentInputs,
}: {
  node: UiNode;
  definitions: Record<string, BindingDefinition>;
  bindings: Record<string, Binding> | undefined;
  setBinding: (
    nodeId: string,
    property: string,
    binding: Binding | null
  ) => void;
  componentInputs?: Record<string, ComponentInputDefinition> | undefined;
}) {
  const projectData = useEditorStore((state) => state.document.data);
  const { absolutePaths, relativePaths } = getKnownBindingPaths(
    projectData,
    componentInputs,
  );

  return (
    <div className="pt-4 border-t border-[var(--editor-border)] space-y-3">
      <SectionHeader
        title="Reactive bindings"
        description="Derive UI state from runtime values. Bindings are pure and never execute commands."
      />

      {Object.entries(definitions).map(([property, definition]) => (
        <BindingCard
          key={property}
          node={node}
          property={property}
          definition={definition}
          binding={bindings?.[property]}
          absolutePaths={absolutePaths}
          relativePaths={relativePaths}
          componentInputs={componentInputs}
          onChange={(binding) => setBinding(node.id, property, binding)}
        />
      ))}
    </div>
  );
}

function BindingCard({
  node,
  property,
  definition,
  binding,
  absolutePaths,
  relativePaths,
  componentInputs,
  onChange,
}: {
  node: UiNode;
  property: string;
  definition: BindingDefinition;
  binding: Binding | undefined;
  absolutePaths: string[];
  relativePaths: string[];
  componentInputs?: Record<string, ComponentInputDefinition> | undefined;
  onChange(binding: Binding | null): void;
}) {
  const projectData = useEditorStore((state) => state.document.data);
  const sourcePath = resolveCurrentBindingPath(binding, projectData);
  const transform = detectTransform(binding);
  const isBound = Boolean(binding);

  function bindSource(path: string) {
    if (!path) {
      onChange(null);
      return;
    }

    if (relativePaths.includes(path)) {
      onChange(parseBindingPath(path, componentInputs));
      return;
    }

    const resolved = projectData ? findTagFieldRefByPath(projectData, path) : undefined;
    if (!resolved) {
      // Keep legacy path support for an unresolved value so the designer can
      // preserve references while a source is temporarily missing.
      onChange({ kind: "tag", path });
      return;
    }

    const ref: TagReactiveRef = {
      kind: "tag",
      ref: resolved.ref,
      path: resolved.path,
    };
    onChange(buildReactiveBinding(ref, transform, binding, definition, node));
  }

  function setTransform(nextTransform: TransformKind) {
    const ref = getAbsoluteReactiveRef(binding, projectData);
    if (!ref) return;
    onChange(buildReactiveBinding(ref, nextTransform, binding, definition, node));
  }

  function updateConditionalBranch(branch: "true" | "false", rawValue: string) {
    const reactive = binding?.kind === "reactive" ? binding : undefined;
    const ref = getAbsoluteReactiveRef(binding, projectData);
    if (!reactive || !ref) return;
    const current = readConditionalValues(reactive);
    const value = coerceEditorValue(rawValue, definition.valueType);
    onChange(createReactivePropertyBinding(
      {
        type: "conditional",
        condition: { type: "ref", ref },
        whenTrue: { type: "constant", value: branch === "true" ? value : current.whenTrue },
        whenFalse: { type: "constant", value: branch === "false" ? value : current.whenFalse },
      },
      [ref]
    ));
  }

  function updateEqualsValue(rawValue: string) {
    const ref = getAbsoluteReactiveRef(binding, projectData);
    if (!ref) return;
    onChange(createReactivePropertyBinding(
      {
        type: "equals",
        left: { type: "ref", ref },
        right: { type: "constant", value: parseLooseValue(rawValue) },
      },
      [ref]
    ));
  }

  const conditionValues = binding?.kind === "reactive"
    ? readConditionalValues(binding)
    : { whenTrue: defaultTrueValue(definition, node), whenFalse: defaultFalseValue(definition, node) };

  return (
    <div className="rounded-2xl border border-[var(--editor-border)] bg-[var(--editor-surface-muted)]/50 p-3 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--editor-text)]">
            <Link2 size={12} /> {definition.label}
          </div>
          <div className="mt-0.5 text-[10px] text-[var(--editor-text-muted)]">
            {definition.description ?? property}
          </div>
        </div>
        {isBound ? (
          <Button
            size="xs"
            variant="text"
            onClick={() => onChange(null)}
            title="Remove binding"
          >
            <Unlink size={11} /> Remove
          </Button>
        ) : null}
      </div>

      <FormField label="Source" compact>
        <Select value={sourcePath} onChange={(event) => bindSource(event.target.value)}>
          <option value="">Static value</option>
          {absolutePaths.length > 0 ? (
            <optgroup label="Project tags">
              {absolutePaths.map((path) => <option key={path} value={path}>{path}</option>)}
            </optgroup>
          ) : null}
          {relativePaths.length > 0 ? (
            <optgroup label="Component TagRef">
              {relativePaths.map((path) => <option key={path} value={path}>{path}</option>)}
            </optgroup>
          ) : null}
        </Select>
      </FormField>

      {binding?.kind === "reactive" ? (
        <>
          <FormField label="Transform" compact>
            <Select value={transform} onChange={(event) => setTransform(event.target.value as TransformKind)}>
              <option value="direct">Direct</option>
              {definition.valueType === "boolean" ? <option value="not">NOT</option> : null}
              <option value="equals">Equals</option>
              <option value="conditional">Condition</option>
            </Select>
          </FormField>

          {transform === "equals" ? (
            <FormField label="Equals value" compact>
              <TextInput
                value={String(readEqualsValue(binding) ?? "")}
                onChange={(event) => updateEqualsValue(event.target.value)}
              />
            </FormField>
          ) : null}

          {transform === "conditional" ? (
            <div className="grid grid-cols-2 gap-2">
              <BindingResultField
                label="When true"
                value={conditionValues.whenTrue}
                definition={definition}
                node={node}
                onChange={(value) => updateConditionalBranch("true", value)}
              />
              <BindingResultField
                label="When false"
                value={conditionValues.whenFalse}
                definition={definition}
                node={node}
                onChange={(value) => updateConditionalBranch("false", value)}
              />
            </div>
          ) : null}
        </>
      ) : binding ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10px] text-amber-800">
          Legacy/relative binding. It remains compatible and will be resolved at runtime.
        </div>
      ) : null}
    </div>
  );
}

function BindingResultField({
  label,
  value,
  definition,
  node,
  onChange,
}: {
  label: string;
  value: unknown;
  definition: BindingDefinition;
  node: UiNode;
  onChange(value: string): void;
}) {
  if (definition.valueType === "variant") {
    const variants = Object.keys(node.variants ?? {});
    return (
      <FormField label={label} compact>
        <Select value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}>
          <option value="">Select variant</option>
          {variants.map((variant) => <option key={variant} value={variant}>{variant}</option>)}
        </Select>
      </FormField>
    );
  }

  if (definition.valueType === "boolean") {
    return (
      <FormField label={label} compact>
        <Select value={String(Boolean(value))} onChange={(event) => onChange(event.target.value)}>
          <option value="true">true</option>
          <option value="false">false</option>
        </Select>
      </FormField>
    );
  }

  return (
    <FormField label={label} compact>
      <TextInput value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} />
    </FormField>
  );
}


function resolveCurrentBindingPath(
  binding: Binding | undefined,
  projectData: ReturnType<typeof useEditorStore.getState>["document"]["data"]
) {
  if (binding?.kind === "reactive" && projectData) {
    const tagRef = binding.dependencies.find((ref): ref is TagReactiveRef => ref.kind === "tag");
    if (tagRef) {
      return resolveTagFieldRef(projectData, tagRef.ref)?.path ?? tagRef.path ?? "";
    }
  }
  return formatBindingPath(binding);
}

function buildReactiveBinding(
  ref: TagReactiveRef,
  transform: TransformKind,
  current: Binding | undefined,
  definition: BindingDefinition,
  node: UiNode
): ReactivePropertyBinding {
  let expression: BindingExpression;
  if (transform === "not") {
    expression = { type: "not", operand: { type: "ref", ref } };
  } else if (transform === "equals") {
    expression = {
      type: "equals",
      left: { type: "ref", ref },
      right: { type: "constant", value: current?.kind === "reactive" ? readEqualsValue(current) : true },
    };
  } else if (transform === "conditional") {
    const previous = current?.kind === "reactive"
      ? readConditionalValues(current)
      : { whenTrue: defaultTrueValue(definition, node), whenFalse: defaultFalseValue(definition, node) };
    expression = {
      type: "conditional",
      condition: { type: "ref", ref },
      whenTrue: { type: "constant", value: previous.whenTrue },
      whenFalse: { type: "constant", value: previous.whenFalse },
    };
  } else {
    expression = { type: "ref", ref };
  }

  return createReactivePropertyBinding(expression, [ref]);
}

function getAbsoluteReactiveRef(
  binding: Binding | undefined,
  projectData: ReturnType<typeof useEditorStore.getState>["document"]["data"]
): TagReactiveRef | undefined {
  if (!binding) return undefined;
  if (binding.kind === "reactive") {
    return binding.dependencies.find((ref): ref is TagReactiveRef => ref.kind === "tag");
  }
  if (binding.kind === "tag" && projectData) {
    const resolved = findTagFieldRefByPath(projectData, binding.path);
    return resolved ? { kind: "tag", ref: resolved.ref, path: resolved.path } : undefined;
  }
  return undefined;
}

function detectTransform(binding: Binding | undefined): TransformKind {
  if (binding?.kind !== "reactive") return "direct";
  if (binding.expression.type === "not") return "not";
  if (binding.expression.type === "equals") return "equals";
  if (binding.expression.type === "conditional") return "conditional";
  return "direct";
}

function readEqualsValue(binding: ReactivePropertyBinding) {
  const expression = binding.expression;
  return expression.type === "equals" && expression.right.type === "constant"
    ? expression.right.value
    : true;
}

function readConditionalValues(binding: ReactivePropertyBinding) {
  const expression = binding.expression;
  if (expression.type !== "conditional") {
    return { whenTrue: true, whenFalse: false };
  }
  return {
    whenTrue: expression.whenTrue.type === "constant" ? expression.whenTrue.value : true,
    whenFalse: expression.whenFalse.type === "constant" ? expression.whenFalse.value : false,
  };
}

function defaultTrueValue(definition: BindingDefinition, node: UiNode) {
  if (definition.valueType === "variant") return Object.keys(node.variants ?? {})[0] ?? "";
  if (definition.valueType === "boolean") return true;
  return "";
}

function defaultFalseValue(definition: BindingDefinition, node: UiNode) {
  if (definition.valueType === "variant") return Object.keys(node.variants ?? {})[1] ?? Object.keys(node.variants ?? {})[0] ?? "";
  if (definition.valueType === "boolean") return false;
  return "";
}

function coerceEditorValue(value: string, type: BindingDefinition["valueType"]) {
  if (type === "boolean") return value === "true";
  if (type === "number") return Number(value);
  return value;
}

function parseLooseValue(value: string): unknown {
  if (value === "true") return true;
  if (value === "false") return false;
  const number = Number(value);
  return value.trim() !== "" && Number.isFinite(number) ? number : value;
}
