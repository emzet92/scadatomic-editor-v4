import { Braces, Cable, Database, Gauge, LayoutGrid, Tag } from "lucide-react";
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Badge,
  ChoiceCard,
  NavTab,
  NavTabs,
  SidebarNavItem,
  SidebarSection,
} from "../../src/uiframework/gui/ui";

const meta = {
  title: "Molecules/Navigation",
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function SidebarExample() {
  const [selected, setSelected] = useState("tags");
  return (
    <div className="w-72 rounded-xl border border-[var(--editor-border)] bg-[var(--editor-panel-bg)] p-4">
      <SidebarSection title="Data" description="Project-local sources and reusable types.">
        <div className="space-y-1">
          <SidebarNavItem variant="row" active={selected === "tags"} icon={<Tag size={13} />} title="Tags" meta={<Badge size="xs">12</Badge>} onClick={() => setSelected("tags")} />
          <SidebarNavItem variant="row" active={selected === "udt"} icon={<Braces size={13} />} title="UDTs" meta="4" onClick={() => setSelected("udt")} />
          <SidebarNavItem variant="row" active={selected === "driver"} icon={<Cable size={13} />} title="Drivers" description="Built in and configurable" onClick={() => setSelected("driver")} />
        </div>
      </SidebarSection>
    </div>
  );
}

export const Sidebar: Story = { render: () => <SidebarExample /> };

function TabsExample() {
  const [tab, setTab] = useState("designer");
  return (
    <NavTabs ariaLabel="Workspace example">
      <NavTab active={tab === "designer"} icon={<LayoutGrid size={13} />} onClick={() => setTab("designer")}>Designer</NavTab>
      <NavTab active={tab === "data"} icon={<Database size={13} />} onClick={() => setTab("data")}>Data</NavTab>
      <NavTab active={tab === "runtime"} icon={<Gauge size={13} />} onClick={() => setTab("runtime")}>Runtime</NavTab>
    </NavTabs>
  );
}

export const Tabs: Story = {
  render: () => <div className="rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)] p-4"><TabsExample /></div>,
};

function ChoiceExample() {
  const [value, setValue] = useState("split");
  return (
    <div className="grid max-w-xl grid-cols-2 gap-2">
      <ChoiceCard title="Stack" description="Single column" selected={value === "stack"} onClick={() => setValue("stack")} />
      <ChoiceCard title="Split" description="Two equal columns" selected={value === "split"} onClick={() => setValue("split")} />
      <ChoiceCard title="Cards" description="Three fixed columns" selected={value === "cards"} onClick={() => setValue("cards")} />
      <ChoiceCard title="Adaptive" description="Reflows automatically" selected={value === "adaptive"} onClick={() => setValue("adaptive")} />
    </div>
  );
}

export const Choices: Story = { render: () => <ChoiceExample /> };
