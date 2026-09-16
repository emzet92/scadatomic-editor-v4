import { Layers, MoveHorizontal, Palette, Radius, Square, SunMoon, Type } from "lucide-react";
import { useEditorStore } from "../../editor-store";
import { Box, Callout, Icon, SidebarNavItem, SidebarSection } from "../ui";

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
    ["themes", "Themes & Semantic", SunMoon, themeCount],
    ["colors", "Colors", Palette, colorCount],
    ["typography", "Typography", Type, typographyCount],
    ["spacing", "Spacing", MoveHorizontal, spacingCount],
    ["radius", "Radius", Radius, radiusCount],
    ["shadows", "Shadows / Elevation", Layers, shadowCount],
    ["borders", "Borders / Strokes", Square, borderCount],
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
            icon={<Icon glyph={SectionIcon} size={15} />}
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
