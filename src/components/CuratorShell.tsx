import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { BookOpen, CalendarDays, LayoutDashboard, LogOut, Users } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import { CURATOR } from "@/lib/mock-data";
import { Avatar, Logo } from "./shared";

const nav = [
  { to: "/curator", label: "Обзор", icon: LayoutDashboard },
  { to: "/curator/students", label: "Ученики", icon: Users },
  { to: "/curator/course", label: "Курс", icon: BookOpen },
  { to: "/curator/schedule", label: "Расписание", icon: CalendarDays },
] as const;

export function CuratorShell({ children }: { children: ReactNode }) {
  const { ready, session, logout } = useApp();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (ready && (!session || session.role !== "curator")) navigate({ to: "/" });
  }, [ready, session, navigate]);

  if (!ready || session?.role !== "curator") return <div className="min-h-screen bg-background" />;

  const isActive = (to: string) =>
    to === "/curator" ? pathname === "/curator" : pathname.startsWith(to);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-surface px-4 py-6 lg:flex">
        <Logo />
        <span className="mt-3 w-fit rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
          Кабинет куратора
        </span>
        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                isActive(item.to)
                  ? "bg-primary-soft text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-[18px]" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="rounded-2xl bg-muted/70 p-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar name={CURATOR.name} tone="var(--tone-2)" size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{CURATOR.name}</p>
              <p className="text-[11px] text-muted-foreground">Куратор · Преподаватель</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate({ to: "/" });
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-3.5" /> Выйти
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface/85 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <button
          onClick={() => {
            logout();
            navigate({ to: "/" });
          }}
          aria-label="Выйти"
          className="grid size-9 place-items-center rounded-xl border border-border text-muted-foreground"
        >
          <LogOut className="size-4" />
        </button>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 lg:pl-64 lg:pr-6 lg:pt-8 lg:pb-12">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-xs font-bold",
                isActive(item.to) ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "grid size-11 place-items-center rounded-xl",
                  isActive(item.to) && "bg-primary-soft",
                )}
              >
                <item.icon className="size-6" />
              </span>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}
