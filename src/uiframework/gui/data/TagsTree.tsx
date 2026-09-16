import { ChevronRight, Database, Plus, Tag } from "lucide-react";
import { useState } from "react";
import { isUdtTag, type ProjectData, type TagDefinition } from "../../data/tags/TagDefinition";
import { TypeRegistry } from "../../data/types/TypeRegistry";
import { Callout, IconButton, SidebarSection,
  Box,
  Icon,
  Pressable,
} from "../ui";
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
    <SidebarSection
      title="Tags"
      actions={
        <IconButton aria-label="Create tag" variant="secondary" onClick={onCreate}>
          <Icon glyph={Plus} size={14} />
        </IconButton>
      }
    >
      <Box className="space-y-0.5">
        {tags.length === 0 ? (
          <Callout dashed size="sm">No tags yet.</Callout>
        ) : tags.map((tag) => (
          <TagTreeRow key={tag.id} tag={tag} data={data} active={selection?.kind === "tag" && selection.tagId === tag.id} onSelect={() => onSelect({ kind: "tag", tagId: tag.id })} />
        ))}
      </Box>
    </SidebarSection>
  );
}

function TagTreeRow({ tag, data, active, onSelect }: { tag: TagDefinition; data: ProjectData; active: boolean; onSelect(): void }) {
  const [expanded, setExpanded] = useState(true);
  const udtTag = isUdtTag(tag) ? tag : undefined;
  const isUdt = !!udtTag;
  const definition = udtTag ? data.udts[udtTag.type.udtId] : undefined;
  return (
    <Box>
      <Box className={`flex h-8 items-center rounded-md pr-2 text-xs ${active ? "bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]" : "text-[var(--editor-text)] hover:bg-[var(--editor-surface)]"}`}>
        <Pressable type="button" onClick={() => setExpanded((value) => !value)} className={`inline-flex h-6 w-6 items-center justify-center text-[var(--editor-text-soft)] ${isUdt ? "opacity-100" : "opacity-0"}`} tabIndex={isUdt ? 0 : -1}>
          <Icon glyph={ChevronRight} size={12} className={expanded ? "rotate-90" : ""} />
        </Pressable>
        <Pressable type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          {isUdt ? <Icon glyph={Database} size={13} /> : <Icon glyph={Tag} size={13} />}
          <span className="truncate font-medium">{tag.name}</span>
          <span className="ml-auto truncate text-[10px] text-[var(--editor-text-soft)]">{TypeRegistry.getDisplayName(tag.type, definition?.name)}</span>
        </Pressable>
      </Box>
      {isUdt && expanded && definition ? (
        <Box className="ml-8 border-l border-[var(--editor-border)] pl-3">
          {definition.fields.map((field) => (
            <Box key={field.id} className="flex h-7 items-center justify-between gap-2 text-[11px] text-[var(--editor-text-muted)]">
              <span className="truncate">{field.name}</span>
              <span className="text-[10px] text-[var(--editor-text-soft)]">{TypeRegistry.getDisplayName(field.type, field.type.kind === "udt" ? data.udts[field.type.udtId]?.name : undefined)}</span>
            </Box>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}
