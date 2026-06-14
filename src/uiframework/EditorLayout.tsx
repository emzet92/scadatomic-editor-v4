// EditorLayout.tsx

export function Toolbar() {
  return <div className="h-14 border-b flex items-center px-4 shrink-0"><b>Scada</b>tomic</div>;
}

export function LeftSidebar({
  children,
}: React.PropsWithChildren) {
  return <div className="w-72 border-r overflow-auto p-4 shrink-0">{children}</div>;
}

export function Canvas({
  children,
}: React.PropsWithChildren) {
  return <div className="flex-1 overflow-auto relative p-8">{children}</div>;
}

export function RightSidebar({
  children,
}: React.PropsWithChildren) {
  const className = `
w-96
border-l
border-zinc-800
bg-zinc-950
overflow-auto
p-4
shrink-0
`;

  return <div className={className}>{children}</div>;
}

export function StatusBar() {
  return <div className="h-6 border-t px-3 flex items-center text-xs shrink-0">Status</div>;
}