import { KeyRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button, Dialog, FormField, Select, TextInput } from "../../uiframework/gui/ui";
import type { RegistrationKey } from "../model/fleet";

export function RegistrationKeyDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose(): void;
  onCreate(input: { name: string; expiresInHours: number | null }): Promise<RegistrationKey>;
}) {
  const [name, setName] = useState("Factory edge enrollment");
  const [expires, setExpires] = useState("168");
  const [submitting, setSubmitting] = useState(false);
  const [createdKey, setCreatedKey] = useState<RegistrationKey | null>(null);
  const [copied, setCopied] = useState(false);

  const close = () => {
    if (submitting) return;
    setCreatedKey(null);
    setCopied(false);
    onClose();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const key = await onCreate({
        name,
        expiresInHours: expires === "never" ? null : Number(expires),
      });
      setCreatedKey(key);
    } finally {
      setSubmitting(false);
    }
  };

  const copy = async () => {
    if (!createdKey) return;
    await navigator.clipboard.writeText(createdKey.token);
    setCopied(true);
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title={createdKey ? "Registration key created" : "Create Edge registration key"}
      description={
        createdKey
          ? "Use this token when provisioning a new SCADAtomic Edge Agent."
          : "The local development adapter persists the key in IndexedDB. Later the same request will be handled by the Cloud backend."
      }
      icon={
        <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]">
          <KeyRound size={17} />
        </div>
      }
      footer={
        createdKey ? (
          <Button variant="primary" onClick={close}>Done</Button>
        ) : (
          <>
            <Button onClick={close}>Cancel</Button>
            <Button variant="primary" form="create-edge-registration-key" type="submit" disabled={submitting || !name.trim()}>
              {submitting ? "Creating…" : "Create key"}
            </Button>
          </>
        )
      }
    >
      {createdKey ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--editor-accent-border)] bg-[var(--editor-accent-soft)] p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--editor-accent)]">
              Enrollment token
            </div>
            <div className="mt-2 break-all rounded-lg border border-[var(--editor-accent-border)] bg-white/70 p-3 font-mono text-xs text-[var(--editor-text)]">
              {createdKey.token}
            </div>
            <Button className="mt-3" size="sm" onClick={() => void copy()}>
              {copied ? "Copied" : "Copy token"}
            </Button>
          </div>
          <p className="text-xs leading-5 text-[var(--editor-text-muted)]">
            Treat registration keys as secrets. The future backend adapter can return a one-time token while the UI contract stays unchanged.
          </p>
        </div>
      ) : (
        <form id="create-edge-registration-key" onSubmit={(event) => void submit(event)} className="space-y-4">
          <FormField label="Key name" description="A human-readable name for the enrollment workflow.">
            <TextInput value={name} onChange={(event) => setName(event.target.value)} autoFocus />
          </FormField>
          <FormField label="Expires after">
            <Select value={expires} onChange={(event) => setExpires(event.target.value)}>
              <option value="24">24 hours</option>
              <option value="168">7 days</option>
              <option value="720">30 days</option>
              <option value="never">Never</option>
            </Select>
          </FormField>
        </form>
      )}
    </Dialog>
  );
}
