import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, PlayCircle, User2 } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/store";
import { Logo } from "@/components/shared";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Вход — Sozmor" },
      {
        name: "description",
        content:
          "Личный кабинет онлайн-школы английского: уроки, видео, расписание практик и прогресс в одном месте.",
      },
      { property: "og:title", content: "Sozmor" },
      {
        property: "og:description",
        content: "Курс, текущий урок, практика в Google Meet и прогресс — на одном экране.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, session, ready } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ login: "", password: "" });
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (ready && session) {
      navigate({ to: session.role === "curator" ? "/curator" : "/dashboard" });
    }
  }, [ready, session, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const role = login(form.login, form.password);
    if (!role) {
      toast.error("Неверный логин или пароль");
      return;
    }
    navigate({ to: role === "curator" ? "/curator" : "/dashboard" });
  };

  const fill = (l: string) => {
    setForm({ login: l, password: "test123" });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden gradient-hero p-12 text-primary-foreground lg:flex">
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-32 -left-16 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <img
            src="/logo-mark.png"
            alt=""
            aria-hidden="true"
            className="size-9 shrink-0 object-contain"
          />
          <div className="-ml-1 leading-none">
            <div className="text-[16px] font-extrabold tracking-tight">Sozmor</div>
            <div className="mt-1 text-[10px] font-bold tracking-wide text-white/70">
              Academy
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-5xl font-extrabold leading-[1.05]">
            Твой английский.
            <br />
            <span className="text-white/70">Один экран.</span>
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-white/80">
            Теория, видео, практика в Google Meet и прогресс — без Telegram, таблиц и вопросов
            «какой у меня сегодня урок».
          </p>
          <div className="mt-8 space-y-3">
            {[
              "Текущий урок открывает куратор",
              "Практика и ссылка Meet всегда под рукой",
              "Прогресс по 54 урокам курса",
            ].map((t) => (
              <div key={t} className="flex items-center gap-3 text-sm font-medium text-white/90">
                <PlayCircle className="size-4 shrink-0" />
                {t}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/60">
          Group · 6 месяцев · 15 000 сом &nbsp;•&nbsp; Individual · 1 месяц · 20 000 сом
        </p>
      </section>

      <section className="flex items-center justify-center bg-background px-5 py-12">
        <div className="w-full max-w-sm rise-in">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h2 className="mt-8 text-2xl font-extrabold lg:mt-0">Вход в платформу</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Логин и пароль выдаёт куратор после оплаты.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-3">
            <div className="relative">
              <User2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={form.login}
                onChange={(e) => setForm({ ...form, login: e.target.value })}
                placeholder="Логин"
                autoComplete="username"
                className="w-full rounded-xl border border-input bg-surface py-3 pl-10 pr-3 text-sm font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type={show ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Пароль"
                autoComplete="current-password"
                className="w-full rounded-xl border border-input bg-surface py-3 pl-10 pr-11 text-sm font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                aria-label="Показать пароль"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3 text-sm font-bold text-primary-foreground shadow-glow transition hover:opacity-95 active:scale-[0.99]"
            >
              Войти <ArrowRight className="size-4" />
            </button>
          </form>

          <div className="mt-8 rounded-2xl border border-dashed border-border p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Тестовые аккаунты
            </p>
            <div className="mt-3 space-y-2">
              <button
                onClick={() => fill("kanat")}
                className="flex w-full items-center justify-between rounded-xl bg-muted px-3 py-2.5 text-left text-xs font-semibold transition hover:bg-primary-soft"
              >
                <span>Ученик: kanat</span>
                <span className="text-muted-foreground">Пароль: test123</span>
              </button>
              <button
                onClick={() => fill("curator")}
                className="flex w-full items-center justify-between rounded-xl bg-muted px-3 py-2.5 text-left text-xs font-semibold transition hover:bg-primary-soft"
              >
                <span>Куратор: curator</span>
                <span className="text-muted-foreground">Пароль: test123</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
