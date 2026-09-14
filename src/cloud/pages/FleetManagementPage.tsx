import {
  KeyRound,
  MonitorCheck,
  MonitorOff,
  Plus,
  RefreshCw,
  ServerCog,
} from "lucide-react";
import { useState } from "react";
import { Button, PanelCard, SectionHeader } from "../../uiframework/gui/ui";
import { useFleetDashboard } from "../hooks/useFleetDashboard";
import { CloudPageHeader, CloudShell } from "../ui/CloudShell";
import { EdgeDeviceCard } from "../ui/EdgeDeviceCard";
import { FleetStatCard } from "../ui/FleetStatCard";
import { RegistrationKeyDialog } from "../ui/RegistrationKeyDialog";
import { RegistrationKeysPanel } from "../ui/RegistrationKeysPanel";

const CLOUD_PROJECT_ID = "cloud";

export function FleetManagementPage() {
  const [registrationDialogOpen, setRegistrationDialogOpen] = useState(false);
  const dashboard = useFleetDashboard(CLOUD_PROJECT_ID);

  return (
    <CloudShell projectName="Cloud">
      <CloudPageHeader
        eyebrow="Cloud / Cloud"
        title="Fleet Management"
        description="Provision and monitor SCADAtomic Edge Agents. This development screen uses the same API contract planned for the backend, with IndexedDB acting as the local adapter."
        actions={
          <>
            <Button size="md" onClick={() => void dashboard.reload()} disabled={dashboard.loading}>
              <RefreshCw size={14} className={dashboard.loading ? "animate-spin" : undefined} />
              Refresh
            </Button>
            <Button variant="primary" size="md" onClick={() => setRegistrationDialogOpen(true)}>
              <Plus size={14} />
              Registration key
            </Button>
          </>
        }
      />

      <div className="mx-auto max-w-[1500px] space-y-6 p-8">
        {dashboard.error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            {dashboard.error}
          </div>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <FleetStatCard
            label="Online Edge"
            value={dashboard.summary?.onlineDevices ?? "—"}
            detail={`${dashboard.summary?.totalDevices ?? 0} devices registered`}
            icon={MonitorCheck}
            tone="success"
          />
          <FleetStatCard
            label="Offline Edge"
            value={dashboard.summary?.offlineDevices ?? "—"}
            detail="Requires connectivity check"
            icon={MonitorOff}
            tone={dashboard.summary?.offlineDevices ? "danger" : "neutral"}
          />
          <FleetStatCard
            label="Provisioning"
            value={dashboard.summary?.provisioningDevices ?? "—"}
            detail="Agents completing enrollment"
            icon={ServerCog}
            tone="accent"
          />
          <FleetStatCard
            label="Active keys"
            value={dashboard.summary?.activeRegistrationKeys ?? "—"}
            detail="Unused enrollment credentials"
            icon={KeyRound}
            tone="accent"
          />
        </section>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,0.75fr)]">
          <PanelCard className="rounded-xl p-4 shadow-sm">
            <SectionHeader
              title="Edge devices"
              description="Development data represents agents that would report health and runtime state to the Cloud control plane."
              action={
                <span className="rounded-full bg-[var(--editor-surface-muted)] px-2.5 py-1 text-[10px] font-medium text-[var(--editor-text-muted)]">
                  {dashboard.devices.length} registered
                </span>
              }
            />

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {dashboard.loading && dashboard.devices.length === 0
                ? Array.from({ length: 4 }, (_, index) => <DeviceSkeleton key={index} />)
                : dashboard.devices.map((device) => <EdgeDeviceCard key={device.id} device={device} />)}
            </div>
          </PanelCard>

          <div className="space-y-6">
            <RegistrationKeysPanel
              keys={dashboard.registrationKeys}
              onCreate={() => setRegistrationDialogOpen(true)}
              onDelete={dashboard.deleteRegistrationKey}
            />

            <PanelCard className="rounded-xl p-4 shadow-sm">
              <SectionHeader
                title="Provisioning flow"
                description="The backend implementation can keep this exact UI contract."
              />
              <ol className="mt-4 space-y-3 text-xs text-[var(--editor-text-muted)]">
                <FlowStep number="1" title="Create registration key" detail="POST registration-keys through FleetApi." />
                <FlowStep number="2" title="Install Edge Agent" detail="Pass the token to the agent during first boot." />
                <FlowStep number="3" title="Agent enrolls" detail="Backend exchanges the token for device identity and credentials." />
                <FlowStep number="4" title="Fleet becomes live" detail="Health, runtime version and deployment state appear here." />
              </ol>
            </PanelCard>
          </div>
        </div>
      </div>

      <RegistrationKeyDialog
        open={registrationDialogOpen}
        onClose={() => setRegistrationDialogOpen(false)}
        onCreate={dashboard.createRegistrationKey}
      />
    </CloudShell>
  );
}

function DeviceSkeleton() {
  return (
    <div className="h-64 animate-pulse rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface-muted)]" />
  );
}

function FlowStep({ number, title, detail }: { number: string; title: string; detail: string }) {
  return (
    <li className="flex gap-3">
      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--editor-accent-soft)] text-[10px] font-semibold text-[var(--editor-accent)]">
        {number}
      </div>
      <div>
        <div className="font-medium text-[var(--editor-text)]">{title}</div>
        <div className="mt-0.5 text-[10px] leading-4 text-[var(--editor-text-soft)]">{detail}</div>
      </div>
    </li>
  );
}
