import { Copy, KeyRound, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button, PanelCard, SectionHeader } from "../../uiframework/gui/ui";
import type { RegistrationKey } from "../model/fleet";

export function RegistrationKeysPanel({
  keys,
  onCreate,
  onDelete,
}: {
  keys: RegistrationKey[];
  onCreate(): void;
  onDelete(keyId: string): Promise<void>;
}) {
  return (
    <PanelCard className="space-y-4 rounded-xl p-4 shadow-sm">
      <SectionHeader
        title="Edge registration keys"
        description="Enrollment credentials for new agents. Stored locally in IndexedDB in development."
        action={
          <Button variant="primary" size="sm" onClick={onCreate}>
            <KeyRound size={13} />
            Create key
          </Button>
        }
      />

      {keys.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--editor-border)] px-4 py-8 text-center">
          <KeyRound className="mx-auto text-[var(--editor-text-soft)]" size={22} />
          <div className="mt-2 text-xs font-medium text-[var(--editor-text)]">No active registration keys</div>
          <div className="mt-1 text-[10px] text-[var(--editor-text-soft)]">Create a key to enroll the next Edge Agent.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((key) => (
            <RegistrationKeyRow key={key.id} registrationKey={key} onDelete={onDelete} />
          ))}
        </div>
      )}
    </PanelCard>
  );
}

function RegistrationKeyRow({
  registrationKey,
  onDelete,
}: {
  registrationKey: RegistrationKey;
  onDelete(keyId: string): Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(registrationKey.token);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="rounded-lg border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] p-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-[var(--editor-text)]">{registrationKey.name}</div>
          <div className="mt-1 truncate font-mono text-[10px] text-[var(--editor-text-muted)]">
            {maskToken(registrationKey.token)}
          </div>
          <div className="mt-2 text-[9px] text-[var(--editor-text-soft)]">
            Created {formatDate(registrationKey.createdAt)} · {registrationKey.expiresAt ? `expires ${formatDate(registrationKey.expiresAt)}` : "does not expire"}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button size="icon-xs" variant="ghost" title="Copy key" aria-label="Copy key" onClick={() => void copy()}>
            <Copy size={12} />
          </Button>
          <Button
            size="icon-xs"
            variant="danger"
            title="Delete key"
            aria-label="Delete key"
            disabled={deleting}
            onClick={() => {
              setDeleting(true);
              void onDelete(registrationKey.id).finally(() => setDeleting(false));
            }}
          >
            <Trash2 size={12} />
          </Button>
        </div>
      </div>
      {copied ? <div className="mt-2 text-[9px] font-medium text-green-700">Copied to clipboard</div> : null}
    </div>
  );
}

function maskToken(token: string) {
  if (token.length <= 18) return token;
  return `${token.slice(0, 13)}••••••••${token.slice(-6)}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
