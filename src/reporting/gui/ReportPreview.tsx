import {
  Badge,
  Box,
  Center,
  FileTextIcon,
  Inline,
  Stack,
  Surface,
  Text,
  Toolbar,
} from "../../uiframework/gui/ui";
import type { ReportDocument } from "../core";
import { getReportPreviewPageStyle, ReportComponentContent } from "./ReportRender";

export function ReportPreview({ document }: { document: ReportDocument }) {
  return (
    <Stack gap="none" className="h-full min-h-0">
      <Toolbar
        compact
        start={
          <Inline gap="sm">
            <FileTextIcon size="sm" tone="accent" />
            <Text variant="label">Report preview</Text>
            <Badge variant="accent">Read only</Badge>
          </Inline>
        }
        end={
          <Text variant="caption" tone="muted">
            {document.pageOrder.length} {document.pageOrder.length === 1 ? "page" : "pages"}
          </Text>
        }
      />

      <Box className="min-h-0 flex-1 overflow-auto bg-[var(--editor-canvas-bg)] px-10 py-12">
        <Center className="min-h-full items-start">
          <Stack gap="xl" className="w-fit pb-12">
            {document.pageOrder.map((pageId, index) => {
              const page = document.pages[pageId];
              if (!page) return null;
              const layout = page.layoutId ? document.layouts[page.layoutId] : undefined;

              return (
                <Stack key={page.id} gap="sm" className="w-fit">
                  <Inline justify="between" className="px-1">
                    <Text variant="caption" tone="muted">
                      Page {index + 1} · {page.name}
                    </Text>
                    <Text variant="caption" tone="soft">
                      {page.setup.format.toUpperCase()} · {page.setup.orientation}
                    </Text>
                  </Inline>

                  <Surface
                    variant="default"
                    border="default"
                    radius="sm"
                    padding="none"
                    shadow="md"
                    className="overflow-hidden bg-white"
                    style={getReportPreviewPageStyle(page)}
                  >
                    <Stack gap="md">
                      {layout ? (
                        <ReportPreviewComponents document={document} componentIds={layout.componentIds} />
                      ) : null}
                      <ReportPreviewComponents document={document} componentIds={page.componentIds} />
                    </Stack>
                  </Surface>
                </Stack>
              );
            })}
          </Stack>
        </Center>
      </Box>
    </Stack>
  );
}

function ReportPreviewComponents({
  document,
  componentIds,
}: {
  document: ReportDocument;
  componentIds: string[];
}) {
  if (componentIds.length === 0) return null;

  return (
    <Stack gap="sm">
      {componentIds.map((componentId) => {
        const component = document.components[componentId];
        return component ? <ReportComponentContent key={component.id} component={component} /> : null;
      })}
    </Stack>
  );
}
