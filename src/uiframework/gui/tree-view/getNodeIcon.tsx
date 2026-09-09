import {
  Box,
  Boxes,
  LayoutTemplate,
  Menu,
  RectangleHorizontal,
  Type,
} from "lucide-react";

export function getNodeIcon(type: string) {
  switch (type) {
    case "Page":
      return <LayoutTemplate size={14} />;
    case "ComponentInstance":
      return <Boxes size={14} />;
    case "Navigation":
      return <Menu size={14} />;
    case "Container":
      return <Box size={14} />;
    case "Text":
      return <Type size={14} />;
    case "Button":
      return <RectangleHorizontal size={14} />;
    default:
      return <Box size={14} />;
  }
}
