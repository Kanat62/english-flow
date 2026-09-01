import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarDays, LogOut, Phone, Target, User2 } from "lucide-react";
import { accessStatus, daysLeft, formatFull, practiceStats, testsStats, useApp } from "@/lib/store";
import { StudentShell } from "@/components/StudentShell";
import { AccessPill, Avatar, SectionTitle } from "@/components/shared";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Профиль ученика — akcent_academy" },
      {
        name: "description",
        content: "Данные ученика: курс, сроки доступа и текущий прогресс обучения.",
      },
      { property: "og:title", content: "Профиль ученика" },
      { property: "og:description", content: "Курс и срок доступа к обучению." },
    ],
  }),
  component: () => (
    <StudentShell>
      <ProfilePage />
    </StudentShell>
  ),
});

function ProfilePage() {
  const { currentStudent, lessons, tests, attempts, meetingsFor, logout } = useApp();
  const navigate = useNavigate();
  const s = currentStudent!;
  const access = accessStatus(s);
  const left = daysLeft(s.endDate);
  const testStats = testsStats(s, tests, attempts);
  const practice = practiceStats(meetingsFor(s));

  const rows = [
    { icon: User2, label: "Курс", value: "English" },
    {
      icon: User2,
      label: "Тип обучения",
      value: s.type === "GROUP" ? "Групповой" : "Индивидуальный",
    },
    { icon: CalendarDays, label: "Начало обучения", value: formatFull(s.startDate) },
    { icon: CalendarDays, label: "Окончание доступа", value: formatFull(s.endDate) },
    { icon: Phone, label: "Телефон", value: s.phone },
    { icon: User2, label: "Логин", value: s.login },
  ];

  return (
    <div className="space-y-6 rise-in">
      <div className="surface-card flex items-center gap-4 p-4">
        <Avatar name={`${s.firstName} ${s.lastName}`} tone={s.avatarTone} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-extrabold">
            {s.firstName} {s.lastName}
          </h1>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
            <User2 className="size-3.5 shrink-0" />
            {s.type === "GROUP" ? "Групповой курс" : "Индивидуальный курс"}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <AccessPill status={access} />
          <span className="text-[11px] font-semibold text-muted-foreground">
            {access === "active" ? `Осталось ${left} дн.` : formatFull(s.endDate)}
          </span>
        </div>
      </div>

      <section>
        <SectionTitle title="Цель" icon={Target} />
        <div className="surface-card p-5 text-sm">
          <p className="font-bold">Уверенно говорить по-английски</p>
        </div>
      </section>

      <section>
        <SectionTitle title="Обучение" />
        <div className="surface-card divide-y divide-border overflow-hidden">
          {[
            { label: "Уроки", value: `${s.completed.length} / ${lessons.length}` },
            { label: "Тесты", value: `${testStats.passed} / ${testStats.total}` },
            {
              label: "Практика",
              value:
                practice.total === 0
                  ? "—"
                  : `${practice.total} занятий, ${practice.attended} посещено`,
            },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className="text-sm font-bold">{row.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle title="Личные данные" icon={User2} />
        <div className="surface-card divide-y divide-border overflow-hidden">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-3 px-4 py-3.5">
              <r.icon className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                {r.label}
              </span>
              <span className="shrink-0 text-sm font-bold">{r.value}</span>
            </div>
          ))}
        </div>
      </section>

      <button
        onClick={() => {
          logout();
          navigate({ to: "/" });
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-500/20"
      >
        <LogOut className="size-4" /> Выйти
      </button>
    </div>
  );
}
