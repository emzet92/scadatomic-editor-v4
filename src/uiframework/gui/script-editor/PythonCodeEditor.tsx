// gui/code-editor/PythonCodeEditor.tsx

import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";

type PythonCodeEditorProps = {
    value: string;
    onChange: (value: string) => void;
};

export function PythonCodeEditor({
    value,
    onChange,
}: PythonCodeEditorProps) {
    return (
        <div
            className="
        overflow-hidden
        rounded-xl
        border
        border-zinc-800
        bg-zinc-950
        shadow-sm
      "
        >
            <div
                className="
          flex
          items-center
          justify-between
          border-b
          border-zinc-800
          bg-zinc-900
          px-3
          py-2
        "
            >
                <div className="text-xs font-medium text-zinc-300">
                    Python Script
                </div>

                <div className="text-[11px] text-zinc-500">
                    runtime handler
                </div>
            </div>

            <CodeMirror
                value={value}
                height="320px"
                theme={oneDark}
                extensions={[python()]}
                basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    highlightActiveLine: true,
                    highlightSelectionMatches: true,
                    autocompletion: true,
                }}
                onChange={(nextValue) => {
                    onChange(nextValue);
                }}
            />
        </div>
    );
}