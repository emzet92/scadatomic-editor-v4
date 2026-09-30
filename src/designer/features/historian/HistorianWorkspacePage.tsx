import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProjectById } from "../../../project/api/projects-api";
import { TagStore } from "../../../tags/model/TagStore";
import type { HistorianTagDescriptor } from "../../../historian";
import {
  HistorianExplorerView,
  HistorianLoggingView,
  indexedDbHistorianConfigRepository,
  indexedDbHistorianSampleRepository,
} from "../../../historian";
import {
  BackIcon,
  Button,
  DatabaseIcon,
  Inline,
  SettingsIcon,
  Stack,
  Text,
  Toolbar,
} from "../../../shared/ui";

export type HistorianWorkspaceView = "explorer" | "config";

export function HistorianWorkspacePage({ view }: { view: HistorianWorkspaceView }) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [tags, setTags] = useState<HistorianTagDescriptor[]>([]);
  const [projectName, setProjectName] = useState("Historian");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!projectId) {
        setError("Missing project id.");
        setLoading(false);
        return;
      }
      try {
        const project = await getProjectById(projectId);
        if (cancelled) return;
        setProjectName(project.name);
        const store = new TagStore(project.tree.data ?? { udts: {}, tags: {} });
        setTags(
          store.listPrimitivePaths().map((entry) => ({
            path: entry.path,
            valueKind:
              entry.type.kind === "int"
                ? "number"
                : entry.type.kind === "bool"
                  ? "boolean"
                  : "string",
          })),
        );
        setError(null);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Failed to load project tags.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const actions = useMemo(() => {
    if (!projectId) return null;
    return (
      <div className="flex items-center gap-1 rounded-lg border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] p-1">
        <Button
          size="xs"
          variant={view === "explorer" ? "primary" : "ghost"}
          leadingIcon={<DatabaseIcon size={13} />}
          onClick={() => navigate(`/project/${encodeURIComponent(projectId)}/historian`)}
        >
          Historian
        </Button>
        <Button
          size="xs"
          variant={view === "config" ? "primary" : "ghost"}
          leadingIcon={<SettingsIcon size={13} />}
          onClick={() => navigate(`/project/${encodeURIComponent(projectId)}/historian/config`)}
        >
          Logging
        </Button>
      </div>
    );
  }, [navigate, projectId, view]);

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-[var(--editor-canvas-bg)]">
      <Toolbar
        start={
          <Inline gap="lg" className="min-w-0">
            <img src="/logo6.svg" alt="Scadatomic" className="h-9 w-auto shrink-0" />
            <Button
              size="xs"
              variant="ghost"
              leadingIcon={<BackIcon size={13} />}
              onClick={() => navigate(projectId ? `/project/${encodeURIComponent(projectId)}` : "/")}
            >
              Editor
            </Button>
            <Stack gap="none" className="min-w-0 border-l border-[var(--editor-border)] pl-4">
              <Text as="div" variant="body" truncate className="font-semibold">
                {view === "config" ? "Historian Logging" : "Historian"}
              </Text>
              <Text as="div" variant="body-sm" tone="muted" truncate>
                {projectName} · local IndexedDB adapter
              </Text>
            </Stack>
          </Inline>
        }
        end={actions}
      />

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-[var(--editor-text-soft)]">Loading historian…</div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center text-sm text-red-600">{error}</div>
      ) : !projectId ? null : view === "config" ? (
        <HistorianLoggingView
          projectId={projectId}
          tags={tags}
          repository={indexedDbHistorianConfigRepository}
        />
      ) : (
        <HistorianExplorerView
          projectId={projectId}
          tags={tags}
          repository={indexedDbHistorianSampleRepository}
        />
      )}
    </div>
  );
}
