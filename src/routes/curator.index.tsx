import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  LinkIcon,
  Plus,
  Presentation,
  UserPlus,
  Users,
} from "lucide-react";
import { CURATOR, TODAY } from "@/lib/mock-data";
import {
  accessStatus,
  attentionBuckets,
  daysLeft,
  formatDate,
  useApp,
} from "@/lib/store";
import { CuratorShell } from "@/components/CuratorShell";
import { Avatar, EmptyState, SectionTitle } from "@/components/shared";

export const Route = createFileRoute("/curator/")({
  head: () => ({
    meta: [
      { title: "Кабинет куратора — Sozmor" },
      {
        name: "description",
        content: "Центр управления академией: показатели, сегодняшние практики и что требует внимания.",
      },
      { property: "og:title", content: "Кабинет куратора" },
      { property: "og:description", content: "Что происходит сейчас и что требует внимания." },
    ],
  }),
  component: () => (
    <CuratorShell>
      <CuratorDashboard />
    </CuratorShell>
  ),
});

const QUICK_ACTIONS = [
  { to: "/curator/students", label: "Добавить ученика", icon: UserPlus },
  { to: "/curator/groups", label: "Создать группу", icon: GraduationCap },
  { to: "/curator/teachers", label: "Добавить преподавателя", icon: Presentation },
  { to: "/curator/schedule", label: "Создать практику", icon: CalendarClock },
] as const;

function CuratorDashboard() {
  const { students, groups, teachers, meetings } = useApp();

  const active = students.filter((s) => accessStatus(s) === "active");
  const liveGroups = groups.filter((g) => g.status === "active" || g.status === "recruiting");
  const todayMeetings = meetings.filter((m) => m.date === TODAY && m.status === "scheduled");
  const newStudents = students.filter((s) => daysLeft(s.startDate, TODAY) >= -3 && daysLeft(s.startDate, TODAY) <= 7);
  const att = attentionBuckets(students, groups);
  const attentionCount =
    att.idleStudents.length +
    att.groupsNoTeacher.length +
    att.groupsNoLink.length +
    att.notOnboarded.length +
    att.groupsEndingSoon.length;

  const stats = [
    { label: "Ученики", value: students.length, icon: Users },
    { label: "Активные", value: active.length, icon: CheckCircle2 },
    { label: "Группы", value: liveGroups.length, icon: GraduationCap },
    { label: "Преподаватели", value: teachers.length, icon: Presentation },
  ];

  const attentionRows = [
    {
      count: att.idleStudents.length,
      text: `${att.idleStudents.length} учеников не заходили 3+ дня`,
      to: "/curator/students",
    },
    {
      count: att.groupsNoTeacher.length,
      text: `${att.groupsNoTeacher.length} групп без преподавателя`,
      to: "/curator/groups",
    },
    {
      count: att.groupsNoLink.length,
      text: `${att.groupsNoLink.length} групп без ссылки на практику`,
      to: "/curator/groups",
    },
    {
      count: att.notOnboarded.length,
      text: `${att.notOnboarded.length} учеников не завершили onboarding`,
      to: "/curator/students",
    },
    {
      count: att.groupsEndingSoon.length,
      text: `${att.groupsEndingSoon.length} групп скоро заканчиваются`,
      to: "/curator/groups",
    },
  ].filter((r) => r.count > 0);

  return (
    <div className="space-y-6 rise-in">
      <header>
        <h1 className="text-2xl font-extrabold sm:text-3xl">
          Добро пожаловать, {CURATOR.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Сегодня · {formatDate(TODAY)}</p>
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

      <section className="surface-card p-5">
        <SectionTitle title="Сегодня" icon={CalendarClock} />
        <div className="grid grid-cols-3 gap-3">
          {[
            { l: "Практика", v: `${todayMeetings.length} групп`, to: "/curator/schedule" },
            { l: "Новые ученики", v: `${newStudents.length}`, to: "/curator/students" },
            { l: "Требуют внимания", v: `${attentionCount}`, to: "/curator/students" },
          ].map((x) => (
            <Link key={x.l} to={x.to} className="rounded-xl bg-muted/70 p-3 transition hover:bg-muted">
              <p className="text-lg font-extrabold">{x.v}</p>
              <p className="text-[11px] text-muted-foreground">{x.l}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle title="Быстрые действия" icon={Plus} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              search={{ new: 1 }}
              className="surface-card flex flex-col items-start gap-3 p-4 transition hover:border-primary"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary">
                <a.icon className="size-4" />
              </span>
              <span className="text-xs font-bold leading-snug">{a.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle title="Требует внимания" icon={AlertTriangle} />
        {attentionRows.length ? (
          <div className="surface-card divide-y divide-border overflow-hidden">
            {attentionRows.map((r) => (
              <Link
                key={r.text}
                to={r.to}
                className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-muted/60"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-warning-soft text-warning">
                  <AlertTriangle className="size-4" />
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold">{r.text}</span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState icon={CheckCircle2} title="Всё под контролем" />
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle title="Практика сегодня" icon={CalendarClock} />
          {todayMeetings.length ? (
            <div className="space-y-2.5">
              {todayMeetings.map((m) => {
                const g = groups.find((x) => x.id === m.groupId);
                return (
                  <div key={m.id} className="surface-card flex items-center gap-3 p-4">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                      <CalendarClock className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold">{m.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.startTime}–{m.endTime} · {g ? g.name : m.type === "GROUP" ? "Группа" : "Individual"}
                      </p>
                    </div>
                    {m.meetUrl ? (
                      <a
                        href={m.meetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 rounded-lg gradient-primary px-3.5 py-2 text-xs font-bold text-primary-foreground"
                      >
                        Meet
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-warning">
                        <LinkIcon className="size-3.5" /> нет ссылки
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={CalendarClock} title="Сегодня практик нет" />
          )}
        </section>

        <section>
          <SectionTitle title="Ученики без активности" icon={AlertTriangle} />
          {att.idleStudents.length ? (
            <div className="surface-card divide-y divide-border overflow-hidden">
              {att.idleStudents.slice(0, 6).map((s) => (
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
    </div>
  );
}
