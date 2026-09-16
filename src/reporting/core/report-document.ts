import type {
  ReportComponent,
  ReportComponentId,
  ReportDocument,
  ReportLayout,
  ReportLayoutId,
  ReportPage,
  ReportPageId,
  ReportPageSetup,
  ReportSurfaceTarget,
  ReportTextComponent,
} from "./report-schema";

const DEFAULT_PAGE_SETUP: ReportPageSetup = {
  format: "a4",
  orientation: "portrait",
  margins: { top: 18, right: 18, bottom: 18, left: 18 },
};

export function createReportDocument(projectId: string): ReportDocument {
  const page = createReportPage("Page 1");
  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    projectId,
    name: "Untitled report",
    pageOrder: [page.id],
    layoutOrder: [],
    pages: { [page.id]: page },
    layouts: {},
    components: {},
    assets: {},
  };
}

export function createReportPage(name: string): ReportPage {
  return {
    id: crypto.randomUUID(),
    name,
    componentIds: [],
    setup: {
      ...DEFAULT_PAGE_SETUP,
      margins: { ...DEFAULT_PAGE_SETUP.margins },
    },
  };
}

export function createReportLayout(name: string): ReportLayout {
  return {
    id: crypto.randomUUID(),
    name,
    componentIds: [],
  };
}

export function createReportTextComponent(index: number): ReportTextComponent {
  return {
    id: crypto.randomUUID(),
    type: "text",
    name: `Text ${index}`,
    props: {
      text: "Report text",
      fontSize: 14,
      fontWeight: "regular",
      align: "left",
      color: "#18181B",
    },
  };
}

export function getReportSurface(
  document: ReportDocument,
  target: ReportSurfaceTarget
): ReportPage | ReportLayout | undefined {
  return target.kind === "page" ? document.pages[target.id] : document.layouts[target.id];
}

export function getReportSurfaceComponentIds(
  document: ReportDocument,
  target: ReportSurfaceTarget
): ReportComponentId[] {
  return getReportSurface(document, target)?.componentIds ?? [];
}

export function addReportPage(document: ReportDocument): {
  document: ReportDocument;
  page: ReportPage;
} {
  const page = createReportPage(`Page ${document.pageOrder.length + 1}`);
  return {
    page,
    document: {
      ...document,
      pageOrder: [...document.pageOrder, page.id],
      pages: { ...document.pages, [page.id]: page },
    },
  };
}

export function addReportLayout(document: ReportDocument): {
  document: ReportDocument;
  layout: ReportLayout;
} {
  const layout = createReportLayout(`Layout ${document.layoutOrder.length + 1}`);
  return {
    layout,
    document: {
      ...document,
      layoutOrder: [...document.layoutOrder, layout.id],
      layouts: { ...document.layouts, [layout.id]: layout },
    },
  };
}

export function addReportText(
  document: ReportDocument,
  target: ReportSurfaceTarget
): { document: ReportDocument; component: ReportTextComponent } {
  const surface = getReportSurface(document, target);
  if (!surface) {
    throw new Error("Report surface does not exist.");
  }

  const component = createReportTextComponent(Object.keys(document.components).length + 1);
  const componentIds = [...surface.componentIds, component.id];

  return {
    component,
    document: target.kind === "page"
      ? {
          ...document,
          components: { ...document.components, [component.id]: component },
          pages: {
            ...document.pages,
            [target.id]: { ...document.pages[target.id]!, componentIds },
          },
        }
      : {
          ...document,
          components: { ...document.components, [component.id]: component },
          layouts: {
            ...document.layouts,
            [target.id]: { ...document.layouts[target.id]!, componentIds },
          },
        },
  };
}

export function updateReportComponent(
  document: ReportDocument,
  componentId: ReportComponentId,
  updater: (component: ReportComponent) => ReportComponent
): ReportDocument {
  const component = document.components[componentId];
  if (!component) return document;
  return {
    ...document,
    components: {
      ...document.components,
      [componentId]: updater(component),
    },
  };
}

export function updateReportPage(
  document: ReportDocument,
  pageId: ReportPageId,
  updater: (page: ReportPage) => ReportPage
): ReportDocument {
  const page = document.pages[pageId];
  if (!page) return document;
  return {
    ...document,
    pages: { ...document.pages, [pageId]: updater(page) },
  };
}

export function updateReportLayout(
  document: ReportDocument,
  layoutId: ReportLayoutId,
  updater: (layout: ReportLayout) => ReportLayout
): ReportDocument {
  const layout = document.layouts[layoutId];
  if (!layout) return document;
  return {
    ...document,
    layouts: { ...document.layouts, [layoutId]: updater(layout) },
  };
}

export function isReportDocument(value: unknown): value is ReportDocument {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<ReportDocument>;
  return (
    candidate.schemaVersion === 1 &&
    typeof candidate.id === "string" &&
    typeof candidate.projectId === "string" &&
    typeof candidate.name === "string" &&
    Array.isArray(candidate.pageOrder) &&
    Array.isArray(candidate.layoutOrder) &&
    isRecord(candidate.pages) &&
    isRecord(candidate.layouts) &&
    isRecord(candidate.components) &&
    isRecord(candidate.assets)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
