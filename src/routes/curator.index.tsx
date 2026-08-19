import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  TrendingUp,
  User2,
  Users,
} from "lucide-react";
import { CURATOR, LESSONS, TODAY } from "@/lib/mock-data";
import {
  accessStatus,
  currentLessonOrder,
  daysLeft,
  formatDate,
  progressOf,
  useApp,
} from "@/lib/store";
import { CuratorShell } from "@/components/CuratorShell";
import { AccessPill, Avatar, EmptyState, ProgressBar, SectionTitle } from "@/components/shared";

export const Route = createFileRoute("/curator/")({
  head: () => ({
    meta: [
      { title: "Кабинет куратора — akcent_academy" },
      {
        name: "description",
        content: "Обзор учеников, сегодняшние практики и ученики без активности.",
      },
      { property: "og:title", content: "Кабинет куратора" },
      { property: "og:description", content: "Что нужно сделать сегодня: ученики и практики." },
    ],
  }),
  component: () => (
    <CuratorShell>
      <CuratorDashboard />
    </CuratorShell>
  ),
});

function CuratorDashboard() {
  const { students, meetings } = useApp();
  const active = students.filter((s) => accessStatus(s) === "active");
  const ending = active.filter((s) => daysLeft(s.endDate) <= 14);
  const todayMeetings = meetings.filter((m) => m.date === TODAY && m.status === "scheduled");
  const idle = active.filter((s) => daysLeft(s.lastActivity, TODAY) <= -2);

  const stats = [
    { label: "Всего учеников", value: students.length, icon: Users },
    { label: "Активные", value: active.length, icon: CheckCircle2 },
    { label: "Individual", value: students.filter((s) => s.type === "INDIVIDUAL").length, icon: User2 },
    { label: "Заканчивается доступ", value: ending.length, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6 rise-in">
      <header>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Привет, {CURATOR.name.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Сегодня {formatDate(TODAY)} · вот что требует внимания.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="surface-card p-4">
            <s.icon className="size-4 text-primary" />
            <p className="mt-3 text-2xl font-extrabold">{s.value}</p>
            <p className="text-[11px] font-semibold text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle title="Практика сегодня" icon={CalendarClock} />
          {todayMeetings.length ? (
            <div className="space-y-2.5">
              {todayMeetings.map((m) => (
                <div key={m.id} className="surface-card flex items-center gap-3 p-4">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <CalendarClock className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.startTime}–{m.endTime} · {m.type === "GROUP" ? "Группа" : "Индивидуально"}
                    </p>
                  </div>
                  <a
                    href={m.meetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-lg gradient-primary px-3.5 py-2 text-xs font-bold text-primary-foreground"
                  >
                    Meet
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={CalendarClock} title="Сегодня практик нет" />
          )}
        </section>

        <section>
          <SectionTitle title="Без активности" icon={AlertTriangle} />
          {idle.length ? (
            <div className="surface-card divide-y divide-border overflow-hidden">
              {idle.map((s) => (
                <Link
                  key={s.id}
                  to="/curator/students/$id"
                  params={{ id: s.id }}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/60"
                >
                  <Avatar name={`${s.firstName} ${s.lastName}`} tone={s.avatarTone} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">
                      {s.firstName} {s.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Последняя активность: {formatDate(s.lastActivity)}
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={CheckCircle2} title="Все ученики активны" />
          )}
        </section>
      </div>

      <section>
        <SectionTitle
          title="Ученики"
          icon={TrendingUp}
          action={
            <Link
              to="/curator/students"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary"
            >
              Все ученики <ArrowRight className="size-3.5" />
            </Link>
          }
        />
        <div className="surface-card divide-y divide-border overflow-hidden">
          {students.slice(0, 5).map((s) => (
            <Link
              key={s.id}
              to="/curator/students/$id"
              params={{ id: s.id }}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 transition hover:bg-muted/60"
            >
              <Avatar name={`${s.firstName} ${s.lastName}`} tone={s.avatarTone} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">
                  {s.firstName} {s.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {s.type === "GROUP" ? "Group" : "Individual"} · урок{" "}
                  {currentLessonOrder(s)}/{LESSONS.length}
                </p>
                <ProgressBar value={progressOf(s)} className="mt-2 h-1.5 max-w-48" />
              </div>
              <AccessPill status={accessStatus(s)} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
