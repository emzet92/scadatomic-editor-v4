import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProjectById, updateProject } from "../../../http/projects-api";
import {
  ensureMockScript,
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
  const [projectName, setProjectName] = useState("");
  const [projectRevision, setProjectRevision] = useState<number | undefined>();
  const [apiError, setApiError] = useState<string | null>(null);

  const dirty = code !== savedCode;
  const componentApi = document
    ? Object.values(document.nodes).map(describeComponentApi)
    : [];
  const scriptSelection = document
    ? findScriptSelection(document, scriptId, componentApi)
    : null;
  const selfComponent =
    scriptSelection?.kind === "method" ? scriptSelection.component : undefined;

  useEffect(() => {
    let cancelled = false;

    async function loadDocument() {
      try {
        const project = await getProjectById(projectId);
        if (!cancelled) {
          setDocument(project.tree);
          setProjectName(project.name);
          setProjectRevision(project.revision);
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

  function selectScript(nextScriptId: string) {
    if (nextScriptId === scriptId) {
      return;
    }

    if (dirty) {
      saveMockScript(projectId, scriptId, code);
    }

    navigate(
      `/project/${encodeURIComponent(projectId)}/scripts/${encodeURIComponent(nextScriptId)}`
    );
  }

  async function persistMethod(
    nodeId: string,
    methodName: string,
    scriptId: string | null
  ) {
    if (!document) {
      throw new Error("Component API is not loaded yet.");
    }

    const node = document.nodes[nodeId];
    if (!node) {
      throw new Error("Component no longer exists in the document.");
    }

    const methods = { ...(node.methods ?? {}) };
    if (scriptId) {
      methods[methodName] = { scriptId };
    } else {
      delete methods[methodName];
    }

    const nextNode = {
      ...node,
      ...(Object.keys(methods).length > 0 ? { methods } : { methods: undefined }),
    };

    const nextDocument: UiDocument = {
      ...document,
      nodes: {
        ...document.nodes,
        [nodeId]: nextNode,
      },
    };

    const saved = await updateProject(
      projectId,
      {
        name: projectName || projectId,
        tree: nextDocument,
      },
      projectRevision
    );

    setDocument(saved.tree);
    setProjectName(saved.name);
    setProjectRevision(saved.revision);
    return saved.tree.nodes[nodeId];
  }

  async function addComponentMethod(nodeId: string, methodName: string) {
    const node = document?.nodes[nodeId];
    if (!node) {
      throw new Error("Component no longer exists in the document.");
    }

    const methodScriptId = `component-method.${crypto.randomUUID()}`;
    await persistMethod(nodeId, methodName, methodScriptId);

    ensureMockScript(
      projectId,
      methodScriptId,
      `// Component method: ${node.name}.${methodName}()\n// self === ctx.ui.${node.name}\n\nctx.log("${node.name}.${methodName}");`
    );

    return methodScriptId;
  }

  async function removeComponentMethod(nodeId: string, methodName: string) {
    await persistMethod(nodeId, methodName, null);
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
          onSelect={selectScript}
          onAddMethod={addComponentMethod}
          onRemoveMethod={removeComponentMethod}
        />

        <main className="min-w-0 flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                {scriptSelection?.kind === "method" ? "Method Script ID" : "Handler ID"}
              </div>
              <div className="mt-1 text-sm font-mono text-zinc-600">
                {scriptId}
              </div>

              <h1 className="mt-4 text-xl font-semibold text-zinc-900">
                {scriptSelection?.kind === "method"
                  ? `${scriptSelection.component.name}.${scriptSelection.memberName}()`
                  : "Runtime Handler"}
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                {scriptSelection?.kind === "method"
                  ? "Component method executed synchronously inside the current handler context."
                  : "Prototype-only JavaScript executed locally with a SCADAtomic context API."}
              </p>
            </div>

            <JavaScriptCodeEditor
              value={code}
              onChange={setCode}
              components={componentApi}
              selfComponent={selfComponent}
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
                {scriptSelection?.kind === "method" ? (
                  <>
                    <code>self.prop = value</code>
                    <code>self.otherMethod()</code>
                    <code>args[0], args[1], ...</code>
                  </>
                ) : null}
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
    </div>
  );
}


type ScriptSelection =
  | {
      kind: "handler";
      component: ComponentApiDescription;
      memberName: string;
    }
  | {
      kind: "method";
      component: ComponentApiDescription;
      memberName: string;
    };

function findScriptSelection(
  document: UiDocument,
  scriptId: string,
  components: ComponentApiDescription[]
): ScriptSelection | null {
  const componentByNodeId = new Map(
    components.map((component) => [component.nodeId, component])
  );

  for (const node of Object.values(document.nodes)) {
    const component = componentByNodeId.get(node.id);
    if (!component) {
      continue;
    }

    for (const [eventName, handler] of Object.entries(node.events ?? {})) {
      if (handler.handlerId === scriptId) {
        return { kind: "handler", component, memberName: eventName };
      }
    }

    for (const [methodName, method] of Object.entries(node.methods ?? {})) {
      if (method.scriptId === scriptId) {
        return { kind: "method", component, memberName: methodName };
      }
    }
  }

  return null;
}
