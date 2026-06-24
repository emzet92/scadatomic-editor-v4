import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import {
  RenderNode,
} from "../Renderer";

import { useEditorStore } from "../editor-store";
import { runtimeRegistry } from "../registry/runtime-registry";
import { RuntimeProvider } from "../runtime-provider";
import { getProjectById } from "../../http/projects-api";

export function RenderPage() {
  const { projectId } =
    useParams();

  const nodes =
    useEditorStore(
      (state) => state.nodes
    );

  const setNodes =
    useEditorStore(
      (state) => state.setNodes
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [updateToastVisible, setUpdateToastVisible] =
    useState(false);

  function showUpdateToast() {
    setUpdateToastVisible(true);

    window.setTimeout(
      () => {
        setUpdateToastVisible(false);
      },
      1800
    );
  }

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

        const project =
          await getProjectById(projectId);

        if (cancelled) {
          return;
        }

        setNodes(project.tree);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load project"
        );
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
  }, [
    projectId,
    setNodes,
  ]);

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

  if (!nodes.root) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950 text-zinc-400 text-sm">
        Empty project
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <RuntimeProvider
        onScreenUpdated={showUpdateToast}
        onNodeUpdated={showUpdateToast}
      />

      <div className="mx-auto max-w-7xl rounded-2xl bg-white p-8 shadow-2xl">
        <RenderNode
          id="root"
          nodes={nodes}
          registry={runtimeRegistry}
        />
      </div>

      {updateToastVisible && (
        <div
          className="
            fixed
            right-5
            bottom-5

            rounded-xl
            border
            border-emerald-200

            bg-white

            px-4
            py-3

            text-sm
            font-medium
            text-emerald-700

            shadow-lg
          "
        >
          Screen updated
        </div>
      )}
    </div>
  );
}

export default RenderPage;