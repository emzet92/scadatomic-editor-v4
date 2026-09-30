import { Box } from "../../../shared/ui";
import { javascript } from "@codemirror/lang-javascript";
import { indentRange } from "@codemirror/language";
import { openSearchPanel, search } from "@codemirror/search";
import { EditorView } from "@codemirror/view";
import { oneDark } from "@codemirror/theme-one-dark";
import CodeMirror from "@uiw/react-codemirror";
import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import type { ComponentApiDescription } from "../../../visualization/components/component-api";
import type { ProjectData } from "../../../tags/model/TagDefinition";
import type { NavigationTreeNode } from "../../../runtime/navigation/navigation";
import type { UiModal } from "../../../project/model/document";
import {
  createTagAutocompleteRoots,
  getTagNamespaceAutocompleteRoot,
} from "../tags/udt-autocomplete";
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
  onCursorChange?: ((line: number, column: number) => void) | undefined;
};

export type JavaScriptCodeEditorHandle = {
  focus(): void;
  find(): void;
  format(): void;
};

const ideTheme = EditorView.theme({
  "&": {
    fontSize: "13px",
    height: "100%",
  },
  ".cm-scroller": {
    fontFamily:
      '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
    lineHeight: "1.7",
  },
  ".cm-content": {
    padding: "14px 0 24px",
  },
  ".cm-gutters": {
    backgroundColor: "#18181b",
    borderRight: "1px solid #27272a",
    color: "#71717a",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#27272a",
    color: "#d4d4d8",
  },
  ".cm-activeLine": {
    backgroundColor: "rgba(63, 63, 70, 0.28)",
  },
  ".cm-selectionBackground, ::selection": {
    backgroundColor: "rgba(99, 102, 241, 0.35) !important",
  },
  ".cm-tooltip-autocomplete": {
    border: "1px solid #3f3f46",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 18px 50px rgba(0, 0, 0, 0.38)",
  },
});

export const JavaScriptCodeEditor = forwardRef<
  JavaScriptCodeEditorHandle,
  JavaScriptCodeEditorProps
>(function JavaScriptCodeEditor(
  {
    value,
    onChange,
    components,
    selfComponent,
    internalComponents = [],
    navigation = [],
    modals = [],
    projectData,
    extraAutocompleteRoots = [],
    autocompleteHint = "ctx · App · self · internal · tags · autocomplete",
    height = "100%",
    onCursorChange,
  },
  ref
) {
  const editorViewRef = useRef<EditorView | null>(null);
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
            ? [
                {
                  label: "modals",
                  completionType: "namespace",
                  detail: "modal runtime API",
                  children: modals.map((modal) => ({
                    label: modal.name,
                    completionType: "class",
                    detail: "modal",
                    children: [
                      {
                        label: "open",
                        completionType: "method",
                        detail: "(payload?)",
                      },
                      {
                        label: "close",
                        completionType: "method",
                        detail: "(result?)",
                      },
                    ],
                  })),
                },
              ]
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

  useImperativeHandle(ref, () => ({
    focus() {
      editorViewRef.current?.focus();
    },
    find() {
      const view = editorViewRef.current;
      if (!view) return;
      view.focus();
      openSearchPanel(view);
    },
    format() {
      const view = editorViewRef.current;
      if (!view) return;
      const changes = indentRange(view.state, 0, view.state.doc.length);
      if (!changes.empty) {
        view.dispatch({ changes });
      }
      view.focus();
    },
  }));

  return (
    <Box className="flex h-full min-h-0 flex-col overflow-hidden bg-zinc-950">
      <Box className="flex h-9 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-3">
        <Box className="flex min-w-0 items-center gap-2 text-xs text-zinc-300">
          <span className="rounded bg-indigo-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-indigo-300">
            JS
          </span>
          <span className="truncate font-medium">default.js</span>
          <span className="text-zinc-600">×</span>
        </Box>
        <Box className="truncate pl-4 font-mono text-[10px] text-zinc-500">
          {autocompleteHint}
        </Box>
      </Box>

      <Box className="min-h-0 flex-1">
        <CodeMirror
          value={value}
          height={height}
          theme={oneDark}
          extensions={[
            javascript({ jsx: true }),
            search({ top: true }),
            autocompleteExtension,
            ideTheme,
          ]}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            autocompletion: false,
            bracketMatching: true,
            closeBrackets: true,
            indentOnInput: true,
          }}
          onCreateEditor={(view) => {
            editorViewRef.current = view;
          }}
          onUpdate={(update) => {
            if (!onCursorChange || !update.selectionSet) return;
            const head = update.state.selection.main.head;
            const line = update.state.doc.lineAt(head);
            onCursorChange(line.number, head - line.from + 1);
          }}
          onChange={onChange}
        />
      </Box>
    </Box>
  );
});

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
