import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProjectById } from "../../http/projects-api";
import { createEmptyUiDocument, type UiDocument } from "../core/document";
import { RenderNode } from "../Renderer";
import { runtimeRegistry } from "../registry/runtime-registry";
import { RuntimeProvider } from "../runtime-provider";

export function RenderPage() {
  const { projectId } = useParams();
  const [document, setDocument] = useState<UiDocument>(() =>
    createEmptyUiDocument()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateToastVisible, setUpdateToastVisible] = useState(false);

  const showUpdateToast = useCallback(() => {
    setUpdateToastVisible(true);
    window.setTimeout(() => setUpdateToastVisible(false), 1800);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProject() {
      if (!projectId) {
        setError("Missing project id");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const project = await getProjectById(projectId);
        if (!cancelled) {
          setDocument(project.tree);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error ? error.message : "Failed to load project"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProject();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950 text-zinc-400 text-sm">
        Loading runtime...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950 text-red-400 text-sm">
        {error}
      </div>
    );
  }

  if (!document.nodes[document.rootId]) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950 text-zinc-400 text-sm">
        Empty project
      </div>
    );
  }

  return (
    <div className="min-h-screen min-w-full overflow-auto bg-zinc-950">
      <RuntimeProvider
        projectId={projectId}
        setDocument={setDocument}
        onScreenUpdated={showUpdateToast}
        onNodeUpdated={showUpdateToast}
      />

      <div className="mx-auto w-fit">
        <RenderNode
          id={document.rootId}
          document={document}
          registry={runtimeRegistry}
          decorateComponentInternals
          decorateProps={(node, context) => {
            const runtimeNodeId = context.componentInstanceId
              ? `${context.componentInstanceId}::${node.id}`
              : node.id;
            const baseProps = {
              "data-node-id": runtimeNodeId,
            };

            if (node.type === "Text" || node.type === "Chart") {
              return {
                ...baseProps,
                runtimeBindings: node.bindings,
              };
            }

            if (node.type === "Button") {
              return {
                ...baseProps,
                runtimeEvents: node.events,
                runtimeProjectId: projectId,
              };
            }

            return baseProps;
          }}
        />
      </div>

      {updateToastVisible && (
        <div className="fixed right-5 bottom-5 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-700 shadow-lg">
          Screen updated
        </div>
      )}
    </div>
  );
}

export default RenderPage;
