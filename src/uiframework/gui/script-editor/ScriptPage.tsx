import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getProjectById,
  subscribeProject,
  updateProject,
} from "../../../http/projects-api";
import {
  ensureMockScript,
  getMockScript,
  saveMockScript,
} from "../../../mock/mock-script-store";
import {
  describeComponentApi,
  type ComponentApiDescription,
} from "../../component-api";
import {
  describeComponentScriptInternalApi,
  describeComponentScriptSelfApi,
} from "../../component-script-api";
import { buildNavigationTree } from "../../navigation/navigation";
import type {
  ScopedMethodRef,
  UiComponentDefinition,
  UiDocument,
  UiNode,
} from "../../core/document";
import { WorkspaceHeader } from "../workspace/WorkspaceHeader";
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
  const allComponentApi = document
    ? Object.values(document.nodes).map((node) =>
        describeComponentApi(node, document)
      )
    : [];
  const navigationTree = document ? buildNavigationTree(document) : [];
  const scriptSelection = document
    ? findScriptSelection(document, scriptId, allComponentApi)
    : null;
  const componentApi = document
    ? getScopedComponentApi(document, scriptSelection, allComponentApi)
    : [];
  const componentScriptDefinition =
    scriptSelection?.kind === "componentMethod" ||
    scriptSelection?.kind === "componentHandler"
      ? scriptSelection.definition
      : undefined;
  const selfComponent =
    scriptSelection?.kind === "method"
      ? scriptSelection.component
      : componentScriptDefinition
        ? describeComponentScriptSelfApi(componentScriptDefinition)
        : undefined;
  const internalComponents =
    document && componentScriptDefinition
      ? describeComponentScriptInternalApi(document, componentScriptDefinition)
      : [];

  useEffect(() => {
    let cancelled = false;

    function applyProject(project: {
      tree: UiDocument;
      name: string;
      revision?: number;
    }) {
      if (cancelled) {
        return;
      }

      setDocument(project.tree);
      setProjectName(project.name);
      setProjectRevision(project.revision);
      setApiError(null);
    }

    const unsubscribe = subscribeProject(projectId, applyProject);

    async function loadDocument() {
      try {
        applyProject(await getProjectById(projectId));
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
      unsubscribe();
    };
  }, [projectId]);

  function save() {
    saveMockScript(projectId, scriptId, code);
    setSavedCode(code);
  }

  function preserveDirtyScript() {
    if (dirty) {
      saveMockScript(projectId, scriptId, code);
      setSavedCode(code);
    }
  }

  function selectScript(nextScriptId: string) {
    preserveDirtyScript();

    if (nextScriptId === scriptId) {
      return;
    }

    navigate(
      `/project/${encodeURIComponent(projectId)}/scripts/${encodeURIComponent(nextScriptId)}`
    );
  }

  async function persistNode(
    nodeId: string,
    updater: (node: UiNode) => UiNode
  ): Promise<UiNode> {
    if (!document) {
      throw new Error("Component API is not loaded yet.");
    }

    const node = document.nodes[nodeId];
    if (!node) {
      throw new Error("Component no longer exists in the document.");
    }

    const nextDocument: UiDocument = {
      ...document,
      nodes: {
        ...document.nodes,
        [nodeId]: updater(node),
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

    const savedNode = saved.tree.nodes[nodeId];
    if (!savedNode) {
      throw new Error("Saved component disappeared from the document.");
    }

    return savedNode;
  }

  async function persistMethod(
    nodeId: string,
    methodName: string,
    methodScriptId: string | null
  ) {
    return persistNode(nodeId, (node) => {
      const methods = { ...(node.methods ?? {}) };

      if (methodScriptId) {
        methods[methodName] = { scriptId: methodScriptId };
      } else {
        delete methods[methodName];
      }

      return {
        ...node,
        ...(Object.keys(methods).length > 0
          ? { methods }
          : { methods: undefined }),
      };
    });
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

  async function persistDefinitionMethod(
    componentId: string,
    methodName: string,
    method: ScopedMethodRef | null
  ) {
    if (!document) throw new Error("Component API is not loaded yet.");
    const definition = document.components?.[componentId];
    if (!definition) throw new Error("Component definition no longer exists.");

    const methods = { ...(definition.methods ?? {}) };
    if (method) methods[methodName] = method;
    else delete methods[methodName];

    const nextDocument: UiDocument = {
      ...document,
      components: {
        ...(document.components ?? {}),
        [componentId]: {
          ...definition,
          methods: Object.keys(methods).length > 0 ? methods : undefined,
        },
      },
    };

    const saved = await updateProject(
      projectId,
      { name: projectName || projectId, tree: nextDocument },
      projectRevision
    );

    setDocument(saved.tree);
    setProjectName(saved.name);
    setProjectRevision(saved.revision);
  }

  async function addDefinitionMethod(
    componentId: string,
    methodName: string,
    visibility: "public" | "private"
  ) {
    const definition = document?.components?.[componentId];
    if (!definition) throw new Error("Component definition no longer exists.");

    const methodScriptId = `component-definition-method.${crypto.randomUUID()}`;
    await persistDefinitionMethod(componentId, methodName, {
      scriptId: methodScriptId,
      visibility,
    });

    ensureMockScript(
      projectId,
      methodScriptId,
      `// ${visibility} method: ${definition.name}.${methodName}()\n// self     = current component API (private methods allowed here)\n// internal = private nodes owned by this component definition\n// ctx.ui   = public API of components on the current runtime scene\n\nctx.log("${definition.name}.${methodName}");`
    );

    return methodScriptId;
  }

  async function removeDefinitionMethod(componentId: string, methodName: string) {
    await persistDefinitionMethod(componentId, methodName, null);
  }

  return (
    <div className="h-screen bg-slate-50 text-zinc-900 flex flex-col">
      <WorkspaceHeader
        active="scripts"
        projectId={projectId}
        scriptId={scriptId}
        title="Script Editor"
        subtitle="JavaScript handlers + generated component API"
        onBeforeNavigate={() => preserveDirtyScript()}
        actions={
          <>
            <span className="text-xs text-[var(--editor-text-muted)]">
              {dirty ? "Unsaved changes" : "Saved locally"}
            </span>

            <button
              className="h-9 px-4 rounded-md bg-[var(--editor-accent)] hover:bg-[var(--editor-accent-hover)] text-sm font-medium text-white transition"
              onClick={save}
            >
              Save Script
            </button>
          </>
        }
      />

      <div className="min-h-0 flex-1 flex">
        <HandlerTree
          document={document}
          currentScriptId={scriptId}
          onSelect={selectScript}
          onAddMethod={addComponentMethod}
          onRemoveMethod={removeComponentMethod}
          onAddDefinitionMethod={addDefinitionMethod}
          onRemoveDefinitionMethod={removeDefinitionMethod}
        />

        <main className="min-w-0 flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-4">
            {apiError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {apiError}
              </div>
            ) : null}

            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                {scriptSelection?.kind === "handler" ||
                scriptSelection?.kind === "componentHandler"
                  ? "Handler ID"
                  : "Method Script ID"}
              </div>
              <div className="mt-1 text-sm font-mono text-zinc-600">
                {scriptId}
              </div>

              <h1 className="mt-4 text-xl font-semibold text-zinc-900">
                {scriptSelection?.kind === "method"
                  ? `${scriptSelection.component.name}.${scriptSelection.memberName}()`
                  : scriptSelection?.kind === "componentMethod"
                    ? `${scriptSelection.definition.name}.${scriptSelection.memberName}()`
                    : scriptSelection?.kind === "componentHandler"
                      ? `${scriptSelection.definition.name}.${scriptSelection.node.name}.${scriptSelection.memberName}`
                      : "Runtime Handler"}
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                {scriptSelection?.kind === "componentMethod"
                  ? "Encapsulated component method. self sees this component, internal sees its private tree, and ctx.ui sees only scene-public APIs."
                  : scriptSelection?.kind === "componentHandler"
                    ? "Private handler owned by the reusable component definition. self + internal are instance-scoped; ctx.ui stays scene-public."
                    : scriptSelection?.kind === "method"
                      ? "Component method executed synchronously inside the current handler context."
                      : "Prototype-only JavaScript executed locally with a SCADAtomic context API."}
              </p>
            </div>

            <JavaScriptCodeEditor
              value={code}
              onChange={setCode}
              components={componentApi}
              selfComponent={selfComponent}
              internalComponents={internalComponents}
              navigation={navigationTree}
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
                <code>ctx.ui.ComponentName.variant.enabled()</code>
                <code>ctx.ui.ComponentName.variant.current</code>
                <code>ctx.navigateTo("Page/SubPage")</code>
                <code>ctx.nav.Page1.go()</code>
                {scriptSelection?.kind === "method" ||
                scriptSelection?.kind === "componentMethod" ||
                scriptSelection?.kind === "componentHandler" ? (
                  <>
                    <code>self.prop = value</code>
                    <code>self.otherMethod()</code>
                    {componentScriptDefinition ? (
                      <>
                        <code>internal.Button1.disabled = true</code>
                        <code>internal.NestedComponent.publicMethod()</code>
                        <code>ctx.ui.OtherComponent.publicMethod()</code>
                      </>
                    ) : null}
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
    }
  | {
      kind: "componentMethod";
      definition: UiComponentDefinition;
      memberName: string;
    }
  | {
      kind: "componentHandler";
      definition: UiComponentDefinition;
      node: UiNode;
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

  for (const definition of Object.values(document.components ?? {})) {
    for (const [methodName, method] of Object.entries(definition.methods ?? {})) {
      if (method.scriptId === scriptId) {
        return {
          kind: "componentMethod",
          definition,
          memberName: methodName,
        };
      }
    }

    // Internal component handlers are real scripts too, but they live in the
    // private definition tree rather than document.nodes. Only enabled events
    // exist in node.events, so disabled handlers never appear here.
    for (const node of Object.values(definition.nodes)) {
      for (const [eventName, handler] of Object.entries(node.events ?? {})) {
        if (handler.handlerId === scriptId) {
          return {
            kind: "componentHandler",
            definition,
            node,
            memberName: eventName,
          };
        }
      }
    }
  }

  for (const node of Object.values(document.nodes)) {
    const component = componentByNodeId.get(node.id);
    if (!component) continue;

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

function getScopedComponentApi(
  document: UiDocument,
  selection: ScriptSelection | null,
  components: ComponentApiDescription[]
) {
  if (
    !selection ||
    selection.kind === "componentMethod" ||
    selection.kind === "componentHandler"
  ) {
    return components;
  }

  const sourceNodeId = selection.component.nodeId;
  const page = Object.values(document.pages).find((candidate) =>
    subtreeContains(document, candidate.rootId, sourceNodeId)
  );
  if (!page) return components;

  const nodeIds = collectSubtreeNodeIds(document, page.rootId);
  return components.filter((component) => nodeIds.has(component.nodeId));
}

function subtreeContains(
  document: UiDocument,
  rootId: string,
  candidateId: string
) {
  return collectSubtreeNodeIds(document, rootId).has(candidateId);
}

function collectSubtreeNodeIds(document: UiDocument, rootId: string) {
  const ids = new Set<string>();
  const stack = [rootId];

  while (stack.length > 0) {
    const nodeId = stack.pop();
    if (!nodeId || ids.has(nodeId)) continue;
    ids.add(nodeId);
    const node = document.nodes[nodeId];
    if (node) stack.push(...(node.children ?? []));
  }

  return ids;
}
