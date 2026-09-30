import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Mail,
  ShieldCheck,
} from "lucide-react";

type LoginFormProps = {
  onPlaceholderSubmit?: () => void;
};

export function LoginForm({ onPlaceholderSubmit }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Authentication backend is not connected yet.");
    onPlaceholderSubmit?.();
  }

  return (
    <div className="w-full max-w-[440px]">
      <div className="mb-9">
        <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
          <ShieldCheck className="h-4 w-4" strokeWidth={1.8} />
          Secure workspace access
        </div>
        <h1 className="text-[2.05rem] font-semibold tracking-[-0.04em] text-zinc-950">
          Welcome back
        </h1>
        <p className="mt-2.5 max-w-sm text-[15px] leading-6 text-zinc-500">
          Sign in to your SCADAtomic engineering workspace.
        </p>
      </div>

      <form className="space-y-5" onSubmit={submit}>
        <label className="block">
          <span className="mb-2 block text-[13px] font-medium text-zinc-700">Email</span>
          <div className="group relative">
            <Mail
              className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-indigo-500"
              strokeWidth={1.8}
            />
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@company.com"
              className="h-12 w-full rounded-xl border border-zinc-200 bg-white pl-11 pr-4 text-[14px] text-zinc-950 outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
        </label>

        <label className="block">
          <div className="mb-2 flex items-center justify-between gap-4">
            <span className="text-[13px] font-medium text-zinc-700">Password</span>
            <button
              type="button"
              className="text-[12px] font-medium text-indigo-600 transition hover:text-indigo-700"
            >
              Forgot password?
            </button>
          </div>
          <div className="group relative">
            <KeyRound
              className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-indigo-500"
              strokeWidth={1.8}
            />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              className="h-12 w-full rounded-xl border border-zinc-200 bg-white pl-11 pr-11 text-[14px] text-zinc-950 outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            >
              {showPassword ? (
                <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.8} />
              ) : (
                <Eye className="h-[18px] w-[18px]" strokeWidth={1.8} />
              )}
            </button>
          </div>
        </label>

        <div className="flex items-center justify-between gap-4">
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-zinc-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-300 text-indigo-600 accent-indigo-600"
            />
            Keep me signed in
          </label>
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">
            Developer preview
          </span>
        </div>

        <button
          type="submit"
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-[14px] font-semibold text-white shadow-[0_12px_30px_rgba(24,24,27,0.16)] transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-zinc-950/10"
        >
          Sign in
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            strokeWidth={2}
          />
        </button>
      </form>

      <div className="my-7 flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-200" />
        <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-400">
          or continue with
        </span>
        <div className="h-px flex-1 bg-zinc-200" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white text-[13px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
        >
          <span className="grid h-5 w-5 place-items-center rounded-[5px] bg-[#2563eb] text-[10px] font-bold text-white">
            M
          </span>
          Microsoft
        </button>
        <button
          type="button"
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white text-[13px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
        >
          <Fingerprint className="h-[18px] w-[18px] text-indigo-600" strokeWidth={1.8} />
          Passkey
        </button>
      </div>

      {message ? (
        <div
          role="status"
          className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-[12px] leading-5 text-indigo-700"
        >
          {message}
        </div>
      ) : null}

      <p className="mt-8 text-center text-[12px] leading-5 text-zinc-400">
        By continuing, you agree to the workspace security policy and audit logging rules.
      </p>
    </div>
  );
}
