import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, GraduationCap, Mail, Phone, ShieldCheck, User2 } from "lucide-react";
import { LESSONS } from "@/lib/mock-data";
import {
  accessStatus,
  currentLessonOrder,
  daysLeft,
  formatFull,
  progressOf,
  useApp,
} from "@/lib/store";
import { StudentShell } from "@/components/StudentShell";
import { AccessPill, Avatar, ProgressBar, SectionTitle } from "@/components/shared";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Профиль ученика — English Learning Platform" },
      {
        name: "description",
        content: "Данные ученика: курс, уровень, сроки доступа и текущий прогресс обучения.",
      },
      { property: "og:title", content: "Профиль ученика" },
      { property: "og:description", content: "Курс, уровень и срок доступа к обучению." },
    ],
  }),
  component: () => (
    <StudentShell>
      <ProfilePage />
    </StudentShell>
  ),
});

function ProfilePage() {
  const { currentStudent } = useApp();
  const s = currentStudent!;
  const access = accessStatus(s);
  const left = daysLeft(s.endDate);
  const done = s.completed.length === LESSONS.length;

  const rows = [
    { icon: GraduationCap, label: "Курс", value: "English" },
    { icon: User2, label: "Тип обучения", value: s.type === "GROUP" ? "Групповой" : "Индивидуальный" },
    { icon: ShieldCheck, label: "Уровень", value: s.level },
    { icon: CalendarDays, label: "Начало обучения", value: formatFull(s.startDate) },
    { icon: CalendarDays, label: "Окончание доступа", value: formatFull(s.endDate) },
    { icon: Phone, label: "Телефон", value: s.phone },
    { icon: Mail, label: "Email", value: s.email },
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
            {s.type === "GROUP" ? "Group" : "Individual"} · {s.level}
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
        <SectionTitle title="Прогресс" icon={GraduationCap} />
        <div className="surface-card p-5">
          {done ? (
            <p className="text-sm font-extrabold text-success">
              Курс завершён · {LESSONS.length} / {LESSONS.length} уроков
            </p>
          ) : (
            <div className="flex items-end justify-between">
              <p className="text-sm font-bold">
                Текущий урок: {currentLessonOrder(s)} из {LESSONS.length}
              </p>
              <p className="text-lg font-extrabold text-primary">{progressOf(s)}%</p>
            </div>
          )}
          <ProgressBar value={progressOf(s)} className="mt-3" tone={done ? "success" : "primary"} />
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
        <p className="mt-3 text-xs text-muted-foreground">
          Изменить данные и продлить доступ может куратор.
        </p>
      </section>
    </div>
  );
}
