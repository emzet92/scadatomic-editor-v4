import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProjectById } from "../../http/projects-api";
import { getMockRuntimeNodeVariant } from "../../mock/mock-runtime-ui-state";
import {
  createEmptyUiDocument,
  getPage,
  type UiDocument,
} from "../core/document";
import { RenderNode } from "../Renderer";
import {
  buildNavigationTree,
  resolveNavigationPath,
} from "../navigation/navigation";
import { NavigationRuntimeProvider } from "../navigation/navigation-context";
import { runtimeRegistry } from "../registry/runtime-registry";
import { RuntimeProvider } from "../runtime-provider";
import { getComponentVariantProps } from "../component-variants";

export function RenderPage() {
  const { projectId, "*": routePath = "" } = useParams();
  const routerNavigate = useNavigate();
  const [document, setDocument] = useState<UiDocument>(() =>
    createEmptyUiDocument()
  );
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
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
          setCurrentPageId(project.tree.startPageId);
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

  useEffect(() => {
    if (loading) return;
    const target = resolveNavigationPath(document, routePath);
    if (target) {
      setCurrentPageId(target.pageId);
    } else if (!currentPageId || !document.pages[currentPageId]) {
      setCurrentPageId(document.startPageId);
    }
  }, [routePath, document, currentPageId, loading]);

  const navigateTo = useCallback(
    (path: string) => {
      if (!projectId) return;
      const target = resolveNavigationPath(document, path);
      if (!target) {
        console.warn(`[runtime] Unknown navigation path: ${path}`);
        return;
      }

      setCurrentPageId(target.pageId);
      const encodedPath = target.path
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/");
      routerNavigate(`/render/${encodeURIComponent(projectId)}/${encodedPath}`);
    },
    [document, projectId, routerNavigate]
  );

  const navigationItems = useMemo(
    () => buildNavigationTree(document),
    [document]
  );

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

  const currentPage = getPage(document, currentPageId ?? document.startPageId);
  if (!document.nodes[currentPage.rootId]) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950 text-zinc-400 text-sm">
        Empty page
      </div>
    );
  }

  return (
    <div className="min-h-screen min-w-full overflow-auto bg-zinc-950">
      <RuntimeProvider
        projectId={projectId}
        setDocument={setDocument}
        onNavigate={navigateTo}
        onScreenUpdated={showUpdateToast}
        onNodeUpdated={showUpdateToast}
      />

      <NavigationRuntimeProvider
        value={{
          items: navigationItems,
          currentPageId: currentPage.id,
          navigateTo,
        }}
      >
        <div className="mx-auto w-fit">
          <RenderNode
            id={currentPage.rootId}
            document={document}
            registry={runtimeRegistry}
            decorateComponentInternals
            decorateProps={(node, context) => {
              const runtimeNodeId = context.componentInstanceId
                ? `${context.componentInstanceId}::${node.id}`
                : node.id;
              const runtimeVariantName = projectId
                ? getMockRuntimeNodeVariant(projectId, runtimeNodeId)
                : undefined;
              const runtimeVariantProps =
                runtimeVariantName && node.variants?.[runtimeVariantName]
                  ? getComponentVariantProps(node, runtimeVariantName)
                  : {};
              const baseProps = {
                ...runtimeVariantProps,
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
                  runtimePageId: currentPage.id,
                };
              }

              return baseProps;
            }}
          />
        </div>
      </NavigationRuntimeProvider>

      {updateToastVisible && (
        <div className="fixed right-5 bottom-5 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-700 shadow-lg">
          Screen updated
        </div>
      )}
    </div>
  );
}

export default RenderPage;
