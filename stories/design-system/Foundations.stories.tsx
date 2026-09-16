import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import {
  editorBorders,
  editorColorTokens,
  editorFontSizes,
  DatabaseIcon,
  editorFontWeights,
  editorIconSizes,
  editorIconStrokeWidths,
  editorIconTones,
  editorRadii,
  editorShadows,
  editorSpacing,
} from "../../src/uiframework/gui/ui";

const meta = {
  title: "Foundations/Tokens",
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function TokenCard({ label, value, preview }: { label: string; value: string; preview?: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)]">
      {preview}
      <div className="space-y-1 border-t border-[var(--editor-border)] p-3 first:border-t-0">
        <div className="text-xs font-semibold text-[var(--editor-text)]">{label}</div>
        <code className="break-all text-[10px] text-[var(--editor-text-muted)]">{value}</code>
      </div>
    </div>
  );
}

export const Colors: Story = {
  render: () => (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--editor-accent)]">Foundations</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Semantic color tokens</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--editor-text-muted)]">Feature components consume semantic editor tokens instead of hard-coding product colors.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {Object.entries(editorColorTokens).map(([label, variable]) => (
          <TokenCard key={variable} label={label} value={variable} preview={<div className="h-20" style={{ background: `var(${variable})` }} />} />
        ))}
      </div>
    </div>
  ),
};

export const SpacingRadiusAndShadow: Story = {
  render: () => (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Spacing</h2>
        {Object.entries(editorSpacing).map(([name, value]) => (
          <div key={name} className="flex items-center gap-3 text-xs"><code className="w-12 text-[var(--editor-text-muted)]">{name}</code><div className="h-3 bg-[var(--editor-accent)]" style={{ width: value }} /><span>{value}</span></div>
        ))}
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Radius</h2>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(editorRadii).map(([name, value]) => <TokenCard key={name} label={name} value={value} preview={<div className="m-3 h-16 bg-[var(--editor-accent-soft)]" style={{ borderRadius: value }} />} />)}
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Shadows</h2>
        {Object.entries(editorShadows).map(([name, value]) => <TokenCard key={name} label={name} value={value} preview={<div className="m-5 h-16 rounded-lg bg-white" style={{ boxShadow: value }} />} />)}
      </section>
    </div>
  ),
};

export const TypographyAndBorders: Story = {
  render: () => (
    <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
      <section className="rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)] p-5">
        <h2 className="text-sm font-semibold">Typography scale</h2>
        <div className="mt-5 space-y-4">
          {Object.entries(editorFontSizes).map(([name, value]) => <div key={name} style={{ fontSize: value }}><span className="font-semibold">{name}</span> <code className="text-[10px] text-[var(--editor-text-muted)]">{value}</code></div>)}
        </div>
        <div className="mt-6 flex gap-4 text-xs">
          {Object.entries(editorFontWeights).map(([name, value]) => <span key={name} style={{ fontWeight: value }}>{name}</span>)}
        </div>
      </section>
      <section className="rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)] p-5">
        <h2 className="text-sm font-semibold">Borders</h2>
        <div className="mt-5 space-y-4">
          {Object.entries(editorBorders).map(([name, value]) => <div key={name} className="rounded-lg p-4 text-xs" style={{ border: value }}><strong>{name}</strong><code className="ml-2 text-[10px] text-[var(--editor-text-muted)]">{value}</code></div>)}
        </div>
      </section>
    </div>
  ),
};


export const IconTokens: Story = {
  render: () => (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
      <section className="space-y-3 rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)] p-5">
        <h2 className="text-sm font-semibold">Icon sizes</h2>
        <div className="flex flex-wrap items-end gap-5">
          {Object.entries(editorIconSizes).map(([name, value]) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <DatabaseIcon size={name as keyof typeof editorIconSizes} tone="accent" />
              <code className="text-[10px] text-[var(--editor-text-muted)]">{name} · {value}px</code>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)] p-5">
        <h2 className="text-sm font-semibold">Icon stroke</h2>
        <div className="flex flex-wrap items-end gap-5">
          {Object.entries(editorIconStrokeWidths).map(([name, value]) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <DatabaseIcon size="xl" weight={name as keyof typeof editorIconStrokeWidths} />
              <code className="text-[10px] text-[var(--editor-text-muted)]">{name} · {value}</code>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)] p-5">
        <h2 className="text-sm font-semibold">Icon tones</h2>
        <div className="flex flex-wrap items-end gap-5">
          {Object.keys(editorIconTones).map((name) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <DatabaseIcon size="lg" tone={name as keyof typeof editorIconTones} />
              <code className="text-[10px] text-[var(--editor-text-muted)]">{name}</code>
            </div>
          ))}
        </div>
      </section>
    </div>
  ),
};
