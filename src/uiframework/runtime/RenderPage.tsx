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
import { RuntimeModalLayer } from "./RuntimeModalLayer";
import { getComponentVariantProps } from "../component-variants";
import { hydrateRuntimeTagState } from "../runtime-tag-bridge";
import { configureProjectReactiveRuntime } from "../reactive-runtime-session";
import {
  getReactiveNodeProps,
  getReactiveNodeVariant,
  useProjectReactiveUiRevision,
} from "../reactive-ui-state";
import { resolveConfiguredThemeId, type SystemColorScheme } from "../design-system/theme-config";
import {
  getProjectRuntimeThemeSnapshot,
  useProjectRuntimeThemeRevision,
} from "./theme-runtime-state";

export function RenderPage() {
  const { projectId, "*": routePath = "" } = useParams();
  const routerNavigate = useNavigate();
  const [document, setDocument] = useState<UiDocument>(() =>
    createEmptyUiDocument()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateToastVisible, setUpdateToastVisible] = useState(false);

  // Derived UI changes live outside the persisted document. This subscription
  // repaints the renderer without mutating document props.
  useProjectReactiveUiRevision(projectId);
  useProjectRuntimeThemeRevision(projectId);
  const systemColorScheme = useSystemColorScheme();

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


  useEffect(() => {
    if (!projectId || loading || error) return undefined;
    return configureProjectReactiveRuntime(projectId, document);
  }, [document, error, loading, projectId]);

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

  const activeThemeId = resolveConfiguredThemeId({
    appearance: document.appearance,
    designSystem: document.designSystem,
    runtimeThemeId: projectId
      ? getProjectRuntimeThemeSnapshot(projectId).themeId
      : undefined,
    systemColorScheme,
  });

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
            themeId={activeThemeId}
            decorateComponentInternals
            resolveNode={(node, context) => {
              if (!projectId) return node;

              const runtimeNodeId = context.componentInstanceId
                ? `${context.componentInstanceId}::${node.id}`
                : node.id;
              const runtimeProps = getMockRuntimeNodeProps(projectId, runtimeNodeId);
              const reactiveProps = getReactiveNodeProps(projectId, runtimeNodeId);
              const reactiveVariantName = getReactiveNodeVariant(projectId, runtimeNodeId);
              const runtimeVariantName = getMockRuntimeNodeVariant(
                projectId,
                runtimeNodeId
              );
              const requestedVariant = reactiveVariantName ?? runtimeVariantName;
              const variantName =
                requestedVariant && node.variants?.[requestedVariant]
                  ? requestedVariant
                  : node.defaultVariant;
              const variantProps = getComponentVariantProps(node, variantName);
              const effectiveReactiveProps = normalizeReactiveProps(
                { ...(node.props ?? {}), ...variantProps, ...runtimeProps },
                reactiveProps
              );

              if (
                Object.keys(runtimeProps).length === 0 &&
                Object.keys(reactiveProps).length === 0 &&
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
                  ...effectiveReactiveProps,
                },
              };
            }}
            decorateProps={(node, context) => {
              const runtimeNodeId = context.componentInstanceId
                ? `${context.componentInstanceId}::${node.id}`
                : node.id;
              const baseProps = {
                "data-node-id": runtimeNodeId,
                "data-scadatomic-type": node.type,
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

      {projectId ? (
        <RuntimeModalLayer
          projectId={projectId}
          document={document}
          pageId={currentPage.id}
          themeId={activeThemeId}
        />
      ) : null}

      {updateToastVisible && (
        <div className="fixed right-5 bottom-5 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-700 shadow-lg">
          Screen updated
        </div>
      )}
    </div>
  );
}

function useSystemColorScheme(): SystemColorScheme {
  const [scheme, setScheme] = useState<SystemColorScheme>(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setScheme(media.matches ? "dark" : "light");
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  return scheme;
}

function normalizeReactiveProps(
  baseProps: Record<string, unknown>,
  reactiveProps: Record<string, unknown>
) {
  const next = { ...reactiveProps };

  if (Object.prototype.hasOwnProperty.call(next, "enabled")) {
    next.disabled = !next.enabled;
    delete next.enabled;
  }

  if (Object.prototype.hasOwnProperty.call(next, "visible")) {
    const visible = Boolean(next.visible);
    const baseStyle = isRecord(baseProps.style) ? baseProps.style : {};
    const reactiveStyle = isRecord(next.style) ? next.style : {};
    next.style = {
      ...baseStyle,
      ...reactiveStyle,
      ...(visible ? {} : { display: "none" }),
    };
    delete next.visible;
  }

  return next;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export default RenderPage;
