import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { BookOpen, Home, LogOut, User, Video } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import { Avatar, Logo } from "./shared";

const nav = [
  { to: "/dashboard", label: "Главная", icon: Home },
  { to: "/learn", label: "Учёба", icon: BookOpen },
  { to: "/practice", label: "Практика", icon: Video },
  { to: "/profile", label: "Профиль", icon: User },
] as const;

export function StudentShell({ children }: { children: ReactNode }) {
  const { ready, session, currentStudent, logout } = useApp();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (ready && (!session || session.role !== "student")) {
      navigate({ to: "/" });
    }
  }, [ready, session, navigate]);

  if (!ready || !currentStudent) {
    return <div className="min-h-screen bg-background" />;
  }

  const fullName = `${currentStudent.firstName} ${currentStudent.lastName}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-surface px-4 py-6 lg:flex">
        <Logo />
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {nav.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary-soft text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="size-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="rounded-2xl bg-muted/70 p-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar name={fullName} tone={currentStudent.avatarTone} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{currentStudent.firstName}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {currentStudent.type === "GROUP" ? "Группа" : "Индивидуально"}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate({ to: "/" });
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="size-3.5" /> Выйти
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface/85 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <div className="flex items-center gap-2">
          <Avatar name={fullName} tone={currentStudent.avatarTone} size="sm" />
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
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 lg:pl-64 lg:pr-6 lg:pt-8 lg:pb-12">
        <div className="lg:max-w-4xl">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {nav.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-xs font-bold transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid size-11 place-items-center rounded-xl transition-colors",
                    active && "bg-primary-soft",
                  )}
                >
                  <item.icon className="size-6" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}
