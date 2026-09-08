import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getMockScript,
  saveMockScript,
} from "../../../mock/mock-script-store";
import { JavaScriptCodeEditor } from "./JavaScriptCodeEditor";

export function ScriptPage() {
  const { scriptId, projectId } = useParams();
  const resolvedProjectId = projectId ?? "demo";
  const resolvedScriptId = scriptId ?? "default";

  return (
    <ScriptEditor
      key={`${resolvedProjectId}:${resolvedScriptId}`}
      projectId={resolvedProjectId}
      scriptId={resolvedScriptId}
    />
  );
}

function ScriptEditor({
  projectId,
  scriptId,
}: {
  projectId: string;
  scriptId: string;
}) {
  const navigate = useNavigate();
  const initialScript = getMockScript(projectId, scriptId);
  const [code, setCode] = useState(initialScript.code);
  const [savedCode, setSavedCode] = useState(initialScript.code);

  const dirty = code !== savedCode;

  function save() {
    saveMockScript(projectId, scriptId, code);
    setSavedCode(code);
  }

  return (
    <div className="h-screen bg-slate-50 text-zinc-900 flex flex-col">
      <header className="h-16 shrink-0 border-b border-zinc-200 bg-white px-6 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-zinc-900">Script Editor</div>
          <div className="text-xs text-zinc-500">
            JavaScript prototype handlers · localStorage
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">
            {dirty ? "Unsaved changes" : "Saved locally"}
          </span>

          <button
            className="h-9 px-4 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-sm font-medium text-zinc-700 transition"
            onClick={() => {
              navigate(`/project/${encodeURIComponent(projectId)}`);
            }}
          >
            Back to editor
          </button>

          <button
            className="h-9 px-4 rounded-md bg-sky-600 hover:bg-sky-500 text-sm font-medium text-white transition"
            onClick={save}
          >
            Save Script
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Handler ID
            </div>
            <div className="mt-1 text-sm font-mono text-zinc-600">
              {scriptId}
            </div>

            <h1 className="mt-4 text-xl font-semibold text-zinc-900">
              Runtime Handler
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Prototype-only JavaScript executed locally with a SCADAtomic context API.
            </p>
          </div>

          <JavaScriptCodeEditor value={code} onChange={setCode} />

          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              ctx API
            </div>
            <div className="mt-3 grid gap-2 text-sm font-mono text-zinc-700 sm:grid-cols-2">
              <code>ctx.sourceNodeId</code>
              <code>ctx.eventName</code>
              <code>ctx.ui.setProp(nodeId, prop, value)</code>
              <code>ctx.ui.setColor(nodeId, color)</code>
              <code>ctx.emit(name, payload?)</code>
              <code>ctx.random.color()</code>
              <code>ctx.random.number(min, max)</code>
              <code>ctx.log(...args)</code>
            </div>
            <p className="mt-3 text-xs text-amber-700">
              Prototype only: handlers run with new Function and are not sandboxed.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
