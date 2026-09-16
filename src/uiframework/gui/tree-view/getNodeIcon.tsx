import {
  BoxIcon,
  BoxesIcon,
  MenuIcon,
  RectangleIcon,
  TemplateIcon,
  TypographyIcon
} from "../ui";

export function getNodeIcon(type: string) {
  switch (type) {
    case "Page":
      return <TemplateIcon size={14} />;
    case "ComponentInstance":
      return <BoxesIcon size={14} />;
    case "Navigation":
      return <MenuIcon size={14} />;
    case "Container":
      return <BoxIcon size={14} />;
    case "Text":
      return <TypographyIcon size={14} />;
    case "Button":
      return <RectangleIcon size={14} />;
    default:
      return <BoxIcon size={14} />;
  }
}
