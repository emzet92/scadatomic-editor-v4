import { oneDark } from "@codemirror/theme-one-dark";
import CodeMirror from "@uiw/react-codemirror";
import { useMemo } from "react";
import type { ComponentApiDescription } from "../../component-api";
import { createCtxAutocompleteExtension } from "./ctx-completions";

type JavaScriptCodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  components: ComponentApiDescription[];
  selfComponent?: ComponentApiDescription | undefined;
};

export function JavaScriptCodeEditor({
  value,
  onChange,
  components,
  selfComponent,
}: JavaScriptCodeEditorProps) {
  const autocompleteExtension = useMemo(
    () => createCtxAutocompleteExtension(components, selfComponent),
    [components, selfComponent]
  );

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-3 py-2">
        <div className="text-xs font-medium text-zinc-300">JavaScript</div>
        <div className="text-[11px] text-zinc-500">
          ctx autocomplete · component API
        </div>
      </div>

      <CodeMirror
        value={value}
        height="420px"
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
