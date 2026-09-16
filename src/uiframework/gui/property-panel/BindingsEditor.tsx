import { Link2, Unlink } from "lucide-react";
import {
  createReactivePropertyBinding,
  type BindingExpression,
  type ComponentTagReactiveRef,
  type ReactivePropertyBinding,
  type ReactiveRef,
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
import { Button, FormField, SectionHeader, Select, TextInput,
  Box,
  Icon,
} from "../ui";
import {
  createComponentTagReactiveRef,
  formatBindingPath,
  getKnownBindingPaths,
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
    <Box className="pt-4 border-t border-[var(--editor-border)] space-y-3">
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
    </Box>
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
      const ref = createComponentTagReactiveRef(path, projectData, componentInputs);
      if (!ref) return;
      const nextTransform = definition.valueType === "variant" && transform === "direct"
        ? "conditional"
        : transform;
      onChange(buildReactiveBinding(ref, nextTransform, binding, definition, node));
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
    const nextTransform = definition.valueType === "variant" && transform === "direct"
      ? "conditional"
      : transform;
    onChange(buildReactiveBinding(ref, nextTransform, binding, definition, node));
  }

  function setTransform(nextTransform: TransformKind) {
    const ref = getEditorReactiveRef(binding, projectData, componentInputs);
    if (!ref) return;
    onChange(buildReactiveBinding(ref, nextTransform, binding, definition, node));
  }

  function updateConditionalBranch(branch: "true" | "false", rawValue: string) {
    const ref = getEditorReactiveRef(binding, projectData, componentInputs);
    if (!ref) return;
    const current = binding?.kind === "reactive"
      ? readConditionalValues(binding)
      : { whenTrue: defaultTrueValue(definition, node), whenFalse: defaultFalseValue(definition, node) };
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
    const ref = getEditorReactiveRef(binding, projectData, componentInputs);
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
  const editorRef = getEditorReactiveRef(binding, projectData, componentInputs);
  const canEditReactive = binding?.kind === "reactive" || Boolean(editorRef);
  const effectiveTransform = binding?.kind === "reactive"
    ? transform
    : definition.valueType === "variant" && editorRef
      ? "conditional"
      : transform;

  return (
    <Box className="rounded-2xl border border-[var(--editor-border)] bg-[var(--editor-surface-muted)]/50 p-3 space-y-3">
      <Box className="flex items-start justify-between gap-3">
        <Box className="min-w-0">
          <Box className="flex items-center gap-1.5 text-xs font-semibold text-[var(--editor-text)]">
            <Icon glyph={Link2} size={12} /> {definition.label}
          </Box>
          <Box className="mt-0.5 text-[10px] text-[var(--editor-text-muted)]">
            {definition.description ?? property}
          </Box>
        </Box>
        {isBound ? (
          <Button
            size="xs"
            variant="text"
            onClick={() => onChange(null)}
            title="Remove binding"
          >
            <Icon glyph={Unlink} size={11} /> Remove
          </Button>
        ) : null}
      </Box>

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

      {canEditReactive ? (
        <>
          <FormField label="Transform" compact>
            <Select value={effectiveTransform} onChange={(event) => setTransform(event.target.value as TransformKind)}>
              <option value="direct">Direct</option>
              {definition.valueType === "boolean" ? <option value="not">NOT</option> : null}
              <option value="equals">Equals</option>
              <option value="conditional">Condition</option>
            </Select>
          </FormField>

          {effectiveTransform === "equals" ? (
            <FormField label="Equals value" compact>
              <TextInput
                value={String(binding?.kind === "reactive" ? readEqualsValue(binding) ?? "" : "")}
                onChange={(event) => updateEqualsValue(event.target.value)}
              />
            </FormField>
          ) : null}

          {effectiveTransform === "conditional" ? (
            <Box className="grid grid-cols-2 gap-2">
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
            </Box>
          ) : null}
        </>
      ) : binding ? (
        <Box className="rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10px] text-amber-800">
          This binding source cannot currently be resolved. The saved reference is preserved so it can recover when the source is available again.
        </Box>
      ) : null}
    </Box>
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
  if (binding?.kind === "reactive") {
    const sourceRef = binding.dependencies.find(
      (ref): ref is TagReactiveRef | ComponentTagReactiveRef =>
        ref.kind === "tag" || ref.kind === "component-tag"
    );
    if (sourceRef?.kind === "component-tag") return sourceRef.path ?? "";
    if (sourceRef?.kind === "tag" && projectData) {
      return resolveTagFieldRef(projectData, sourceRef.ref)?.path ?? sourceRef.path ?? "";
    }
  }
  return formatBindingPath(binding);
}

function buildReactiveBinding(
  ref: ReactiveRef,
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

function getEditorReactiveRef(
  binding: Binding | undefined,
  projectData: ReturnType<typeof useEditorStore.getState>["document"]["data"],
  componentInputs: Record<string, ComponentInputDefinition> | undefined,
): TagReactiveRef | ComponentTagReactiveRef | undefined {
  if (!binding) return undefined;
  if (binding.kind === "reactive") {
    return binding.dependencies.find(
      (ref): ref is TagReactiveRef | ComponentTagReactiveRef =>
        ref.kind === "tag" || ref.kind === "component-tag"
    );
  }
  if (binding.kind === "tag" && projectData) {
    const resolved = findTagFieldRefByPath(projectData, binding.path);
    return resolved ? { kind: "tag", ref: resolved.ref, path: resolved.path } : undefined;
  }
  if (binding.kind === "tagRef") {
    return createComponentTagReactiveRef(
      `${binding.input}${binding.path ? `.${binding.path}` : ""}`,
      projectData,
      componentInputs,
    );
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
