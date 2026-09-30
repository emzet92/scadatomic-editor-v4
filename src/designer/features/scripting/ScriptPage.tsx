import {
  Box,
  ChevronDownIcon,
  MenuIcon,
  PlayIcon,
  Pressable,
  SearchIcon,
  SettingsIcon,
} from "../../../shared/ui";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getProjectById,
  subscribeProject,
  updateProject,
} from "../../../project/api/projects-api";
import {
  ensureMockScript,
  getMockScript,
  saveMockScript,
} from "../../../mock/mock-script-store";
import {
  describeComponentApi,
  type ComponentApiDescription,
} from "../../../visualization/components/component-api";
import {
  describeComponentScriptInternalApi,
  describeComponentScriptSelfApi,
} from "../../../visualization/components/component-script-api";
import { buildNavigationTree } from "../../../runtime/navigation/navigation";
import { setOptionalRecordEntry } from "../../../project/model/optional-record";
import type {
  ScopedMethodRef,
  UiComponentDefinition,
  UiDocument,
  UiNode,
} from "../../../project/model/document";
import { WorkspaceHeader } from "../../../shared/ui/organisms/WorkspaceHeader";
import { HandlerTree } from "./HandlerTree";
import {
  JavaScriptCodeEditor,
  type JavaScriptCodeEditorHandle,
} from "./JavaScriptCodeEditor";
import {
  ScriptConsolePanel,
  type ScriptConsoleEntry,
} from "./ScriptConsolePanel";
import {
  ScriptInspectorPanel,
  type ScriptInspectorModel,
} from "./ScriptInspectorPanel";
import { CodeGraphView } from "../../../scripting/execution/visualization/CodeGraphView";
import { ExecutionGraphView } from "../../../scripting/execution/visualization/ExecutionGraphView";
import { ExecutionPlanView } from "../../../scripting/execution/visualization/ExecutionPlanView";

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
  const [view, setView] = useState<"code" | "ast" | "plan" | "execution">("code");
  const editorRef = useRef<JavaScriptCodeEditorHandle>(null);
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const [problems, setProblems] = useState<string[]>([]);
  const [consoleEntries, setConsoleEntries] = useState<ScriptConsoleEntry[]>(() => [
    {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      level: "info",
      message: `Script loaded: ${scriptId}`,
    },
  ]);

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
        ? describeComponentScriptSelfApi(componentScriptDefinition, document ?? undefined)
        : undefined;
  const internalComponents =
    document && componentScriptDefinition
      ? describeComponentScriptInternalApi(document, componentScriptDefinition)
      : [];
  const supportsExecutionGraph =
    scriptSelection?.kind === "handler" ||
    scriptSelection?.kind === "componentHandler";

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

  function appendConsole(
    level: ScriptConsoleEntry["level"],
    message: string
  ) {
    setConsoleEntries((entries) => [
      ...entries.slice(-199),
      {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        level,
        message,
      },
    ]);
  }

  function save() {
    saveMockScript(projectId, scriptId, code);
    setSavedCode(code);
    appendConsole("success", `Saved script: ${scriptId}`);
  }

  function validateScript() {
    try {
      // Compile only. The real handler still executes through the runtime adapter.
      // eslint-disable-next-line no-new-func
      new Function(`"use strict";\n${code}`);
      setProblems([]);
      appendConsole("success", "Syntax check passed. Script is ready for runtime execution.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setProblems([message]);
      appendConsole("error", `Syntax error: ${message}`);
    }
  }

  function formatScript() {
    editorRef.current?.format();
    appendConsole("info", "Applied JavaScript indentation from the CodeMirror language service.");
  }

  function findInScript() {
    editorRef.current?.find();
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
      return {
        ...node,
        methods: setOptionalRecordEntry(
          node.methods,
          methodName,
          methodScriptId ? { scriptId: methodScriptId } : null
        ),
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

    const nextDocument: UiDocument = {
      ...document,
      components: {
        ...(document.components ?? {}),
        [componentId]: {
          ...definition,
          methods: setOptionalRecordEntry(
            definition.methods,
            methodName,
            method
          ),
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

  const scriptTitle = getScriptTitle(scriptSelection);
  const scriptDescription = getScriptDescription(scriptSelection);
  const inspectorModel: ScriptInspectorModel = {
    scriptId,
    title: scriptTitle,
    typeLabel: getScriptTypeLabel(scriptSelection),
    description: scriptDescription,
    componentName: getScriptComponentName(scriptSelection),
    sourceNodeId: getScriptSourceNodeId(scriptSelection),
    eventName:
      scriptSelection?.kind === "handler" ||
      scriptSelection?.kind === "componentHandler"
        ? scriptSelection.memberName
        : undefined,
    projectId,
  };

  return (
    <Box className="flex h-screen flex-col bg-zinc-100 text-zinc-900">
      <WorkspaceHeader
        active="scripts"
        projectId={projectId}
        scriptId={scriptId}
        title="Script Editor"
        subtitle="JavaScript handlers + generated component API"
        onBeforeNavigate={() => preserveDirtyScript()}
        actions={
          <>
            <span className="flex items-center gap-1.5 text-xs text-[var(--editor-text-muted)]">
              <span
                className={`h-2 w-2 rounded-full ${
                  dirty ? "bg-amber-400" : "bg-emerald-500"
                }`}
              />
              {dirty ? "Unsaved changes" : "Saved locally"}
            </span>

            <Pressable
              className="h-9 rounded-md bg-[var(--editor-accent)] px-4 text-sm font-medium text-white transition hover:bg-[var(--editor-accent-hover)]"
              onClick={save}
            >
              Save Script
            </Pressable>
          </>
        }
      />

      <Box className="flex min-h-0 flex-1 overflow-hidden">
        <HandlerTree
          document={document}
          currentScriptId={scriptId}
          onSelect={selectScript}
          onAddMethod={addComponentMethod}
          onRemoveMethod={removeComponentMethod}
          onAddDefinitionMethod={addDefinitionMethod}
          onRemoveDefinitionMethod={removeDefinitionMethod}
        />

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
          <Box className="shrink-0 border-b border-zinc-200 bg-white px-4 py-3">
            {apiError ? (
              <Box className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {apiError}
              </Box>
            ) : null}

            <Box className="flex items-start justify-between gap-4">
              <Box className="min-w-0">
                <Box className="mb-1 flex min-w-0 items-center gap-1.5 text-[11px] text-zinc-400">
                  <span>Component Scripts</span>
                  <span>›</span>
                  <span className="truncate">{getScriptComponentName(scriptSelection) ?? "Global"}</span>
                  <span>›</span>
                  <span className="truncate font-mono text-zinc-600">{scriptId}</span>
                </Box>
                <Box className="flex items-center gap-2">
                  <h1 className="truncate text-xl font-semibold tracking-tight text-zinc-950">
                    {scriptTitle}
                  </h1>
                  <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-indigo-600">
                    JS
                  </span>
                </Box>
                <p className="mt-1 max-w-3xl truncate text-xs text-zinc-500">
                  {scriptDescription}
                </p>
              </Box>

              <Box className="flex shrink-0 items-center gap-2">
                <Pressable
                  type="button"
                  className="flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
                >
                  {scriptId}
                  <ChevronDownIcon size={12} className="text-zinc-400" />
                </Pressable>
                <Pressable
                  type="button"
                  onClick={validateScript}
                  className="flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  <PlayIcon size={13} />
                  Run / Test
                </Pressable>
                <Pressable
                  type="button"
                  onClick={formatScript}
                  className="flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
                >
                  <SettingsIcon size={13} />
                  Format
                </Pressable>
                <Pressable
                  type="button"
                  onClick={findInScript}
                  className="flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
                >
                  <SearchIcon size={13} />
                  Find
                </Pressable>
                <Pressable
                  type="button"
                  aria-label="More script actions"
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-500 shadow-sm hover:bg-zinc-50 hover:text-zinc-800"
                >
                  <MenuIcon size={14} />
                </Pressable>
              </Box>
            </Box>

            <Box className="mt-3 flex items-center gap-1">
              <ScriptViewTab active={view === "code"} onClick={() => setView("code")}>
                Code
              </ScriptViewTab>
              <ScriptViewTab active={view === "ast"} onClick={() => setView("ast")}>
                Code Graph
              </ScriptViewTab>
              {supportsExecutionGraph ? (
                <>
                  <ScriptViewTab active={view === "plan"} onClick={() => setView("plan")}>
                    Execution Plan
                  </ScriptViewTab>
                  <ScriptViewTab
                    active={view === "execution"}
                    onClick={() => setView("execution")}
                  >
                    Execution Graph
                  </ScriptViewTab>
                </>
              ) : null}
            </Box>
          </Box>

          {view === "code" ? (
            <>
              <Box className="min-h-0 flex-1 bg-zinc-950">
                <JavaScriptCodeEditor
                  ref={editorRef}
                  value={code}
                  onChange={setCode}
                  components={componentApi}
                  selfComponent={selfComponent}
                  internalComponents={internalComponents}
                  navigation={navigationTree}
                  modals={Object.values(document?.modals ?? {})}
                  projectData={document?.data}
                  height="100%"
                  onCursorChange={(line, column) => setCursor({ line, column })}
                />
              </Box>

              <ScriptConsolePanel
                entries={consoleEntries}
                problems={problems}
                eventName={inspectorModel.eventName}
                onClear={() => setConsoleEntries([])}
              />

              <Box className="flex h-7 shrink-0 items-center border-t border-zinc-200 bg-white px-3 text-[10px] text-zinc-500">
                <Box className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Ready
                </Box>
                <Box className="ml-auto flex items-center gap-4 font-mono">
                  <span>JavaScript</span>
                  <span>UTF-8</span>
                  <span>LF</span>
                  <span>Spaces: 2</span>
                  <span>Ln {cursor.line}, Col {cursor.column}</span>
                </Box>
              </Box>
            </>
          ) : (
            <Box className="min-h-0 flex-1 overflow-auto bg-zinc-50 p-4">
              {view === "ast" ? (
                <CodeGraphView source={code} />
              ) : view === "plan" && supportsExecutionGraph ? (
                <ExecutionPlanView projectId={projectId} handlerId={scriptId} />
              ) : supportsExecutionGraph ? (
                <ExecutionGraphView projectId={projectId} handlerId={scriptId} />
              ) : null}
            </Box>
          )}
        </main>

        <ScriptInspectorPanel model={inspectorModel} />
      </Box>
    </Box>
  );

}

function ScriptViewTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 font-medium transition ${
        active
          ? "bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]"
          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
      }`}
    >
      {children}
    </Pressable>
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


function getScriptTitle(selection: ScriptSelection | null) {
  if (!selection) return "Runtime Handler";

  switch (selection.kind) {
    case "method":
      return `${selection.component.name}.${selection.memberName}()`;
    case "componentMethod":
      return `${selection.definition.name}.${selection.memberName}()`;
    case "componentHandler":
      return `${selection.definition.name}.${selection.node.name}.${selection.memberName}`;
    case "handler":
      return `${selection.component.name}.${selection.memberName}`;
  }
}

function getScriptDescription(selection: ScriptSelection | null) {
  if (!selection) {
    return "Prototype-only JavaScript executed locally with the SCADAtomic context API.";
  }

  switch (selection.kind) {
    case "componentMethod":
      return "Encapsulated component method. self sees this component, internal sees its private tree, and ctx.ui sees scene-public APIs.";
    case "componentHandler":
      return "Private handler owned by the reusable component definition. self + internal are instance-scoped.";
    case "method":
      return "Component method executed synchronously inside the current handler context.";
    case "handler":
      return "Runtime event handler with generated component, navigation, modal, and tag APIs.";
  }
}

function getScriptTypeLabel(selection: ScriptSelection | null) {
  if (!selection) return "Runtime Handler";
  if (selection.kind === "method") return "Component Method";
  if (selection.kind === "componentMethod") return "Reusable Component Method";
  if (selection.kind === "componentHandler") return "Reusable Component Handler";
  return "Runtime Handler";
}

function getScriptComponentName(selection: ScriptSelection | null) {
  if (!selection) return undefined;
  if (selection.kind === "componentMethod") return selection.definition.name;
  if (selection.kind === "componentHandler") {
    return `${selection.definition.name} / ${selection.node.name}`;
  }
  return selection.component.name;
}

function getScriptSourceNodeId(selection: ScriptSelection | null) {
  if (!selection) return undefined;
  if (selection.kind === "componentMethod") return selection.definition.rootId;
  if (selection.kind === "componentHandler") return selection.node.id;
  return selection.component.nodeId;
}
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
  if (page) {
    const nodeIds = collectSubtreeNodeIds(document, page.rootId);
    return components.filter((component) => nodeIds.has(component.nodeId));
  }

  const modal = Object.values(document.modals ?? {}).find((candidate) =>
    subtreeContains(document, candidate.rootId, sourceNodeId)
  );
  if (modal) {
    const nodeIds = collectSubtreeNodeIds(document, modal.rootId);
    return components.filter((component) => nodeIds.has(component.nodeId));
  }

  return components;
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
