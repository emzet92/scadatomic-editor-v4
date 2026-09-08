import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";

type JavaScriptCodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function JavaScriptCodeEditor({
  value,
  onChange,
}: JavaScriptCodeEditorProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-3 py-2">
        <div className="text-xs font-medium text-zinc-300">JavaScript</div>
        <div className="text-[11px] text-zinc-500">prototype handler</div>
      </div>

      <CodeMirror
        value={value}
        height="360px"
        theme={oneDark}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          autocompletion: true,
        }}
        onChange={onChange}
      />
    </div>
  );
}
