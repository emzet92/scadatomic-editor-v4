import { Braces, Database, RadioTower, Tags } from "lucide-react";
import type { ProjectData } from "../../data/tags/TagDefinition";
import { Callout, EditorPage, Grid, Icon, MetricCard } from "../ui";
import { CreateTagEditor } from "./CreateTagEditor";
import { CreateUdtEditor } from "./CreateUdtEditor";
import { TagEditor } from "./TagEditor";
import { UdtEditor } from "./UdtEditor";
import { UdtMethodEditor } from "./UdtMethodEditor";
import { DriverEditor } from "./DriverEditor";
import type { DataSelection } from "./data-selection";

export function DataWorkspace({ data, selection, onSelect, projectId }: { data: ProjectData; selection: DataSelection; onSelect(selection: DataSelection): void; projectId?: string | undefined }) {
  if (selection?.kind === "new-tag") return <CreateTagEditor data={data} onSelect={onSelect} />;
  if (selection?.kind === "new-udt") return <CreateUdtEditor data={data} onSelect={onSelect} />;
  if (selection?.kind === "tag") return <TagEditor key={selection.tagId} data={data} tagId={selection.tagId} onSelect={onSelect} projectId={projectId} />;
  if (selection?.kind === "udt") return <UdtEditor key={selection.udtId} data={data} udtId={selection.udtId} onSelect={onSelect} />;
  if (selection?.kind === "udt-method") return <UdtMethodEditor key={selection.methodId} data={data} udtId={selection.udtId} methodId={selection.methodId} />;
  if (selection?.kind === "driver") return <DriverEditor key={selection.driverKind} data={data} driverKind={selection.driverKind} projectId={projectId} />;

  return (
    <EditorPage
      title="Project Data"
      description="Local typed data runtime for data-driven UI. No PLC or device layer is involved."
      icon={<Icon glyph={Database} size="lg" />}
    >
      <Grid className="md:grid-cols-3" gap="lg">
        <MetricCard icon={<Icon glyph={Tags} size="lg" tone="accent" />} value={Object.keys(data.tags).length} label="Tags" />
        <MetricCard icon={<Icon glyph={Braces} size="lg" tone="accent" />} value={Object.keys(data.udts).length} label="UDT definitions" />
        <MetricCard icon={<Icon glyph={RadioTower} size="lg" tone="accent" />} value="Event driven" label="Tag runtime" description="TagStore subscriptions, no polling." />
      </Grid>
      <Callout>
        <strong className="text-[var(--editor-text)]">Runtime rule:</strong> all value mutations pass through TagStore. A real change emits <code className="font-mono text-[var(--editor-accent)]">tag.changed</code> with path, oldValue and newValue.
      </Callout>
    </EditorPage>
  );
}
