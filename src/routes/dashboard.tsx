import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Flame,
  Lock,
  PlayCircle,
  Video,
} from "lucide-react";
import { LESSONS, TODAY } from "@/lib/mock-data";
import {
  accessStatus,
  currentLessonOrder,
  daysLeft,
  formatFull,
  progressOf,
  relativeDay,
  useApp,
} from "@/lib/store";
import { StudentShell } from "@/components/StudentShell";
import { AccessPill, EmptyState, Pill, ProgressBar, SectionTitle } from "@/components/shared";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Главная — English Learning Platform" },
      {
        name: "description",
        content: "Текущий урок, ближайшая практика и прогресс обучения ученика.",
      },
      { property: "og:title", content: "Личный кабинет ученика" },
      { property: "og:description", content: "Сегодняшний урок и практика в одном месте." },
    ],
  }),
  component: () => (
    <StudentShell>
      <Dashboard />
    </StudentShell>
  ),
});

function Dashboard() {
  const { currentStudent, meetingsFor } = useApp();
  const student = currentStudent!;
  const access = accessStatus(student);
  const order = currentLessonOrder(student);
  const lesson = LESSONS[order - 1];
  const progress = progressOf(student);
  const meetings = meetingsFor(student).filter(
    (m) => m.status === "scheduled" && m.date >= TODAY,
  );
  const next = meetings[0];
  const left = daysLeft(student.endDate);

  return (
    <div className="space-y-6 rise-in">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold sm:text-3xl">
            Привет, {student.firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {student.type === "GROUP" ? "Групповой курс" : "Индивидуальный курс"} · English ·{" "}
            {student.level}
          </p>
        </div>
        <div className="text-right">
          <AccessPill status={access} />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {access === "active" ? `Осталось ${left} дн.` : `До ${formatFull(student.endDate)}`}
          </p>
        </div>
      </header>

      {access !== "active" && (
        <div className="rounded-2xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm font-semibold text-warning">
          {access === "expired"
            ? "Срок обучения закончился. История и прогресс сохранены — обратитесь к куратору для продления."
            : "Доступ временно отключён куратором."}
        </div>
      )}

      {/* Сегодня */}
      <section>
        <SectionTitle title="Сегодня" icon={Flame} />
        <div className="relative overflow-hidden rounded-3xl gradient-hero p-5 text-primary-foreground shadow-lift sm:p-7">
          <div className="absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/70">
              <span>Урок {lesson.order}</span>
              <span>·</span>
              <span>{lesson.block}</span>
            </div>
            <h3 className="mt-2 text-2xl font-extrabold sm:text-3xl">{lesson.title}</h3>
            <p className="mt-1.5 max-w-md text-sm text-white/80">{lesson.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                to="/lesson/$order"
                params={{ order: String(lesson.order) }}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[oklch(0.42_0.19_275)] transition hover:opacity-90 active:scale-[0.99]"
              >
                <PlayCircle className="size-4" /> Смотреть урок
              </Link>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/75">
                <Clock3 className="size-3.5" /> Видео {lesson.duration}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Практика */}
        <section>
          <SectionTitle title="Ближайшая практика" icon={CalendarClock} />
          {next ? (
            <div className="surface-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">
                    {relativeDay(next.date)} · {next.startTime}–{next.endTime}
                  </p>
                  <h3 className="mt-1.5 truncate text-lg font-extrabold">{next.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {next.type === "GROUP" ? "Групповое занятие" : "Индивидуальное занятие"} ·
                    Google Meet
                  </p>
                </div>
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Video className="size-5" />
                </div>
              </div>
              <a
                href={next.meetUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3 text-sm font-bold text-primary-foreground shadow-glow transition hover:opacity-95"
              >
                Подключиться к практике <ArrowRight className="size-4" />
              </a>
            </div>
          ) : (
            <EmptyState
              icon={CalendarClock}
              title="Практика пока не назначена"
              description="Куратор добавит занятие и ссылку Google Meet — она появится здесь."
            />
          )}
        </section>

        {/* Прогресс */}
        <section>
          <SectionTitle title="Мой прогресс" icon={CheckCircle2} />
          <div className="surface-card p-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-extrabold">
                  {student.completed.length}
                  <span className="text-lg text-muted-foreground">/{LESSONS.length}</span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">уроков завершено</p>
              </div>
              <p className="text-2xl font-extrabold text-primary">{progress}%</p>
            </div>
            <ProgressBar value={progress} className="mt-4 h-2.5" />
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Открыто", value: student.openedUpTo },
                { label: "Завершено", value: student.completed.length },
                { label: "Закрыто", value: LESSONS.length - student.openedUpTo },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-muted/70 py-2.5">
                  <p className="text-base font-extrabold">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Следующий шаг */}
      <section>
        <SectionTitle title="Учебный путь" icon={PlayCircle} />
        <div className="surface-card divide-y divide-border overflow-hidden">
          {LESSONS.slice(Math.max(0, order - 3), order + 3).map((l) => {
            const done = student.completed.includes(l.order);
            const locked = l.order > student.openedUpTo;
            const current = l.order === order;
            return (
              <Link
                key={l.id}
                to="/lesson/$order"
                params={{ order: String(l.order) }}
                disabled={locked}
                className={`flex items-center gap-3 px-4 py-3.5 transition ${
                  locked ? "cursor-not-allowed opacity-55" : "hover:bg-muted/60"
                } ${current ? "bg-primary-soft/50" : ""}`}
              >
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    done
                      ? "bg-success-soft text-success"
                      : locked
                        ? "bg-muted text-muted-foreground"
                        : "gradient-primary text-primary-foreground"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="size-4" />
                  ) : locked ? (
                    <Lock className="size-3.5" />
                  ) : (
                    l.order
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{l.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    Урок {l.order} · {l.duration}
                  </span>
                </span>
                {current && <Pill tone="primary">Сейчас</Pill>}
              </Link>
            );
          })}
        </div>
        <Link
          to="/course"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-primary"
        >
          Весь курс <ArrowRight className="size-4" />
        </Link>
      </section>
    </div>
  );
}
