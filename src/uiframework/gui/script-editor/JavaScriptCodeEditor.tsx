import { oneDark } from "@codemirror/theme-one-dark";
import CodeMirror from "@uiw/react-codemirror";
import { useMemo } from "react";
import type { ComponentApiDescription } from "../../component-api";
import type { ProjectData } from "../../data/tags/TagDefinition";
import type { NavigationTreeNode } from "../../navigation/navigation";
import type { UiModal } from "../../core/document";
import {
  createTagAutocompleteRoots,
  getTagNamespaceAutocompleteRoot,
} from "../data/udt-autocomplete";
import {
  createCtxAutocompleteExtension,
  type AutocompleteApiNode,
} from "./ctx-completions";

type JavaScriptCodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  components: ComponentApiDescription[];
  selfComponent?: ComponentApiDescription | undefined;
  internalComponents?: ComponentApiDescription[] | undefined;
  navigation?: NavigationTreeNode[] | undefined;
  modals?: UiModal[] | undefined;
  projectData?: ProjectData | undefined;
  extraAutocompleteRoots?: AutocompleteApiNode[] | undefined;
  autocompleteHint?: string | undefined;
  height?: string | undefined;
};

export function JavaScriptCodeEditor({
  value,
  onChange,
  components,
  selfComponent,
  internalComponents = [],
  navigation = [],
  modals = [],
  projectData,
  extraAutocompleteRoots = [],
  autocompleteHint = "ctx · App · self · internal · tags autocomplete",
  height = "420px",
}: JavaScriptCodeEditorProps) {
  const tagRoots = useMemo(
    () => createTagAutocompleteRoots(projectData),
    [projectData]
  );
  const ctxTagRoot = useMemo(
    () => getTagNamespaceAutocompleteRoot(projectData),
    [projectData]
  );
  const autocompleteExtension = useMemo(
    () =>
      createCtxAutocompleteExtension(
        components,
        selfComponent,
        internalComponents,
        navigation,
        mergeAutocompleteRoots(extraAutocompleteRoots, tagRoots),
        [
          ...(ctxTagRoot ? [ctxTagRoot] : []),
          ...(modals.length > 0
            ? [{
                label: "modals",
                completionType: "namespace",
                detail: "modal runtime API",
                children: modals.map((modal) => ({
                  label: modal.name,
                  completionType: "class",
                  detail: "modal",
                  children: [
                    { label: "open", completionType: "method", detail: "(payload?)" },
                    { label: "close", completionType: "method", detail: "(result?)" },
                  ],
                })),
              }]
            : []),
        ]
      ),
    [
      components,
      selfComponent,
      internalComponents,
      navigation,
      modals,
      extraAutocompleteRoots,
      tagRoots,
      ctxTagRoot,
    ]
  );

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-3 py-2">
        <div className="text-xs font-medium text-zinc-300">JavaScript</div>
        <div className="text-[11px] text-zinc-500">{autocompleteHint}</div>
      </div>

      <CodeMirror
        value={value}
        height={height}
        theme={oneDark}
        extensions={[autocompleteExtension]}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          autocompletion: false,
        }}
        onChange={onChange}
      />
    </div>
  );
}

function mergeAutocompleteRoots(
  primary: AutocompleteApiNode[],
  generated: AutocompleteApiNode[]
) {
  const byLabel = new Map<string, AutocompleteApiNode>();
  for (const root of [...generated, ...primary]) {
    byLabel.set(root.label, root);
  }
  return Array.from(byLabel.values());
}
