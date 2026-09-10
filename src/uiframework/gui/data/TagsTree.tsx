import { ChevronRight, Database, Plus, Tag } from "lucide-react";
import { useState } from "react";
import { isUdtTag, type ProjectData, type TagDefinition } from "../../data/tags/TagDefinition";
import { TypeRegistry } from "../../data/types/TypeRegistry";
import { IconButton } from "../ui";
import type { DataSelection } from "./data-selection";

export function TagsTree({
  data,
  selection,
  onSelect,
  onCreate,
}: {
  data: ProjectData;
  selection: DataSelection;
  onSelect(selection: DataSelection): void;
  onCreate(): void;
}) {
  const tags = Object.values(data.tags).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">Tags</div>
        <IconButton aria-label="Create tag" title="Create tag" variant="secondary" onClick={onCreate}>
          <Plus size={14} />
        </IconButton>
      </div>
      <div className="space-y-0.5">
        {tags.length === 0 ? (
          <div className="rounded-md border border-dashed border-[var(--editor-border)] p-3 text-xs text-[var(--editor-text-soft)]">No tags yet.</div>
        ) : tags.map((tag) => (
          <TagTreeRow key={tag.id} tag={tag} data={data} active={selection?.kind === "tag" && selection.tagId === tag.id} onSelect={() => onSelect({ kind: "tag", tagId: tag.id })} />
        ))}
      </div>
    </div>
  );
}

function TagTreeRow({ tag, data, active, onSelect }: { tag: TagDefinition; data: ProjectData; active: boolean; onSelect(): void }) {
  const [expanded, setExpanded] = useState(true);
  const udtTag = isUdtTag(tag) ? tag : undefined;
  const isUdt = !!udtTag;
  const definition = udtTag ? data.udts[udtTag.type.udtId] : undefined;
  return (
    <div>
      <div className={`flex h-8 items-center rounded-md pr-2 text-xs ${active ? "bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]" : "text-[var(--editor-text)] hover:bg-[var(--editor-surface)]"}`}>
        <button type="button" onClick={() => setExpanded((value) => !value)} className={`inline-flex h-6 w-6 items-center justify-center text-[var(--editor-text-soft)] ${isUdt ? "opacity-100" : "opacity-0"}`} tabIndex={isUdt ? 0 : -1}>
          <ChevronRight size={12} className={expanded ? "rotate-90" : ""} />
        </button>
        <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          {isUdt ? <Database size={13} /> : <Tag size={13} />}
          <span className="truncate font-medium">{tag.name}</span>
          <span className="ml-auto truncate text-[10px] text-[var(--editor-text-soft)]">{TypeRegistry.getDisplayName(tag.type, definition?.name)}</span>
        </button>
      </div>
      {isUdt && expanded && definition ? (
        <div className="ml-8 border-l border-[var(--editor-border)] pl-3">
          {definition.fields.map((field) => (
            <div key={field.id} className="flex h-7 items-center justify-between gap-2 text-[11px] text-[var(--editor-text-muted)]">
              <span className="truncate">{field.name}</span>
              <span className="text-[10px] text-[var(--editor-text-soft)]">{TypeRegistry.getDisplayName(field.type, field.type.kind === "udt" ? data.udts[field.type.udtId]?.name : undefined)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
