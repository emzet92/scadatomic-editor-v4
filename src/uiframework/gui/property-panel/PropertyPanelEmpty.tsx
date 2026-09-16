import { Box } from "../ui";
export function PropertyPanelEmpty() {
  return (
    <Box
      data-editor-ignore
      className="
        p-4
        text-sm
        text-[var(--editor-text-muted)]
      "
    >
      Select a component
    </Box>
  );
}