import { useMemo } from "react";
import {
  Box,
  Button,
  GridIcon,
  MinusIcon,
  AddIcon,
  SidebarSection,
} from "../../../shared/ui";
import type { UiComponentDefinition } from "../../../project/model/document";
import {
  getTableCellEntries,
  getTableDimensions,
  resizeTableDefinition,
} from "../../../visualization/tables/table-definition";
import { useEditorStore } from "../../state/editor-store";

export function TableDefinitionPanel({
  definition,
  selectedNodeId,
  onSelect,
}: {
  definition: UiComponentDefinition;
  selectedNodeId: string;
  onSelect(nodeId: string): void;
}) {
  const updateComponentDefinition = useEditorStore(
    (state) => state.updateComponentDefinition
  );
  const dimensions = getTableDimensions(definition);
  const cells = useMemo(() => getTableCellEntries(definition), [definition]);

  function resize(rows: number, columns: number) {
    const nextRows = Math.max(1, Math.min(24, rows));
    const nextColumns = Math.max(1, Math.min(24, columns));
    const selectedStillExists =
      selectedNodeId === definition.rootId ||
      cells.some(
        ({ node, row, column }) =>
          node.id === selectedNodeId && row < nextRows && column < nextColumns
      );

    updateComponentDefinition(definition.id, (current) =>
      resizeTableDefinition(current, {
        rows: nextRows,
        columns: nextColumns,
      })
    );

    if (!selectedStillExists) onSelect(definition.rootId);
  }

  const cellByPosition = new Map(
    cells.map((entry) => [`${entry.row}:${entry.column}`, entry.node])
  );

  return (
    <Box data-editor-ignore className="space-y-4">
      <SidebarSection title="Table editor">
        <Box className="space-y-3">
          <Box className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[10px] leading-4 text-sky-900">
            Static table. Drop Text, Button, Image, Container or any reusable component into a cell.
          </Box>

          <DimensionControl
            label="Rows"
            value={dimensions.rows}
            onDecrease={() => resize(dimensions.rows - 1, dimensions.columns)}
            onIncrease={() => resize(dimensions.rows + 1, dimensions.columns)}
          />
          <DimensionControl
            label="Columns"
            value={dimensions.columns}
            onDecrease={() => resize(dimensions.rows, dimensions.columns - 1)}
            onIncrease={() => resize(dimensions.rows, dimensions.columns + 1)}
          />
        </Box>
      </SidebarSection>

      <SidebarSection
        title="Cells"
        className="border-t border-[var(--editor-border)] pt-3"
      >
        <Box
          className="grid overflow-hidden rounded-lg border border-[var(--editor-border)] bg-[var(--editor-surface)]"
          style={{
            gridTemplateColumns: `repeat(${dimensions.columns}, minmax(28px, 1fr))`,
          }}
        >
          {Array.from({ length: dimensions.rows * dimensions.columns }).map(
            (_, index) => {
              const row = Math.floor(index / dimensions.columns);
              const column = index % dimensions.columns;
              const cell = cellByPosition.get(`${row}:${column}`);
              if (!cell) return null;
              const active = selectedNodeId === cell.id;
              return (
                <button
                  key={cell.id}
                  type="button"
                  title={`Row ${row + 1}, column ${column + 1}`}
                  onClick={() => onSelect(cell.id)}
                  className={`flex min-h-9 items-center justify-center border-b border-r border-[var(--editor-border)] text-[9px] font-semibold transition ${
                    active
                      ? "bg-sky-100 text-sky-800 ring-1 ring-inset ring-sky-400"
                      : "bg-[var(--editor-surface)] text-[var(--editor-text-muted)] hover:bg-[var(--editor-surface-muted)]"
                  }`}
                >
                  {row + 1}:{column + 1}
                </button>
              );
            }
          )}
        </Box>
        <Button
          variant="ghost"
          size="xs"
          className="mt-2 w-full"
          leadingIcon={<GridIcon size={12} />}
          onClick={() => onSelect(definition.rootId)}
        >
          Select table
        </Button>
      </SidebarSection>
    </Box>
  );
}

function DimensionControl({
  label,
  value,
  onDecrease,
  onIncrease,
}: {
  label: string;
  value: number;
  onDecrease(): void;
  onIncrease(): void;
}) {
  return (
    <Box className="flex items-center justify-between gap-3">
      <Box>
        <Box className="text-xs font-medium text-[var(--editor-text)]">{label}</Box>
        <Box className="text-[10px] text-[var(--editor-text-muted)]">{value}</Box>
      </Box>
      <Box className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="icon-xs"
          disabled={value <= 1}
          onClick={onDecrease}
          aria-label={`Remove ${label.toLowerCase().slice(0, -1)}`}
        >
          <MinusIcon size={12} />
        </Button>
        <Button
          variant="secondary"
          size="icon-xs"
          disabled={value >= 24}
          onClick={onIncrease}
          aria-label={`Add ${label.toLowerCase().slice(0, -1)}`}
        >
          <AddIcon size={12} />
        </Button>
      </Box>
    </Box>
  );
}
