import { Icon } from "../ui";
import {
  Box as BoxIcon,
  Boxes,
  LayoutTemplate,
  Menu,
  RectangleHorizontal,
  Type,
} from "lucide-react";

export function getNodeIcon(type: string) {
  switch (type) {
    case "Page":
      return <Icon glyph={LayoutTemplate} size={14} />;
    case "ComponentInstance":
      return <Icon glyph={Boxes} size={14} />;
    case "Navigation":
      return <Icon glyph={Menu} size={14} />;
    case "Container":
      return <Icon glyph={BoxIcon} size={14} />;
    case "Text":
      return <Icon glyph={Type} size={14} />;
    case "Button":
      return <Icon glyph={RectangleHorizontal} size={14} />;
    default:
      return <Icon glyph={BoxIcon} size={14} />;
  }
}
