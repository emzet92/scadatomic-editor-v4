import { useMemo, useState } from "react";
import {
  Box,
  CheckIcon,
  CodeIcon,
  InfoIcon,
  Pressable,
  SearchIcon,
  ZapIcon,
} from "../../../shared/ui";

export type ScriptConsoleEntry = {
  id: string;
  timestamp: number;
  level: "info" | "success" | "warning" | "error";
  message: string;
};

type ScriptConsolePanelProps = {
  entries: ScriptConsoleEntry[];
  problems: string[];
  eventName?: string | undefined;
  onClear: () => void;
};

type ConsoleTab = "console" | "logs" | "problems" | "events";

export function ScriptConsolePanel({
  entries,
  problems,
  eventName,
  onClear,
}: ScriptConsolePanelProps) {
  const [tab, setTab] = useState<ConsoleTab>("console");
  const [filter, setFilter] = useState("");

  const visibleEntries = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return entries;
    return entries.filter((entry) => entry.message.toLowerCase().includes(query));
  }, [entries, filter]);

  return (
    <Box className="flex h-56 shrink-0 flex-col border-t border-zinc-200 bg-white">
      <Box className="flex h-10 shrink-0 items-center border-b border-zinc-200 px-3">
        <ConsoleTabButton active={tab === "console"} onClick={() => setTab("console")}>
          <CodeIcon size={13} /> Console
        </ConsoleTabButton>
        <ConsoleTabButton active={tab === "logs"} onClick={() => setTab("logs")}>
          <InfoIcon size={13} /> Logs
          {entries.length > 0 ? <Badge>{entries.length}</Badge> : null}
        </ConsoleTabButton>
        <ConsoleTabButton active={tab === "problems"} onClick={() => setTab("problems")}>
          <ZapIcon size={13} /> Problems
          <Badge>{problems.length}</Badge>
        </ConsoleTabButton>
        <ConsoleTabButton active={tab === "events"} onClick={() => setTab("events")}>
          <CheckIcon size={13} /> Events
          {eventName ? <Badge>1</Badge> : null}
        </ConsoleTabButton>

        <Box className="ml-auto flex items-center gap-2">
          <Box className="relative hidden items-center lg:flex">
            <SearchIcon size={12} className="pointer-events-none absolute left-2.5 text-zinc-400" />
            <input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Filter output…"
              className="h-7 w-44 rounded-md border border-zinc-200 bg-zinc-50 pl-7 pr-2 text-xs text-zinc-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          </Box>
          <Pressable
            type="button"
            onClick={onClear}
            className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
          >
            Clear
          </Pressable>
        </Box>
      </Box>

      <Box className="min-h-0 flex-1 overflow-auto bg-zinc-950 px-3 py-2 font-mono text-[11px] leading-5 text-zinc-300">
        {tab === "problems" ? (
          problems.length > 0 ? (
            problems.map((problem, index) => (
              <ConsoleLine key={`${problem}:${index}`} level="error" message={problem} />
            ))
          ) : (
            <EmptyLine>No problems detected.</EmptyLine>
          )
        ) : tab === "events" ? (
          eventName ? (
            <ConsoleLine
              level="info"
              message={`Current handler event: ${eventName}`}
            />
          ) : (
            <EmptyLine>This script is not an event handler.</EmptyLine>
          )
        ) : visibleEntries.length > 0 ? (
          visibleEntries.map((entry) => (
            <ConsoleLine
              key={entry.id}
              timestamp={entry.timestamp}
              level={entry.level}
              message={entry.message}
            />
          ))
        ) : (
          <EmptyLine>No console output yet.</EmptyLine>
        )}
      </Box>
    </Box>
  );
}

function ConsoleTabButton({
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
      className={`relative flex h-10 items-center gap-1.5 px-2.5 text-xs font-medium transition ${
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

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-500">
      {children}
    </span>
  );
}

function ConsoleLine({
  timestamp,
  level,
  message,
}: {
  timestamp?: number | undefined;
  level: ScriptConsoleEntry["level"];
  message: string;
}) {
  const tone =
    level === "error"
      ? "text-rose-400"
      : level === "warning"
        ? "text-amber-300"
        : level === "success"
          ? "text-emerald-400"
          : "text-sky-300";

  return (
    <Box className="flex min-w-0 gap-2">
      <span className="shrink-0 text-zinc-600">
        {timestamp ? `[${formatTime(timestamp)}]` : "[problem]"}
      </span>
      <span className={`shrink-0 ${tone}`}>▶</span>
      <span className="min-w-0 whitespace-pre-wrap break-words text-zinc-300">
        {message}
      </span>
    </Box>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return <Box className="py-1 text-zinc-600">{children}</Box>;
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
