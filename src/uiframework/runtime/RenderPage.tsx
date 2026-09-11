import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProjectById } from "../../http/projects-api";
import {
  getMockRuntimeNodeProps,
  getMockRuntimeNodeVariant,
} from "../../mock/mock-runtime-ui-state";
import {
  createEmptyUiDocument,
  getPage,
  type UiDocument,
} from "../core/document";
import { RenderNode } from "../Renderer";
import { createPageRenderDocument } from "../core/page-layouts";
import {
  buildNavigationTree,
  resolveNavigationPath,
} from "../navigation/navigation";
import { NavigationRuntimeProvider } from "../navigation/NavigationRuntimeProvider";
import { runtimeRegistry } from "../registry/runtime-registry";
import { RuntimeProvider } from "../runtime-provider";
import { getComponentVariantProps } from "../component-variants";
import { hydrateRuntimeTagState } from "../runtime-tag-bridge";

export function RenderPage() {
  const { projectId, "*": routePath = "" } = useParams();
  const routerNavigate = useNavigate();
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
          hydrateRuntimeTagState(projectId, project.tree.data);
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

  const navigateTo = useCallback(
    (path: string) => {
      if (!projectId) return;
      const target = resolveNavigationPath(document, path);
      if (!target) {
        console.warn(`[runtime] Unknown navigation path: ${path}`);
        return;
      }

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

  const routeTarget = resolveNavigationPath(document, routePath);
  const currentPage = getPage(
    document,
    routeTarget?.pageId ?? document.startPageId
  );
  const renderDocument = createPageRenderDocument(document, currentPage.id);
  if (!renderDocument.nodes[renderDocument.rootId]) {
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
            id={renderDocument.rootId}
            document={renderDocument}
            registry={runtimeRegistry}
            decorateComponentInternals
            resolveNode={(node, context) => {
              if (!projectId) return node;

              const runtimeNodeId = context.componentInstanceId
                ? `${context.componentInstanceId}::${node.id}`
                : node.id;
              const runtimeProps = getMockRuntimeNodeProps(projectId, runtimeNodeId);
              const runtimeVariantName = getMockRuntimeNodeVariant(
                projectId,
                runtimeNodeId
              );
              const variantName =
                runtimeVariantName && node.variants?.[runtimeVariantName]
                  ? runtimeVariantName
                  : node.defaultVariant;
              const variantProps = getComponentVariantProps(node, variantName);

              if (
                Object.keys(runtimeProps).length === 0 &&
                Object.keys(variantProps).length === 0
              ) {
                return node;
              }

              return {
                ...node,
                props: {
                  ...(node.props ?? {}),
                  ...variantProps,
                  ...runtimeProps,
                },
              };
            }}
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
