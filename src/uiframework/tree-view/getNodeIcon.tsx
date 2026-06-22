import {
  Box,
  Type,
  RectangleHorizontal,
} from "lucide-react";

export function getNodeIcon(type: string) {
  switch (type) {
    case "Container":
      return <Box size={14} />;

    case "Text":
      return <Type size={14} />;

    case "Button":
      return (
        <RectangleHorizontal
          size={14}
        />
      );

    default:
      return <Box size={14} />;
  }
}
