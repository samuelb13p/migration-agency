import Link from "next/link";
import { LogoutButton } from "../auth/logout-button";
import { Card } from "../ui/card";

export function DashboardShell({
  title,
  description,
  children,
  links,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-10 lg:flex-row">
      <aside className="w-full lg:w-72">
        <Card className="sticky top-6 bg-ink text-white">
          <p className="text-xs uppercase tracking-[0.35em] text-white/70">Migration Agency MVP</p>
          <h1 className="mt-4 text-3xl font-semibold">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-white/75">{description}</p>
          <nav className="mt-8 flex flex-col gap-3">
            {links.map((link) => (
              <Link key={link.href} href={link.href as never} className="rounded-2xl bg-white/10 px-4 py-3 text-sm transition hover:bg-white/20">
                {link.label}
              </Link>
            ))}
          </nav>
          <LogoutButton />
        </Card>
      </aside>
      <section className="flex-1">{children}</section>
    </main>
  );
}
