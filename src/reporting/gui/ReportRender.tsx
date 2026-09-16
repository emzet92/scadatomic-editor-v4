import type { CSSProperties } from "react";
import { Text } from "../../uiframework/gui/ui";
import type { ReportComponent, ReportPage } from "../core";

export function ReportComponentContent({ component }: { component: ReportComponent }) {
  return (
    <Text
      as="div"
      tone="inherit"
      style={{
        color: component.props.color,
        fontSize: `${component.props.fontSize}px`,
        fontWeight: reportFontWeightToCss(component.props.fontWeight),
        textAlign: component.props.align,
        lineHeight: 1.45,
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
      }}
    >
      {component.props.text || "Empty text"}
    </Text>
  );
}

export function getReportPreviewPageStyle(page: ReportPage): CSSProperties {
  const portrait = getPaperSizeMm(page.setup.format);
  const width = page.setup.orientation === "landscape" ? portrait.height : portrait.width;
  const height = page.setup.orientation === "landscape" ? portrait.width : portrait.height;
  const { top, right, bottom, left } = page.setup.margins;

  return {
    width: `${width}mm`,
    minHeight: `${height}mm`,
    padding: `${top}mm ${right}mm ${bottom}mm ${left}mm`,
    boxSizing: "border-box",
  };
}

function getPaperSizeMm(format: ReportPage["setup"]["format"]): { width: number; height: number } {
  switch (format) {
    case "letter":
      return { width: 215.9, height: 279.4 };
    case "a4":
    default:
      return { width: 210, height: 297 };
  }
}

function reportFontWeightToCss(weight: ReportComponent["props"]["fontWeight"]): number {
  switch (weight) {
    case "medium": return 500;
    case "semibold": return 600;
    case "bold": return 700;
    default: return 400;
  }
}
