import Link from "next/link";
import { LogoutButton } from "../auth/logout-button";
import { Card } from "../ui/card";

function formatPanelTitle(title: string) {
  const trimmed = title.trim();
  if (trimmed.toLowerCase() === "dashboard") {
    return "Dashboard";
  }

  const normalized = trimmed
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

  if (normalized.toLowerCase().endsWith(" dashboard")) {
    return normalized;
  }

  return `${normalized} Dashboard`;
}

export function DashboardShell({
  title,
  description,
  children,
  links,
  hideNavigation = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  links: Array<{ href: string; label: string }>;
  hideNavigation?: boolean;
}) {
  return (
    <main className={`mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-10 ${hideNavigation ? "" : "lg:flex-row"}`}>
      {hideNavigation ? null : (
        <aside className="w-full lg:w-72">
          <Card className="sticky top-6 bg-ink text-white">
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">Migration Agency MVP</p>
            <h1 className="mt-4 text-3xl font-semibold">{formatPanelTitle(title)}</h1>
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
      )}
      <section className="flex-1">{children}</section>
    </main>
  );
}
