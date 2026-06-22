import { useState } from "react";
import { useParams } from "react-router-dom";
import { PythonCodeEditor } from "./PythonCodeEditor";

export function ScriptPage() {
    const { scriptId } = useParams();

    const resolvedScriptId = scriptId ?? "default";

    const [code, setCode] = useState(`def handle(event):
    print("Runtime event:", event)

    if event["event"] == "startButton.Clicked":
        ui.randomColor("startButton")
`);

    return (
        <div className="h-screen bg-slate-50 text-zinc-900 flex flex-col">
            <header className="h-16 shrink-0 border-b border-zinc-200 bg-white px-6 flex items-center justify-between">
                <div>
                    <div className="text-sm font-semibold text-zinc-900">
                        Script Editor
                    </div>

                    <div className="text-xs text-zinc-500">
                        Python runtime handlers
                    </div>
                </div>

                <button
                    className="
            h-9
            px-4
            rounded-md
            bg-sky-600
            hover:bg-sky-500
            text-sm
            font-medium
            text-white
            transition
          "
                    onClick={() => {
                        console.log("Save script:", {
                            scriptId: resolvedScriptId,
                            code,
                        });
                    }}
                >
                    Save Script
                </button>
            </header>

            <main className="flex-1 overflow-auto p-6">
                <div className="max-w-5xl mx-auto space-y-4">
                    <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                            Script ID
                        </div>

                        <div className="mt-1 text-sm font-mono text-zinc-500">
                            {resolvedScriptId}
                        </div>

                        <h1 className="mt-4 text-xl font-semibold text-zinc-900">
                            Runtime Script
                        </h1>

                        <p className="mt-1 text-sm text-zinc-500">
                            Handle runtime events emitted from the UI.
                        </p>
                    </div>

                    <PythonCodeEditor
                        value={code}
                        onChange={setCode}
                    />
                </div>
            </main>
        </div>
    );
}