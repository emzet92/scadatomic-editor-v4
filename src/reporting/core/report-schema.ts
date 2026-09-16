export type ReportId = string;
export type ReportPageId = string;
export type ReportLayoutId = string;
export type ReportComponentId = string;
export type ReportAssetId = string;

export type ReportPageFormat = "a4" | "letter";
export type ReportOrientation = "portrait" | "landscape";

export type ReportMargins = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type ReportPageSetup = {
  format: ReportPageFormat;
  orientation: ReportOrientation;
  margins: ReportMargins;
};

export type ReportTextAlign = "left" | "center" | "right";
export type ReportFontWeight = "regular" | "medium" | "semibold" | "bold";

export type ReportTextComponent = {
  id: ReportComponentId;
  type: "text";
  name: string;
  props: {
    text: string;
    fontSize: number;
    fontWeight: ReportFontWeight;
    align: ReportTextAlign;
    color: string;
  };
};

/**
 * Report components are intentionally a discriminated union from day one.
 * New report-only primitives (table, image, chart, page number, repeat block)
 * can be added without leaking runtime UI component definitions into reports.
 */
export type ReportComponent = ReportTextComponent;

export type ReportPage = {
  id: ReportPageId;
  name: string;
  layoutId?: ReportLayoutId | undefined;
  componentIds: ReportComponentId[];
  setup: ReportPageSetup;
};

/**
 * A layout is an editable report surface shared by pages. Components added to a
 * layout are rendered before page-owned content. Later this can be extended
 * with named regions such as header/body/footer without changing page identity.
 */
export type ReportLayout = {
  id: ReportLayoutId;
  name: string;
  componentIds: ReportComponentId[];
};

export type ReportAsset = {
  id: ReportAssetId;
  kind: "image";
  name: string;
  source: string;
};

export type ReportDocument = {
  schemaVersion: 1;
  id: ReportId;
  projectId: string;
  name: string;
  pageOrder: ReportPageId[];
  layoutOrder: ReportLayoutId[];
  pages: Record<ReportPageId, ReportPage>;
  layouts: Record<ReportLayoutId, ReportLayout>;
  components: Record<ReportComponentId, ReportComponent>;
  assets: Record<ReportAssetId, ReportAsset>;
};

export type ReportSurfaceTarget =
  | { kind: "page"; id: ReportPageId }
  | { kind: "layout"; id: ReportLayoutId };

export type ReportSelection =
  | { kind: "surface"; target: ReportSurfaceTarget }
  | { kind: "component"; target: ReportSurfaceTarget; componentId: ReportComponentId };
