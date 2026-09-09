import {
  autocompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";
import type { Extension } from "@codemirror/state";
import type { ComponentApiDescription } from "../../component-api";

type ApiNode = {
  label: string;
  completionType: string;
  detail?: string;
  children?: ApiNode[];
};

export function createCtxAutocompleteExtension(
  components: ComponentApiDescription[]
): Extension {
  const root = buildCtxApiTree(components);

  return autocompletion({
    activateOnTyping: true,
    override: [(context) => completeCtxApi(context, root)],
  });
}

function buildCtxApiTree(components: ComponentApiDescription[]): ApiNode {
  const uiComponents: ApiNode[] = components
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((component) => ({
      label: component.name,
      completionType: "class",
      detail: component.type,
      children: [
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
        ...component.properties.map((property) => ({
          label: property.name,
          completionType: "property",
          detail: `${property.valueType} · read/write`,
        })),
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
      ],
    }));

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

function completeCtxApi(
  context: CompletionContext,
  root: ApiNode
): CompletionResult | null {
  const candidate = findCtxCandidate(context);
  if (!candidate) {
    return null;
  }

  const { chain, from } = candidate;
  if (chain === "ctx") {
    return null;
  }

  const trailingDot = chain.endsWith(".");
  const segments = chain.split(".");
  const prefix = trailingDot ? "" : segments.pop() ?? "";

  if (trailingDot) {
    segments.pop();
  }

  if (segments[0] !== "ctx") {
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

function findCtxCandidate(
  context: CompletionContext
): { chain: string; from: number } | null {
  const scanFrom = Math.max(0, context.pos - 240);
  const before = context.state.sliceDoc(scanFrom, context.pos);
  const relativeStart = before.lastIndexOf("ctx");

  if (relativeStart < 0) {
    return null;
  }

  const previous = before[relativeStart - 1];
  if (previous && /[A-Za-z0-9_$]/.test(previous)) {
    return null;
  }

  const chain = before.slice(relativeStart);
  if (!/^ctx(?:\.[A-Za-z_$][\w$]*)*\.?[A-Za-z_$\w$]*$/.test(chain)) {
    return null;
  }

  return {
    chain,
    from: scanFrom + relativeStart,
  };
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
