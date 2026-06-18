// EditorLayout.tsx

export function Toolbar() {
  return (
    <header
      className="
        h-20
        shrink-0

        px-8

        flex
        items-center
        justify-between

        bg-white
        border-b
        border-zinc-200
      "
    >
      {/* BRAND */}

      <div
        className="
          flex
          items-center
          gap-3
        "
      >
        <img
          src="/logo.svg"
          alt="Scadatomic"
          className="
            h-12
            w-auto
            shrink-0
          "
        />

        <div className="leading-tight">
          <div
            className="
              text-2xl
              font-bold
              text-zinc-900
            "
          >
            scadatomic
          </div>

          <div
            className="
              text-sm
              text-zinc-500
            "
          >
            Visual Designer
          </div>
        </div>
      </div>

      {/* ACTIONS */}

      <div
        className="
          flex
          items-center
          gap-2
        "
      >
        <button
          className="
            h-9
            px-4

            rounded-md

            border
            border-zinc-200

            bg-white

            text-sm
            font-medium

            hover:bg-zinc-50
          "
        >
          Preview
        </button>

        <button
          className="
            h-9
            px-4

            rounded-md

            bg-sky-600
            text-white

            text-sm
            font-medium

            hover:bg-sky-500
          "
        >
          Run
        </button>
      </div>
    </header>
  );
}

export function LeftSidebar({
  children,
}: React.PropsWithChildren) {
  return (
    <aside
      className="
        w-80
        shrink-0
        bg-white
        border-r
        border-zinc-200
        overflow-auto
      "
    >
      <div className="px-6 py-7 space-y-7">
        {children}
      </div>
    </aside>
  );
}

export function Canvas({
  children,
}: React.PropsWithChildren) {
  return (
    <main
      className="
        flex-1
        overflow-auto
        relative
        bg-zinc-100
      "
    >
      {children}
    </main>
  );
}
export function RightSidebar({
  children,
}: React.PropsWithChildren) {
  return (
    <aside
      className="
        w-80
        shrink-0
        bg-white
        border-l
        border-zinc-200
        overflow-auto
      "
    >
      {children}
    </aside>
  );
}

export function StatusBar() {
  return (
    <div
      className="
        h-7
        shrink-0
        px-4
        flex
        items-center
        border-t
        border-zinc-200
        bg-white
        text-xs
        text-zinc-500
      "
    >
      Ready
    </div>
  );
}