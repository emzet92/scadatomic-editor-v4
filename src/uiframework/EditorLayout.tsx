// EditorLayout.tsx

export function Toolbar() {
  return <div className="
    h-14
    px-4
    flex
    items-center
    justify-between
    bg-white
    border-b
    border-zinc-200"><span><b>Scada</b>tomic</span></div>;
}

export function LeftSidebar({
  children,
}: React.PropsWithChildren) {
  return <div className="
    w-72
    bg-white
    border-r
    border-zinc-200
    flex
    flex-col
    overflow-auto">{children}</div>;
}

export function Canvas({
  children,
}: React.PropsWithChildren) {
  return <div  className="
    flex-1
    overflow-auto
    relative
    bg-zinc-100
    p-8">{children}</div>;
}

export function RightSidebar({
  children,
}: React.PropsWithChildren) {
  const className = `
    w-80
    bg-white
    border-l
    border-zinc-200
    flex
    flex-col
    overflow-auto
`;

  return <div className={className}>{children}</div>;
}

export function StatusBar() {
  return <div className="h-6 border-t px-3 flex items-center text-xs shrink-0">Status</div>;
}