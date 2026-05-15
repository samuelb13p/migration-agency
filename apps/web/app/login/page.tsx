import Link from "next/link";
import { LoginForm } from "../../components/auth/login-form";
import { Card } from "../../components/ui/card";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.14),_transparent_32%),linear-gradient(180deg,_#f7fafc_0%,_#edf6f5_100%)]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-10">
        <div className="grid w-full gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="relative overflow-hidden bg-ink text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(148,210,189,0.18),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.08),_transparent_30%)]" />
            <div className="relative">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Migration Agency Workspace</p>
              <h1 className="mt-5 max-w-lg text-5xl font-semibold leading-tight">One Portal For Every Migration Case.</h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/78">
                Secure uploads, guided reviews, and contract handling for customers, agents, and admins.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/8 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/55">Private Files</p>
                  <p className="mt-2 text-sm text-white/82">Protected document access and controlled downloads.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/8 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/55">Live Review</p>
                  <p className="mt-2 text-sm text-white/82">Track uploads, requests, and approvals in one flow.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/8 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/55">Contracts</p>
                  <p className="mt-2 text-sm text-white/82">Read, accept, and store contracts in one secure place.</p>
                </div>
              </div>
            </div>
          </Card>
          <Card className="bg-white/92">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Welcome Back</p>
            <h2 className="mt-3 text-3xl font-semibold text-ink">Sign in</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">Access your migration workspace with your email and password.</p>
            <LoginForm />
            <p className="mt-5 text-sm text-slate-500">
              New customer?{" "}
              <Link href="/register" className="font-semibold text-accent">
                Create an account
              </Link>
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}
