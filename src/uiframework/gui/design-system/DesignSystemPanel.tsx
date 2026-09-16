import { useEditorStore } from "../../editor-store";
import {
  Box,
  Callout,
  HorizontalResizeIcon,
  LayersIcon,
  PaletteIcon,
  RadiusIcon,
  SidebarNavItem,
  SidebarSection,
  SquareIcon,
  ThemeIcon,
  TypographyIcon
} from "../ui";

export type DesignSystemSection = "themes" | "colors" | "typography" | "spacing" | "radius" | "shadows" | "borders";

export function DesignSystemPanel({
  activeSection,
  onSelectSection,
}: {
  activeSection: DesignSystemSection;
  onSelectSection: (section: DesignSystemSection) => void;
}) {
  const themeCount = useEditorStore(
    (state) => Object.keys(state.document.designSystem?.themes ?? {}).length
  );
  const colorCount = useEditorStore(
    (state) => Object.keys(state.document.designSystem?.colors ?? {}).length
  );
  const typographyCount = useEditorStore(
    (state) => Object.keys(state.document.designSystem?.typography ?? {}).length
  );
  const spacingCount = useEditorStore(
    (state) => Object.keys(state.document.designSystem?.spacing ?? {}).length
  );
  const radiusCount = useEditorStore(
    (state) => Object.keys(state.document.designSystem?.radius ?? {}).length
  );
  const shadowCount = useEditorStore(
    (state) => Object.keys(state.document.designSystem?.shadows ?? {}).length
  );
  const borderCount = useEditorStore(
    (state) => Object.keys(state.document.designSystem?.borders ?? {}).length
  );

  const sections = [
    ["themes", "Themes & Semantic", ThemeIcon, themeCount],
    ["colors", "Colors", PaletteIcon, colorCount],
    ["typography", "Typography", TypographyIcon, typographyCount],
    ["spacing", "Spacing", HorizontalResizeIcon, spacingCount],
    ["radius", "Radius", RadiusIcon, radiusCount],
    ["shadows", "Shadows / Elevation", LayersIcon, shadowCount],
    ["borders", "Borders / Strokes", SquareIcon, borderCount],
  ] as const;

  return (
    <SidebarSection
      title="Design System"
      description="Project-local tokens shared by every page and reusable component."
    >
      <Box className="space-y-2">
        {sections.map(([id, title, SectionIcon, count]) => (
          <SidebarNavItem
            key={id}
            active={activeSection === id}
            icon={<SectionIcon size={15} />}
            title={title}
            meta={`${count}`}
            description={`${count} ${count === 1 ? "token" : "tokens"}`}
            onClick={() => onSelectSection(id)}
          />
        ))}
      </Box>
      <Callout dashed>
        Components default to design-token references. Semantic colors resolve through the active theme; foundation tokens remain available for explicit overrides.
      </Callout>
    </SidebarSection>
  );
}
