import Link from "next/link";
import { LoginForm } from "../../components/auth/login-form";
import { Card } from "../../components/ui/card";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-10">
      <div className="grid w-full gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-ink text-white">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">Secure Document Workflow</p>
          <h1 className="mt-5 text-5xl font-semibold leading-tight">Migration cases, uploads, reviews, and contracts in one secure portal.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/78">
            This MVP is structured for production evolution, with private file handling, role-aware workspaces, and case completeness tracking.
          </p>
        </Card>
        <Card>
          <h2 className="text-2xl font-semibold">Sign in</h2>
          <LoginForm />
          <p className="mt-4 text-sm text-slate-500">
            New customer? <Link href="/register" className="font-semibold text-accent">Create an account</Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
