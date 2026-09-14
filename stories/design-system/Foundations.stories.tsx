import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Foundations/Design System",
  parameters: {
    controls: { disable: true },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const colorTokens = [
  ["App background", "--editor-app-bg"],
  ["Surface", "--editor-surface"],
  ["Surface muted", "--editor-surface-muted"],
  ["Border", "--editor-border"],
  ["Border strong", "--editor-border-strong"],
  ["Text", "--editor-text"],
  ["Text muted", "--editor-text-muted"],
  ["Text soft", "--editor-text-soft"],
  ["Accent", "--editor-accent"],
  ["Accent hover", "--editor-accent-hover"],
  ["Accent soft", "--editor-accent-soft"],
  ["Accent border", "--editor-accent-border"],
  ["Selected", "--editor-selected"],
  ["Selected soft", "--editor-selected-soft"],
  ["Success", "--editor-success"],
  ["Danger", "--editor-danger"],
] as const;

function TokenSwatch({ label, token }: { label: string; token: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)]">
      <div className="h-20" style={{ background: `var(${token})` }} />
      <div className="space-y-1 border-t border-[var(--editor-border)] p-3">
        <div className="text-xs font-semibold text-[var(--editor-text)]">{label}</div>
        <code className="text-[10px] text-[var(--editor-text-muted)]">{token}</code>
      </div>
    </div>
  );
}

export const Overview: Story = {
  render: () => (
    <div className="mx-auto max-w-6xl space-y-10">
      <section className="space-y-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--editor-accent)]">
          SCADAtomic UI framework
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Design system foundations</h1>
        <p className="max-w-2xl text-sm leading-6 text-[var(--editor-text-muted)]">
          Shared visual tokens and primitives used to build the editor and cloud UI. This Storybook intentionally excludes runtime, tag, execution and domain-specific components.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Color tokens</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {colorTokens.map(([label, token]) => (
            <TokenSwatch key={token} label={label} token={token} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)] p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">Typography</div>
          <div className="mt-5 space-y-4">
            <div className="text-3xl font-semibold tracking-tight">Page title</div>
            <div className="text-lg font-semibold">Section heading</div>
            <div className="text-sm font-medium">Body / control label</div>
            <div className="text-xs text-[var(--editor-text-muted)]">Secondary information and helper copy</div>
            <div className="text-[10px] uppercase tracking-wide text-[var(--editor-text-soft)]">Compact metadata</div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)] p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">Surfaces</div>
          <div className="mt-5 space-y-3">
            <div className="rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)] p-4 text-sm">Primary surface</div>
            <div className="rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] p-4 text-sm">Muted surface</div>
            <div className="rounded-xl border border-[var(--editor-accent-border)] bg-[var(--editor-accent-soft)] p-4 text-sm text-[var(--editor-accent)]">Accent surface</div>
          </div>
        </div>
      </section>
    </div>
  ),
};
