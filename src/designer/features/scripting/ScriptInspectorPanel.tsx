import { useState } from "react";
import {
  Box,
  CodeIcon,
  CopyIcon,
  InfoIcon,
  Pressable,
  TagIcon,
  ZapIcon,
} from "../../../shared/ui";

export type ScriptInspectorModel = {
  scriptId: string;
  title: string;
  typeLabel: string;
  description: string;
  componentName?: string | undefined;
  sourceNodeId?: string | undefined;
  eventName?: string | undefined;
  projectId: string;
};

type InspectorTab = "inspector" | "api" | "examples";

export function ScriptInspectorPanel({ model }: { model: ScriptInspectorModel }) {
  const [tab, setTab] = useState<InspectorTab>("inspector");

  return (
    <aside className="flex w-[340px] shrink-0 flex-col border-l border-zinc-200 bg-white">
      <Box className="flex h-11 shrink-0 items-end border-b border-zinc-200 px-2">
        <InspectorTabButton
          active={tab === "inspector"}
          onClick={() => setTab("inspector")}
        >
          <InfoIcon size={13} /> Inspector
        </InspectorTabButton>
        <InspectorTabButton active={tab === "api"} onClick={() => setTab("api")}>
          <CodeIcon size={13} /> API Reference
        </InspectorTabButton>
        <InspectorTabButton
          active={tab === "examples"}
          onClick={() => setTab("examples")}
        >
          <ZapIcon size={13} /> Examples
        </InspectorTabButton>
      </Box>

      <Box className="min-h-0 flex-1 overflow-auto p-3">
        {tab === "inspector" ? (
          <InspectorView model={model} />
        ) : tab === "api" ? (
          <ApiReferenceView />
        ) : (
          <ExamplesView />
        )}
      </Box>
    </aside>
  );
}

function InspectorView({ model }: { model: ScriptInspectorModel }) {
  const eventContext = JSON.stringify(
    {
      projectId: model.projectId,
      sourceNodeId: model.sourceNodeId ?? null,
      eventName: model.eventName ?? null,
    },
    null,
    2
  );

  return (
    <Box className="space-y-3">
      <InspectorCard title="Handler details">
        <Field label="Script ID" value={model.scriptId} mono />
        {model.componentName ? (
          <Field label="Component" value={model.componentName} />
        ) : null}
        <Field label="Type" value={model.typeLabel} />
        <Box>
          <Box className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            Description
          </Box>
          <Box className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-xs leading-5 text-zinc-600">
            {model.description}
          </Box>
        </Box>
      </InspectorCard>

      <InspectorCard title="Event context">
        <Field label="Source node ID" value={model.sourceNodeId ?? "—"} mono />
        <Field label="Event name" value={model.eventName ?? "—"} mono />
        <Box>
          <Box className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            Context preview
          </Box>
          <pre className="overflow-x-auto rounded-md bg-zinc-950 p-2.5 font-mono text-[10px] leading-5 text-zinc-300">
            {eventContext}
          </pre>
        </Box>
      </InspectorCard>

      <InspectorCard title="Quick help">
        <Box className="mb-2 flex items-center gap-2">
          <TagIcon size={14} className="text-indigo-500" />
          <span className="font-mono text-sm font-semibold text-zinc-800">tags</span>
          <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-indigo-600">
            API
          </span>
        </Box>
        <p className="mb-2 text-xs leading-5 text-zinc-500">
          Access SCADA tag values and tag groups with generated autocomplete.
        </p>
        <CodeSnippet code="tags.Pump1.speed" />
      </InspectorCard>
    </Box>
  );
}

function ApiReferenceView() {
  return (
    <Box className="space-y-3">
      <InspectorCard title="ctx">
        <ApiMethod name="ctx.log(...args)" description="Write to the script console." />
        <ApiMethod name="ctx.emit(name, payload?)" description="Emit a runtime event." />
        <ApiMethod name="ctx.state.get(key, fallback?)" description="Read session state." />
        <ApiMethod name="ctx.state.set(key, value)" description="Write session state." />
      </InspectorCard>
      <InspectorCard title="tags">
        <ApiMethod name="tags.Pump1.speed" description="Read a tag or UDT member." />
        <ApiMethod name="tags.LineSpeed = 1200" description="Write a tag value." />
        <ApiMethod name="tags.Pump1.start()" description="Invoke a generated UDT method." />
      </InspectorCard>
      <InspectorCard title="ui / navigation">
        <ApiMethod name="ctx.ui.ComponentName" description="Access a scene-public component API." />
        <ApiMethod name="ctx.nav.Page1.go()" description="Navigate with generated page helpers." />
        <ApiMethod name="ctx.modals.Confirm.open(payload?)" description="Open a project modal." />
      </InspectorCard>
    </Box>
  );
}

function ExamplesView() {
  return (
    <Box className="space-y-3">
      <InspectorCard title="Read a tag">
        <CodeSnippet code={'const speed = tags.Pump1.speed;\nctx.log("speed", speed);'} multiline />
      </InspectorCard>
      <InspectorCard title="Update UI">
        <CodeSnippet code={'ctx.ui.Status.label = "Running";\nctx.ui.Status.variant.enabled();'} multiline />
      </InspectorCard>
      <InspectorCard title="Emit an event">
        <CodeSnippet code={'ctx.emit("pump.speed.changed", { value: tags.Pump1.speed });'} multiline />
      </InspectorCard>
    </Box>
  );
}

function InspectorTabButton({
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
      className={`relative flex h-10 items-center gap-1.5 px-2.5 text-[11px] font-semibold transition ${
        active ? "text-indigo-600" : "text-zinc-500 hover:text-zinc-800"
      }`}
    >
      {children}
      {active ? (
        <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-indigo-500" />
      ) : null}
    </Pressable>
  );
}

function InspectorCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
      <Box className="mb-3 text-xs font-semibold text-zinc-800">{title}</Box>
      <Box className="space-y-2.5">{children}</Box>
    </section>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <Box className="grid grid-cols-[92px_minmax(0,1fr)] items-center gap-2">
      <span className="text-[11px] text-zinc-500">{label}</span>
      <span
        className={`truncate rounded bg-zinc-50 px-2 py-1 text-xs text-zinc-700 ${
          mono ? "font-mono" : ""
        }`}
        title={value}
      >
        {value}
      </span>
    </Box>
  );
}

function ApiMethod({ name, description }: { name: string; description: string }) {
  return (
    <Box className="border-b border-zinc-100 pb-2 last:border-b-0 last:pb-0">
      <Box className="font-mono text-[11px] font-medium text-zinc-800">{name}</Box>
      <Box className="mt-0.5 text-[10px] leading-4 text-zinc-500">{description}</Box>
    </Box>
  );
}

function CodeSnippet({ code, multiline = false }: { code: string; multiline?: boolean }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Clipboard support is optional in local/dev contexts.
    }
  }

  return (
    <Box className="group relative rounded-md border border-zinc-200 bg-zinc-50 p-2.5">
      {multiline ? (
        <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[10px] leading-5 text-zinc-700">
          {code}
        </pre>
      ) : (
        <code className="font-mono text-[10px] text-zinc-700">{code}</code>
      )}
      <Pressable
        type="button"
        aria-label="Copy code"
        onClick={copy}
        className="absolute right-1.5 top-1.5 rounded p-1 text-zinc-400 opacity-0 transition hover:bg-white hover:text-zinc-700 group-hover:opacity-100"
      >
        <CopyIcon size={12} />
      </Pressable>
    </Box>
  );
}
