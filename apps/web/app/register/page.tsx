import Link from "next/link";
import { RegisterForm } from "../../components/auth/register-form";
import { Card } from "../../components/ui/card";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-10">
      <Card className="w-full">
        <h1 className="text-3xl font-semibold">Create account</h1>
        <RegisterForm />
        <p className="mt-4 text-sm text-slate-500">
          Already registered? <Link href="/login" className="font-semibold text-accent">Sign in</Link>
        </p>
      </Card>
    </main>
  );
}
