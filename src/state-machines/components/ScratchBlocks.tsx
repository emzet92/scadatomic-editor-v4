import { Plus, Trash2 } from "lucide-react";
import type {
  ComparisonOperator,
  GuardExpression,
  MachineValue,
  StateMachineAction,
  TransitionDefinition,
  TransitionTrigger,
  ValueRef,
} from "../domain/state-machine-definition";
import { Button, Select, TextInput } from "../../shared/ui";

export function TransitionScratchEditor({
  transition,
  stateOptions,
  tagPaths,
  onChange,
}: {
  transition: TransitionDefinition;
  stateOptions: Array<{ id: string; name: string }>;
  tagPaths: string[];
  onChange: (next: TransitionDefinition) => void;
}) {
  const conditions = guardToEditableList(transition.guard);

  return (
    <div className="space-y-2">
      <ScratchBlock tone="violet" label="WHEN">
        <TriggerEditor trigger={transition.trigger} onChange={(trigger) => onChange({ ...transition, trigger })} />
      </ScratchBlock>

      {conditions.map((condition, index) => (
        <ScratchBlock key={index} tone="cyan" label={index === 0 ? "IF" : "AND"} removable onRemove={() => {
          const next = conditions.filter((_, itemIndex) => itemIndex !== index);
          onChange({ ...transition, ...(next.length ? { guard: listToGuard(next) } : { guard: undefined }) });
        }}>
          <ConditionEditor
            expression={condition}
            tagPaths={tagPaths}
            onChange={(expression) => {
              const next = conditions.map((item, itemIndex) => itemIndex === index ? expression : item);
              onChange({ ...transition, guard: listToGuard(next) });
            }}
          />
        </ScratchBlock>
      ))}

      <Button
        size="xs"
        variant="ghost"
        onClick={() => onChange({
          ...transition,
          guard: listToGuard([...conditions, defaultCondition(tagPaths[0])]),
        })}
      >
        <Plus size={12} /> condition
      </Button>

      <ActionBlockList
        actions={transition.actions}
        tagPaths={tagPaths}
        onChange={(actions) => onChange({ ...transition, actions })}
      />

      <ScratchBlock tone="emerald" label="GO TO">
        <Select
          controlSize="sm"
          value={transition.to}
          onChange={(event) => onChange({ ...transition, to: event.target.value })}
        >
          {stateOptions.map((state) => <option key={state.id} value={state.id}>{state.name}</option>)}
        </Select>
      </ScratchBlock>
    </div>
  );
}

export function ActionBlockList({
  actions,
  tagPaths,
  onChange,
  label = "THEN",
}: {
  actions: StateMachineAction[];
  tagPaths: string[];
  onChange: (actions: StateMachineAction[]) => void;
  label?: string;
}) {
  return (
    <div className="space-y-2">
      {actions.map((action, index) => (
        <ScratchBlock
          key={index}
          tone="amber"
          label={index === 0 ? label : "AND"}
          removable
          onRemove={() => onChange(actions.filter((_, itemIndex) => itemIndex !== index))}
        >
          <ActionEditor
            action={action}
            tagPaths={tagPaths}
            onChange={(next) => onChange(actions.map((item, itemIndex) => itemIndex === index ? next : item))}
          />
        </ScratchBlock>
      ))}
      <div className="flex flex-wrap gap-1.5">
        <Button size="xs" variant="ghost" onClick={() => onChange([...actions, { kind: "set-tag", path: tagPaths[0] ?? "Machine.Command", value: true }])}><Plus size={12} /> set tag</Button>
        <Button size="xs" variant="ghost" onClick={() => onChange([...actions, { kind: "emit-event", event: "machine.event" }])}><Plus size={12} /> emit</Button>
        <Button size="xs" variant="ghost" onClick={() => onChange([...actions, { kind: "set-context", key: "counter", value: 0 }])}><Plus size={12} /> context</Button>
      </div>
    </div>
  );
}

function TriggerEditor({ trigger, onChange }: { trigger: TransitionTrigger; onChange: (trigger: TransitionTrigger) => void }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2">
      <Select
        controlSize="sm"
        value={trigger.kind}
        onChange={(event) => {
          const kind = event.target.value as TransitionTrigger["kind"];
          onChange(kind === "event" ? { kind, event: "START" } : kind === "after" ? { kind, delayMs: 1000 } : { kind });
        }}
      >
        <option value="event">event</option>
        <option value="condition">condition</option>
        <option value="after">after</option>
      </Select>
      {trigger.kind === "event" ? (
        <TextInput controlSize="sm" mono value={trigger.event} onChange={(event) => onChange({ ...trigger, event: event.target.value })} />
      ) : trigger.kind === "after" ? (
        <div className="flex items-center gap-2">
          <TextInput controlSize="sm" type="number" min={0} value={trigger.delayMs} onChange={(event) => onChange({ ...trigger, delayMs: Math.max(0, Number(event.target.value) || 0) })} />
          <span className="text-[10px] font-semibold text-white/90">ms</span>
        </div>
      ) : (
        <div className="flex items-center text-[10px] font-semibold text-white/90">re-evaluate when inputs change</div>
      )}
    </div>
  );
}

type CompareGuard = Extract<GuardExpression, { kind: "compare" }>;

function ConditionEditor({ expression, tagPaths, onChange }: { expression: GuardExpression; tagPaths: string[]; onChange: (expression: GuardExpression) => void }) {
  const comparison: CompareGuard = expression.kind === "compare" ? expression : defaultCondition(tagPaths[0]);
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[88px_1fr] gap-2">
        <Select
          controlSize="sm"
          value={comparison.left.kind}
          onChange={(event) => {
            const kind = event.target.value as ValueRef["kind"];
            onChange({ ...comparison, left: kind === "tag" ? { kind, path: tagPaths[0] ?? "Tag" } : { kind, key: "key" } });
          }}
        >
          <option value="tag">tag</option>
          <option value="context">context</option>
        </Select>
        {comparison.left.kind === "tag" && tagPaths.length ? (
          <Select controlSize="sm" mono value={comparison.left.path} onChange={(event) => onChange({ ...comparison, left: { kind: "tag", path: event.target.value } })}>
            {!tagPaths.includes(comparison.left.path) ? <option value={comparison.left.path}>{comparison.left.path}</option> : null}
            {tagPaths.map((path) => <option key={path} value={path}>{path}</option>)}
          </Select>
        ) : (
          <TextInput
            controlSize="sm"
            mono
            value={comparison.left.kind === "tag" ? comparison.left.path : comparison.left.key}
            onChange={(event) => onChange({ ...comparison, left: comparison.left.kind === "tag" ? { kind: "tag", path: event.target.value } : { kind: "context", key: event.target.value } })}
          />
        )}
      </div>
      <div className="grid grid-cols-[88px_1fr] gap-2">
        <Select controlSize="sm" value={comparison.operator} onChange={(event) => onChange({ ...comparison, operator: event.target.value as ComparisonOperator })}>
          <option value="eq">equals</option><option value="neq">not equal</option><option value="gt">&gt;</option><option value="gte">≥</option><option value="lt">&lt;</option><option value="lte">≤</option>
        </Select>
        <TextInput controlSize="sm" mono value={formatValue(comparison.right)} onChange={(event) => onChange({ ...comparison, right: parseValue(event.target.value) })} />
      </div>
    </div>
  );
}

function ActionEditor({ action, tagPaths, onChange }: { action: StateMachineAction; tagPaths: string[]; onChange: (action: StateMachineAction) => void }) {
  return (
    <div className="space-y-2">
      <Select
        controlSize="sm"
        value={action.kind}
        onChange={(event) => {
          const kind = event.target.value as StateMachineAction["kind"];
          onChange(kind === "set-tag" ? { kind, path: tagPaths[0] ?? "Machine.Command", value: true } : kind === "emit-event" ? { kind, event: "machine.event" } : { kind, key: "key", value: 0 });
        }}
      >
        <option value="set-tag">set tag</option><option value="emit-event">emit event</option><option value="set-context">set context</option>
      </Select>
      {action.kind === "set-tag" ? (
        <div className="grid grid-cols-[1fr_100px] gap-2">
          {tagPaths.length ? (
            <Select controlSize="sm" mono value={action.path} onChange={(event) => onChange({ ...action, path: event.target.value })}>
              {!tagPaths.includes(action.path) ? <option value={action.path}>{action.path}</option> : null}
              {tagPaths.map((path) => <option key={path} value={path}>{path}</option>)}
            </Select>
          ) : <TextInput controlSize="sm" mono value={action.path} onChange={(event) => onChange({ ...action, path: event.target.value })} />}
          <TextInput controlSize="sm" mono value={formatValue(action.value)} onChange={(event) => onChange({ ...action, value: parseValue(event.target.value) })} />
        </div>
      ) : action.kind === "emit-event" ? (
        <TextInput controlSize="sm" mono value={action.event} onChange={(event) => onChange({ ...action, event: event.target.value })} />
      ) : (
        <div className="grid grid-cols-[1fr_100px] gap-2">
          <TextInput controlSize="sm" mono value={action.key} onChange={(event) => onChange({ ...action, key: event.target.value })} />
          <TextInput controlSize="sm" mono value={formatValue(action.value)} onChange={(event) => onChange({ ...action, value: parseValue(event.target.value) })} />
        </div>
      )}
    </div>
  );
}

function ScratchBlock({ tone, label, children, removable, onRemove }: { tone: "violet" | "cyan" | "amber" | "emerald"; label: string; children: React.ReactNode; removable?: boolean; onRemove?: () => void }) {
  const toneClass = tone === "violet" ? "bg-violet-600 border-violet-700" : tone === "cyan" ? "bg-cyan-600 border-cyan-700" : tone === "amber" ? "bg-amber-500 border-amber-600" : "bg-emerald-600 border-emerald-700";
  return (
    <div className={`relative rounded-xl border p-2.5 text-white shadow-sm ${toneClass}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-[.14em]">{label}</span>
        {removable ? <button type="button" className="rounded p-0.5 text-white/70 hover:bg-white/15 hover:text-white" onClick={onRemove}><Trash2 size={12} /></button> : null}
      </div>
      {children}
      <div className="absolute -bottom-1.5 left-5 h-3 w-7 rounded-b-md bg-inherit" />
    </div>
  );
}

function defaultCondition(path = "Tag"): CompareGuard {
  return { kind: "compare", left: { kind: "tag", path }, operator: "eq", right: true };
}

function guardToEditableList(guard: GuardExpression | undefined): GuardExpression[] {
  if (!guard) return [];
  if (guard.kind === "and") return guard.expressions;
  return [guard];
}

function listToGuard(expressions: GuardExpression[]): GuardExpression {
  return expressions.length === 1 ? expressions[0]! : { kind: "and", expressions };
}

export function parseValue(raw: string): MachineValue {
  const trimmed = raw.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (trimmed !== "" && Number.isFinite(Number(trimmed))) return Number(trimmed);
  return raw;
}

export function formatValue(value: MachineValue) { return value === null ? "null" : String(value); }
