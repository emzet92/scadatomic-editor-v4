import { Box } from "../ui";
export function PropertyPanelNodeNotFound() {
  return (
    <Box
      data-editor-ignore
      className="
        p-4
        text-sm
        text-[var(--editor-danger)]
      "
    >
      Node not found
    </Box>
  );
}