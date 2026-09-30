import { Activity, Boxes, Cloud, Database, ShieldCheck, Workflow } from "lucide-react";
import { LoginForm } from "./LoginForm";

const PLATFORM_SIGNALS = [
  { icon: Workflow, label: "Versioned engineering model" },
  { icon: Activity, label: "Deterministic runtime contracts" },
  { icon: Cloud, label: "Cloud + edge deployment ready" },
] as const;

export function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f5f6fa] text-zinc-950">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.08fr)_minmax(520px,0.92fr)]">
        <section className="relative hidden overflow-hidden bg-[#101018] px-12 py-10 text-white lg:flex lg:flex-col xl:px-16 xl:py-14">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-90"
            style={{
              background:
                "radial-gradient(circle at 18% 10%, rgba(99,102,241,.33), transparent 34%), radial-gradient(circle at 82% 68%, rgba(59,130,246,.17), transparent 30%), linear-gradient(145deg, #0d0d15 0%, #141421 48%, #0c0c13 100%)",
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.055]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.55) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.55) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative z-10 flex items-center justify-between">
            <img src="/logo6.svg" alt="SCADAtomic" className="h-9 w-auto brightness-0 invert" />
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 py-1.5 text-[11px] font-medium text-white/60 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,.1)]" />
              Engineering cloud online
            </div>
          </div>

          <div className="relative z-10 my-auto max-w-[640px] py-14">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-300/15 bg-indigo-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.17em] text-indigo-200">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.8} />
              SCADAtomic engineering platform
            </div>

            <h2 className="max-w-[610px] text-[clamp(2.6rem,5vw,4.8rem)] font-semibold leading-[0.98] tracking-[-0.055em] text-white">
              Build systems that stay predictable.
            </h2>
            <p className="mt-7 max-w-[560px] text-[16px] leading-7 text-white/52">
              Design, simulate, version and deploy industrial applications from one engineering model — without coupling the editor to the runtime.
            </p>

            <div className="mt-10 grid max-w-[590px] gap-2.5">
              {PLATFORM_SIGNALS.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-2xl border border-white/[0.075] bg-white/[0.045] px-4 py-3.5 text-[13px] text-white/72 backdrop-blur-sm"
                >
                  <div className="grid h-8 w-8 place-items-center rounded-lg border border-indigo-300/15 bg-indigo-400/10 text-indigo-200">
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                  </div>
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 backdrop-blur-sm">
              <Boxes className="mb-5 h-4 w-4 text-indigo-300" strokeWidth={1.8} />
              <div className="text-[11px] uppercase tracking-[0.13em] text-white/35">Designer</div>
              <div className="mt-1 text-[13px] font-medium text-white/74">Visual engineering</div>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 backdrop-blur-sm">
              <Database className="mb-5 h-4 w-4 text-indigo-300" strokeWidth={1.8} />
              <div className="text-[11px] uppercase tracking-[0.13em] text-white/35">Model</div>
              <div className="mt-1 text-[13px] font-medium text-white/74">Versioned contracts</div>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 backdrop-blur-sm">
              <Activity className="mb-5 h-4 w-4 text-indigo-300" strokeWidth={1.8} />
              <div className="text-[11px] uppercase tracking-[0.13em] text-white/35">Runtime</div>
              <div className="mt-1 text-[13px] font-medium text-white/74">Edge deterministic</div>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-screen items-center justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-20">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-64 opacity-70"
            style={{
              background:
                "radial-gradient(circle at 62% -20%, rgba(99,102,241,.16), transparent 50%)",
            }}
          />

          <div className="relative z-10 w-full max-w-[440px]">
            <div className="mb-12 flex items-center justify-between lg:hidden">
              <img src="/logo6.svg" alt="SCADAtomic" className="h-9 w-auto" />
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 shadow-sm">
                Developer preview
              </span>
            </div>

            <LoginForm />

            <div className="mt-10 flex items-center justify-center gap-4 text-[11px] text-zinc-400">
              <button type="button" className="transition hover:text-zinc-600">Status</button>
              <span className="h-1 w-1 rounded-full bg-zinc-300" />
              <button type="button" className="transition hover:text-zinc-600">Security</button>
              <span className="h-1 w-1 rounded-full bg-zinc-300" />
              <span>© 2026 SCADAtomic</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
