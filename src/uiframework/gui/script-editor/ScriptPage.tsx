import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProjectById } from "../../../http/projects-api";
import {
  getMockScript,
  saveMockScript,
} from "../../../mock/mock-script-store";
import {
  describeComponentApi,
  type ComponentApiDescription,
} from "../../component-api";
import type { UiDocument } from "../../core/document";
import { HandlerTree } from "./HandlerTree";
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
  const [document, setDocument] = useState<UiDocument | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const dirty = code !== savedCode;
  const componentApi = document
    ? Object.values(document.nodes).map(describeComponentApi)
    : [];

  useEffect(() => {
    let cancelled = false;

    async function loadDocument() {
      try {
        const project = await getProjectById(projectId);
        if (!cancelled) {
          setDocument(project.tree);
          setApiError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setApiError(
            error instanceof Error ? error.message : "Failed to load component API"
          );
        }
      }
    }

    loadDocument();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  function save() {
    saveMockScript(projectId, scriptId, code);
    setSavedCode(code);
  }

  function selectHandler(handlerId: string) {
    if (handlerId === scriptId) {
      return;
    }

    if (dirty) {
      saveMockScript(projectId, scriptId, code);
    }

    navigate(
      `/project/${encodeURIComponent(projectId)}/scripts/${encodeURIComponent(handlerId)}`
    );
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

      <div className="min-h-0 flex-1 flex">
        <HandlerTree
          document={document}
          currentScriptId={scriptId}
          onSelect={selectHandler}
        />

        <main className="min-w-0 flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-4">
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

            <JavaScriptCodeEditor
              value={code}
              onChange={setCode}
              components={componentApi}
            />

            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                ctx API
              </div>
              <div className="mt-3 grid gap-2 text-sm font-mono text-zinc-700 sm:grid-cols-2">
                <code>ctx.sourceNodeId</code>
                <code>ctx.eventName</code>
                <code>ctx.state.get(key, fallback?)</code>
                <code>ctx.state.set(key, value)</code>
                <code>ctx.ui.ComponentName</code>
                <code>ctx.ui.ComponentName.prop = value</code>
                <code>ctx.ui.ComponentName.setProp(prop, value)</code>
                <code>ctx.ui.ComponentName.setColor(color)</code>
                <code>ctx.emit(name, payload?)</code>
                <code>ctx.random.color()</code>
                <code>ctx.random.number(min, max)</code>
                <code>ctx.log(...args)</code>
              </div>
              <p className="mt-3 text-xs text-amber-700">
                Prototype only: handlers run with new Function and are not sandboxed.
              </p>
            </div>

            <ComponentApiSection components={componentApi} error={apiError} />
          </div>
        </main>
      </div>
    </div>
  );
}

function ComponentApiSection({
  components,
  error,
}: {
  components: ComponentApiDescription[];
  error: string | null;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Component API
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Generated from the current project. Component names are the public API symbols.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500">
          {components.length} components
        </span>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : components.length === 0 ? (
        <div className="mt-4 text-sm text-zinc-400">Loading component API…</div>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {components.map((component) => (
            <ComponentApiCard key={component.nodeId} component={component} />
          ))}
        </div>
      )}
    </section>
  );
}

function ComponentApiCard({
  component,
}: {
  component: ComponentApiDescription;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-zinc-200 bg-zinc-50/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <code className="truncate text-sm font-semibold text-zinc-900">
          ctx.ui.{component.name}
        </code>
        <span className="shrink-0 rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-xs font-medium text-zinc-500">
          {component.type}
        </span>
      </div>

      <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        Read only
      </div>
      <div className="mt-1 flex flex-wrap gap-1.5 text-xs font-mono text-zinc-600">
        <code>.id</code>
        <code>.name</code>
        <code>.type</code>
      </div>

      <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        Props · read / write
      </div>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {component.properties.map((property) => (
          <code
            key={property.name}
            className="rounded border border-zinc-200 bg-white px-1.5 py-1 text-xs text-zinc-700"
            title={`ctx.ui.${component.name}.${property.name}`}
          >
            .{property.name}
            <span className="ml-1 text-zinc-400">:{property.valueType}</span>
          </code>
        ))}
      </div>

      <div className="mt-3 space-y-1 text-xs font-mono text-zinc-600">
        <div>.setProp(prop, value)</div>
        {component.colorProperty ? (
          <div>.setColor(color) → {component.colorProperty}</div>
        ) : null}
      </div>

      {component.properties.length > 0 ? (
        <div className="mt-3 rounded-md bg-zinc-900 px-2.5 py-2 text-xs font-mono text-zinc-100 overflow-x-auto">
          ctx.ui.{component.name}.{component.properties[0]?.name} = value;
        </div>
      ) : null}
    </div>
  );
}
