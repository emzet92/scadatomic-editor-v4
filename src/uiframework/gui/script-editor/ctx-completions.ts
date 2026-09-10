import {
  autocompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";
import type { Extension } from "@codemirror/state";
import type { ComponentApiDescription } from "../../component-api";
import type { NavigationTreeNode } from "../../navigation/navigation";

type ApiNode = {
  label: string;
  completionType: string;
  detail?: string;
  children?: ApiNode[];
};

export function createCtxAutocompleteExtension(
  components: ComponentApiDescription[],
  selfComponent?: ComponentApiDescription,
  internalComponents: ComponentApiDescription[] = [],
  navigation: NavigationTreeNode[] = []
): Extension {
  const roots = [buildCtxApiTree(components, navigation)];

  if (selfComponent) {
    roots.push(buildComponentRoot("self", selfComponent));
  }

  if (internalComponents.length > 0) {
    roots.push({
      label: "internal",
      completionType: "namespace",
      detail: "private component implementation",
      children: internalComponents
        .slice()
        .sort((left, right) => left.name.localeCompare(right.name))
        .map((component) => buildComponentRoot(component.name, component)),
    });
  }

  return autocompletion({
    activateOnTyping: true,
    override: [(context) => completeApi(context, roots)],
  });
}

function buildCtxApiTree(
  components: ComponentApiDescription[],
  navigation: NavigationTreeNode[]
): ApiNode {
  const uiComponents: ApiNode[] = components
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((component) => buildComponentRoot(component.name, component));

  return {
    label: "ctx",
    completionType: "variable",
    children: [
      {
        label: "ui",
        completionType: "namespace",
        detail: "UI component API",
        children: uiComponents,
      },
      {
        label: "nav",
        completionType: "namespace",
        detail: "type-safe page navigation",
        children: navigation.map(buildNavigationNode),
      },
      {
        label: "navigateTo",
        completionType: "method",
        detail: '("Page/SubPage")',
      },
      {
        label: "state",
        completionType: "namespace",
        detail: "session state",
        children: [
          { label: "get", completionType: "method", detail: "(key, fallback?)" },
          { label: "set", completionType: "method", detail: "(key, value)" },
          { label: "delete", completionType: "method", detail: "(key)" },
          { label: "clear", completionType: "method", detail: "()" },
        ],
      },
      {
        label: "random",
        completionType: "namespace",
        detail: "prototype random helpers",
        children: [
          { label: "color", completionType: "method", detail: "() → string" },
          {
            label: "number",
            completionType: "method",
            detail: "(min, max) → number",
          },
        ],
      },
      {
        label: "emit",
        completionType: "method",
        detail: "(name, payload?)",
      },
      {
        label: "log",
        completionType: "method",
        detail: "(...args)",
      },
      {
        label: "projectId",
        completionType: "property",
        detail: "string · read only",
      },
      {
        label: "handlerId",
        completionType: "property",
        detail: "string · read only",
      },
      {
        label: "sourceNodeId",
        completionType: "property",
        detail: "string · read only",
      },
      {
        label: "eventName",
        completionType: "property",
        detail: "string · read only",
      },
    ],
  };
}

function buildNavigationNode(node: NavigationTreeNode): ApiNode {
  return {
    label: node.name,
    completionType: "class",
    detail: node.path,
    children: [
      { label: "go", completionType: "method", detail: `() → ${node.path}` },
      { label: "path", completionType: "property", detail: `"${node.path}" · read only` },
      ...node.children.map(buildNavigationNode),
    ],
  };
}

function buildComponentRoot(
  label: string,
  component: ComponentApiDescription
): ApiNode {
  return {
    label,
    completionType: "class",
    detail: component.type,
    children: [
      ...(component.apiSurface === "primitive"
        ? [
            {
              label: "id",
              completionType: "property",
              detail: "string · read only",
            },
            {
              label: "name",
              completionType: "property",
              detail: "string · read only",
            },
            {
              label: "type",
              completionType: "property",
              detail: "string · read only",
            },
          ]
        : []),
      ...component.properties.map((property) => ({
        label: property.name,
        completionType: "property",
        detail: `${property.valueType} · read/write`,
      })),
      ...component.methods.map((method) => ({
        label: method.name,
        completionType: "method",
        detail: "component method",
      })),
      ...(component.variants.length > 0
        ? [
            {
              label: "variant",
              completionType: "namespace",
              detail: "generated visual variant API",
              children: [
                {
                  label: "current",
                  completionType: "property",
                  detail: `${component.variants.map((variant) => `"${variant.name}"`).join(" | ")} · read only`,
                },
                ...component.variants.map((variant) => ({
                  label: variant.name,
                  completionType: "method",
                  detail: variant.isDefault
                    ? "visual variant · default"
                    : "visual variant",
                })),
              ],
            },
          ]
        : []),
      ...(component.apiSurface === "primitive"
        ? [
            {
              label: "setProp",
              completionType: "method",
              detail: "(prop, value)",
            },
            ...(component.colorProperty
              ? [
                  {
                    label: "setColor",
                    completionType: "method",
                    detail: `(color) → ${component.colorProperty}`,
                  },
                ]
              : []),
          ]
        : []),
    ],
  };
}

function completeApi(
  context: CompletionContext,
  roots: ApiNode[]
): CompletionResult | null {
  const candidate = findApiCandidate(context, roots.map((root) => root.label));
  if (!candidate) {
    return null;
  }

  const { chain, from, rootLabel } = candidate;
  if (chain === rootLabel) {
    return null;
  }

  const root = roots.find((entry) => entry.label === rootLabel);
  if (!root) {
    return null;
  }

  const trailingDot = chain.endsWith(".");
  const segments = chain.split(".");
  const prefix = trailingDot ? "" : segments.pop() ?? "";

  if (trailingDot) {
    segments.pop();
  }

  if (segments[0] !== rootLabel) {
    return null;
  }

  let parent = root;
  for (const segment of segments.slice(1)) {
    const child = parent.children?.find((entry) => entry.label === segment);
    if (!child) {
      return null;
    }
    parent = child;
  }

  const options = (parent.children ?? []).map(toCompletion);
  if (options.length === 0) {
    return null;
  }

  return {
    from: trailingDot ? context.pos : from + chain.length - prefix.length,
    options,
    validFor: /^[A-Za-z0-9_$]*$/,
  };
}

function findApiCandidate(
  context: CompletionContext,
  rootLabels: string[]
): { chain: string; from: number; rootLabel: string } | null {
  const scanFrom = Math.max(0, context.pos - 240);
  const before = context.state.sliceDoc(scanFrom, context.pos);
  const candidates = rootLabels
    .map((rootLabel) => ({
      rootLabel,
      relativeStart: before.lastIndexOf(rootLabel),
    }))
    .filter((entry) => entry.relativeStart >= 0)
    .sort((left, right) => right.relativeStart - left.relativeStart);

  for (const candidate of candidates) {
    const previous = before[candidate.relativeStart - 1];
    if (previous && /[A-Za-z0-9_$]/.test(previous)) {
      continue;
    }

    const chain = before.slice(candidate.relativeStart);
    const escaped = escapeRegExp(candidate.rootLabel);
    const pattern = new RegExp(
      `^${escaped}(?:\\.[A-Za-z_$][\\w$]*)*\\.?[A-Za-z_$\\w$]*$`
    );

    if (!pattern.test(chain)) {
      continue;
    }

    return {
      chain,
      from: scanFrom + candidate.relativeStart,
      rootLabel: candidate.rootLabel,
    };
  }

  return null;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toCompletion(node: ApiNode): Completion {
  const completion: Completion = {
    label: node.label,
    type: node.completionType,
  };

  if (node.detail) {
    completion.detail = node.detail;
  }

  return completion;
}
