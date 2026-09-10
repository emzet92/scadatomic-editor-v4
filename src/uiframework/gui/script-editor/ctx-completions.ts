import {
  autocompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";
import type { Extension } from "@codemirror/state";
import type { ComponentApiDescription } from "../../component-api";
import type { NavigationTreeNode } from "../../navigation/navigation";

export type AutocompleteApiNode = {
  label: string;
  completionType: string;
  detail?: string;
  children?: AutocompleteApiNode[];
};

export function createCtxAutocompleteExtension(
  components: ComponentApiDescription[],
  selfComponent?: ComponentApiDescription,
  internalComponents: ComponentApiDescription[] = [],
  navigation: NavigationTreeNode[] = [],
  extraRoots: AutocompleteApiNode[] = [],
  extraCtxChildren: AutocompleteApiNode[] = []
): Extension {
  const roots: AutocompleteApiNode[] = [
    buildCtxApiTree(components, navigation, extraCtxChildren),
    ...extraRoots,
  ];

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
  navigation: NavigationTreeNode[],
  extraChildren: AutocompleteApiNode[] = []
): AutocompleteApiNode {
  const uiComponents: AutocompleteApiNode[] = components
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
      ...extraChildren,
    ],
  };
}

function buildNavigationNode(node: NavigationTreeNode): AutocompleteApiNode {
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
): AutocompleteApiNode {
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
  roots: AutocompleteApiNode[]
): CompletionResult | null {
  const candidate = findApiCandidate(context);

  if (!candidate) {
    if (!context.explicit) return null;

    return {
      from: context.pos,
      options: roots.map(toCompletion),
      validFor: /^[A-Za-z0-9_$]*$/,
    };
  }

  const { chain, from } = candidate;
  const firstDot = chain.indexOf(".");

  // Top-level completion. This is important for component-local namespaces:
  // typing `int` must actually offer `internal` instead of requiring the user
  // to know and type the whole magic word first.
  if (firstDot < 0) {
    const options = roots
      .filter((root) => root.label.startsWith(chain))
      .map(toCompletion);

    if (options.length === 0) return null;

    return {
      from,
      options,
      validFor: /^[A-Za-z0-9_$]*$/,
    };
  }

  const trailingDot = chain.endsWith(".");
  const rawSegments = chain.split(".");
  const rootLabel = rawSegments[0];
  const root = roots.find((entry) => entry.label === rootLabel);
  if (!root) return null;

  const prefix = trailingDot ? "" : rawSegments[rawSegments.length - 1] ?? "";
  const pathSegments = rawSegments.slice(1, -1);

  let parent = root;
  for (const segment of pathSegments) {
    if (!segment) continue;
    const child = parent.children?.find((entry) => entry.label === segment);
    if (!child) return null;
    parent = child;
  }

  const options = (parent.children ?? []).map(toCompletion);
  if (options.length === 0) return null;

  return {
    from: trailingDot ? context.pos : context.pos - prefix.length,
    options,
    validFor: /^[A-Za-z0-9_$]*$/,
  };
}

/**
 * Returns the dotted API expression immediately before the cursor.
 *
 * Supported examples:
 *   int
 *   internal.
 *   internal.Button3.ba
 *   self.variant.
 *   ctx.ui.Pump1.
 *
 * We deliberately parse only the suffix at the cursor. Looking for the last
 * occurrence of a complete root name made `internal` brittle because partial
 * top-level names (`int`, `inter...`) could never participate in completion.
 */
function findApiCandidate(
  context: CompletionContext
): { chain: string; from: number } | null {
  const scanFrom = Math.max(0, context.pos - 240);
  const before = context.state.sliceDoc(scanFrom, context.pos);
  const match = before.match(/[A-Za-z_$][A-Za-z0-9_$.]*$/);

  if (!match || match.index == null) return null;

  const chain = match[0];
  if (!chain || chain.includes("..")) return null;

  return {
    chain,
    from: scanFrom + match.index,
  };
}

function toCompletion(node: AutocompleteApiNode): Completion {
  const completion: Completion = {
    label: node.label,
    type: node.completionType,
  };

  if (node.detail) {
    completion.detail = node.detail;
  }

  return completion;
}
