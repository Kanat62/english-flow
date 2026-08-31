import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Phone, Target, User2 } from "lucide-react";
import {
  accessStatus,
  daysLeft,
  formatFull,
  practiceStats,
  progressOf,
  testsStats,
  useApp,
  vocabStats,
} from "@/lib/store";
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
  const { currentStudent, lessons, tests, attempts, meetingsFor } = useApp();
  const s = currentStudent!;
  const access = accessStatus(s);
  const left = daysLeft(s.endDate);
  const progress = progressOf(s);
  const vocab = vocabStats(s);
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
      <div className="surface-card overflow-hidden">
        <div className="gradient-hero h-24" />
        <div className="-mt-9 flex flex-col items-center px-5 pb-6 text-center">
          <div className="rounded-full border-4 border-surface">
            <Avatar name={`${s.firstName} ${s.lastName}`} tone={s.avatarTone} size="lg" />
          </div>
          <h1 className="mt-3 text-xl font-extrabold">
            {s.firstName} {s.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {s.type === "GROUP" ? "Group" : "Individual"}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <AccessPill status={access} />
            <span className="text-xs font-semibold text-muted-foreground">
              {access === "active" ? `Осталось ${left} дн.` : formatFull(s.endDate)}
            </span>
          </div>
        </div>
      </div>

      <section>
        <SectionTitle title="Цель" icon={Target} />
        <div className="surface-card p-5 text-sm">
          <p className="font-bold">Уверенно говорить по-английски</p>
          <p className="mt-1 text-muted-foreground">Ориентир курса: B1 / B2</p>
        </div>
      </section>

      <section>
        <SectionTitle title="Обучение" />
        <div className="surface-card divide-y divide-border overflow-hidden">
          {[
            { label: "Уроки", value: `${s.completed.length} / ${lessons.length}` },
            { label: "Тесты", value: `${testStats.passed} / ${testStats.total}` },
            { label: "Слова", value: `${vocab.mastered}` },
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
        <p className="mt-2 text-right text-xs text-muted-foreground">{progress}% курса пройдено</p>
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
        <p className="mt-3 text-xs text-muted-foreground">
          Изменить данные и продлить доступ может куратор.
        </p>
      </section>
    </div>
  );
}
