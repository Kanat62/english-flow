import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Clock3,
  Flame,
  GraduationCap,
  Minus,
  PlayCircle,
  Sparkles,
  Target,
  TrendingUp,
  User,
  Users,
  Video,
} from "lucide-react";
import { useMemo, useState } from "react";
import { COURSE_STAGES, TODAY, type CefrLevel } from "@/lib/mock-data";
import {
  accessStatus,
  activityDatesFor,
  courseLevels,
  currentLessonOrder,
  levelStatus,
  nextStepFor,
  relativeDay,
  streakDays,
  useApp,
  weekAgenda,
  weekdayShort,
  weekRangeOf,
  type DayAgendaItem,
  type NextStep,
  type StageStatus,
} from "@/lib/store";
import { StudentShell } from "@/components/StudentShell";
import { SectionTitle } from "@/components/shared";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Главная — Sozmor" },
      {
        name: "description",
        content: "Следующий шаг, практика и прогресс обучения — на одном экране.",
      },
      { property: "og:title", content: "Личный кабинет ученика" },
      { property: "og:description", content: "Сегодняшний шаг обучения в одном месте." },
    ],
  }),
  component: () => (
    <StudentShell>
      <Dashboard />
    </StudentShell>
  ),
});

function Dashboard() {
  const { currentStudent, meetingsFor, lessons, tests, attempts } = useApp();
  const student = currentStudent!;
  const access = accessStatus(student);
  const meetings = meetingsFor(student);
  const step = nextStepFor(student, lessons, tests, attempts, meetings);

  const week = weekRangeOf(TODAY);
  const agenda = weekAgenda(student, lessons, tests, attempts, meetings, week);

  const currentOrder = currentLessonOrder(student);
  const currentLesson = lessons.find((l) => l.order === currentOrder);

  // Выбранный в «Моей неделе» день подменяет карточку «Мой следующий шаг»:
  // Пн/Ср/Пт — теория и «Смотреть урок», Вт/Чт/Сб — «Подключиться».
  const [selectedDay, setSelectedDay] = useState<string | null>(TODAY);
  const previewStep = useMemo<NextStep | null>(() => {
    if (!selectedDay || selectedDay === TODAY) return null;
    const wd = (new Date(selectedDay).getDay() + 6) % 7;
    const plan = WEEK_PLAN[wd];
    if (plan === "practice") {
      const meeting =
        meetings.find((m) => m.date === selectedDay && m.status !== "cancelled") ??
        meetings
          .filter((m) => m.status === "scheduled" && m.date >= TODAY)
          .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))[0];
      return meeting ? { kind: "practice", meeting } : null;
    }
    if (plan === "theory") {
      return currentLesson ? { kind: "lesson", lesson: currentLesson } : null;
    }
    return null;
  }, [selectedDay, meetings, currentLesson]);

  const dayLabel =
    selectedDay && previewStep
      ? `${WEEKDAYS_FULL[(new Date(selectedDay).getDay() + 6) % 7]} · ${
          previewStep.kind === "practice" ? "Практика" : "Теория"
        }`
      : undefined;

  return (
    <div className="space-y-6 rise-in">
      <header className="flex items-center justify-between gap-4">
        <h1 className="truncate text-2xl font-extrabold sm:text-3xl">
          Привет, {student.firstName} 👋
        </h1>
        <CourseBadge type={student.type} />
      </header>

      {access !== "active" && (
        <div className="rounded-2xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm font-semibold text-warning">
          {access === "expired"
            ? "Срок обучения закончился. История и прогресс сохранены — обратитесь к куратору для продления."
            : "Доступ временно отключён куратором."}
        </div>
      )}

      <section>
        <SectionTitle
          title="Моя неделя"
          icon={Clock3}
          action={
            <Link
              to="/practice"
              className="shrink-0 text-xs font-bold text-primary transition hover:opacity-80"
            >
              Смотреть всё →
            </Link>
          }
        />
        <WeekStrip agenda={agenda} selected={selectedDay} onSelect={setSelectedDay} />
      </section>

      <section>
        <SectionTitle title="Мой следующий шаг" icon={Sparkles} />
        <NextStepCard step={previewStep ?? step} dayLabel={dayLabel} />
      </section>

      <section>
        <SectionTitle title="Мой прогресс" icon={TrendingUp} />
        <ProgressPanel />
      </section>
    </div>
  );
}

function pluralRu(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

function ProgressPanel() {
  const { currentStudent, lessons, attempts, meetingsFor } = useApp();
  const student = currentStudent!;
  const meetings = meetingsFor(student);

  const levels = courseLevels();
  const statusOf = (l: CefrLevel) => levelStatus(student, lessons, l);
  const currentLevel =
    levels.find((l) => statusOf(l) === "current") ??
    [...levels].reverse().find((l) => statusOf(l) === "completed") ??
    levels[0];

  const levelBlocks = COURSE_STAGES.filter((s) => s.level === currentLevel).map((s) => s.block);
  const levelLessons = lessons.filter((l) => levelBlocks.includes(l.block));
  const levelDone = levelLessons.filter((l) => student.completed.includes(l.order)).length;
  const pct = levelLessons.length ? Math.round((levelDone / levelLessons.length) * 100) : 0;

  const lessonsDone = student.completed.length;
  const streak = streakDays(activityDatesFor(student, attempts, meetings));
  const left = 180;

  const R = 52;
  const CIRC = 2 * Math.PI * R;

  return (
    <div className="surface-card overflow-hidden p-6 sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-extrabold sm:text-2xl">Уровень {currentLevel}</h3>
        <span className="shrink-0 rounded-full bg-primary-soft px-3 py-1 text-[11px] font-bold text-accent-foreground">
          {left} {pluralRu(left, "день", "дня", "дней")} доступа
        </span>
      </div>

      <div className="mt-7 flex items-center justify-between gap-3">
        <div className="relative grid shrink-0 place-items-center">
          <svg viewBox="0 0 120 120" className="size-36 -rotate-90 sm:size-44">
            <defs>
              <linearGradient id="progress-ring" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--tone-1)" />
                <stop offset="100%" stopColor="var(--tone-2)" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r={R} fill="none" stroke="var(--muted)" strokeWidth="12" />
            <circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke="url(#progress-ring)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * CIRC} ${CIRC}`}
              className="transition-[stroke-dasharray] duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span
              className="text-3xl font-extrabold sm:text-4xl"
              style={{
                background: "linear-gradient(135deg, var(--tone-1), var(--tone-2))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {pct}%
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              путь {currentLevel}
            </span>
          </div>
        </div>

        <div className="flex w-1/2 shrink-0 flex-col gap-2">
          <StatTile
            className="ml-4"
            icon={GraduationCap}
            tone="primary"
            label="Уроков"
            value={`${lessonsDone} из ${lessons.length}`}
          />
          <StatTile
            icon={Flame}
            tone="warning"
            label="Streak"
            value={`${streak} ${pluralRu(streak, "день", "дня", "дней")}`}
          />
          <StatTile className="ml-4" icon={Target} tone="success" label="Точность" value="87%" />
        </div>
      </div>

      <div className="mt-7 border-t border-border pt-6">
        <LevelRoadmap levels={levels} statusOf={statusOf} />
      </div>
    </div>
  );
}

const STAT_TONES = {
  primary: "bg-primary-soft text-primary",
  warning: "bg-warning-soft text-warning",
  success: "bg-success-soft text-success",
} as const;

function StatTile({
  icon: Icon,
  tone,
  label,
  value,
  className = "",
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: keyof typeof STAT_TONES;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl bg-surface p-1.75 shadow-(--shadow-soft) ${className}`}
    >
      <span className={`grid size-7 shrink-0 place-items-center rounded-lg ${STAT_TONES[tone]}`}>
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-xs font-extrabold">{value}</p>
      </div>
    </div>
  );
}

function LevelRoadmap({
  levels,
  statusOf,
}: {
  levels: CefrLevel[];
  statusOf: (l: CefrLevel) => StageStatus;
}) {
  return (
    <div className="flex items-start">
      {levels.map((lvl, i) => {
        const st = statusOf(lvl);
        const label = st === "completed" ? "пройден" : st === "current" ? "сейчас" : "далее";
        const line = (active: boolean, hidden: boolean) =>
          `h-0.5 flex-1 rounded-full ${hidden ? "opacity-0" : active ? "bg-primary/40" : "bg-border"}`;
        return (
          <div key={lvl} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-center">
              <span className={line(st !== "locked", i === 0)} />
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-full text-xs font-extrabold ${
                  st === "completed"
                    ? "bg-success-soft text-success"
                    : st === "current"
                      ? "gradient-primary text-primary-foreground shadow-glow"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {lvl}
              </span>
              <span
                className={line(
                  i < levels.length - 1 && statusOf(levels[i + 1]!) !== "locked",
                  i === levels.length - 1,
                )}
              />
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wide ${
                st === "current" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function CourseBadge({ type }: { type: string }) {
  const group = type === "GROUP";
  const Icon = group ? Users : User;
  return (
    <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-surface py-1 pl-1 pr-3 text-xs font-bold text-secondary-foreground shadow-(--shadow-soft)">
      <span className="grid size-6 place-items-center rounded-full bg-secondary text-primary">
        <Icon className="size-3.5" />
      </span>
      {group ? "Group" : "Individual"}
      <span className="h-3 w-px bg-border" />
      <span className="text-muted-foreground">EN</span>
    </span>
  );
}

/** Плановый тип дня, если реальных событий в этот день нет. Пн–Сб чередуют
 *  теорию и практику, воскресенье — выходной. */
const WEEK_PLAN = [
  "theory",
  "practice",
  "theory",
  "practice",
  "theory",
  "practice",
  "rest",
] as const;

const WEEKDAYS_FULL = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];

type DayKind = (typeof WEEK_PLAN)[number];
type DayMarkStatus = "done" | "absent" | "today" | "upcoming" | "rest";

function dayState(
  date: string,
  items: DayAgendaItem[],
  weekdayIndex: number,
): { kind: DayKind; status: DayMarkStatus } {
  // Тип дня фиксирован по расписанию недели: Пн/Ср/Пт — теория (book-open),
  // Вт/Чт/Сб — практика, Вс — выходной.
  const kind: DayKind = WEEK_PLAN[weekdayIndex] ?? "theory";

  // Присутствовал / посмотрел урок = есть завершённое событие в этот день.
  const attended = items.some((i) => i.status === "done");

  let status: DayMarkStatus;
  if (kind === "rest") status = "rest";
  else if (attended) status = "done";
  else if (date < TODAY) status = "absent";
  else if (date === TODAY) status = "today";
  else status = "upcoming";

  return { kind, status };
}

/** Фон карточки дня по статусу: зелёный — был, серый — пропустил. */
const DAY_TONE: Record<DayMarkStatus, string> = {
  done: "bg-success-soft",
  absent: "bg-muted",
  today: "bg-surface",
  upcoming: "bg-surface",
  rest: "bg-surface",
};

function DayMark({ kind, status }: { kind: DayKind; status: DayMarkStatus }) {
  if (status === "rest") return <Minus className="size-4 text-muted-foreground/30" />;
  const Icon = kind === "practice" ? Video : BookOpen;
  const color =
    status === "done"
      ? "text-success/70"
      : status === "today"
        ? "text-primary/70"
        : "text-muted-foreground/70";
  return <Icon className={`size-5 ${color}`} />;
}

function WeekStrip({
  agenda,
  selected,
  onSelect,
}: {
  agenda: { date: string; items: DayAgendaItem[] }[];
  selected: string | null;
  onSelect: (date: string | null) => void;
}) {
  return (
    <div className="grid grid-cols-7 gap-1 sm:gap-2">
      {agenda.map(({ date, items }, i) => {
        const { kind, status } = dayState(date, items, i);
        const isToday = date === TODAY;
        return (
          <button
            key={date}
            onClick={() => onSelect(selected === date ? null : date)}
            className="flex flex-col items-center gap-2 rounded-xl py-1 transition-opacity hover:opacity-80"
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-wide ${
                isToday ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {weekdayShort(date)}
            </span>
            <span
              className={`relative z-0 grid place-items-center rounded-[16px] shadow-[0_2px_6px_-2px_oklch(0.35_0.05_285/0.16)] transition-colors ${
                status === "rest" ? "size-11" : "p-3 sm:p-4"
              } ${DAY_TONE[status]} ${
                selected === date ? "ring-2 ring-primary" : isToday ? "ring-2 ring-primary/40" : ""
              }`}
            >
              <DayMark kind={kind} status={status} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

function NextStepCard({ step, dayLabel }: { step: NextStep; dayLabel?: string | undefined }) {
  const base =
    "relative overflow-hidden rounded-3xl gradient-hero p-5 text-primary-foreground shadow-lift sm:p-7";
  const glow = (
    <div className="absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-2xl" />
  );

  if (step.kind === "lesson") {
    return (
      <div className={base}>
        {glow}
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">
            {dayLabel ?? `Урок ${step.lesson.order}`}
          </p>
          <h3 className="mt-2 text-2xl font-extrabold sm:text-3xl">{step.lesson.title}</h3>
          <p className="mt-1.5 max-w-md text-sm text-white/80">{step.lesson.description}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              to="/lesson/$order"
              params={{ order: String(step.lesson.order) }}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[oklch(0.42_0.19_275)] transition hover:opacity-90 active:scale-[0.99]"
            >
              <PlayCircle className="size-4" /> {dayLabel ? "Смотреть урок" : "Продолжить урок"}
            </Link>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/75">
              <Clock3 className="size-3.5" /> Видео {step.lesson.duration}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (step.kind === "test") {
    const minutes = Math.round(step.test.timeLimitSec / 60);
    return (
      <div className={base}>
        {glow}
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">
            Урок {step.lesson.order} завершён
          </p>
          <h3 className="mt-2 text-2xl font-extrabold sm:text-3xl">Проверь знания</h3>
          <p className="mt-1.5 max-w-md text-sm text-white/80">
            {step.test.questions.length} вопросов · {minutes} минут
          </p>
          <div className="mt-5">
            <Link
              to="/lesson/$order/test"
              params={{ order: String(step.lesson.order) }}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[oklch(0.42_0.19_275)] transition hover:opacity-90 active:scale-[0.99]"
            >
              Пройти тест
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (step.kind === "practice") {
    return (
      <div className={base}>
        {glow}
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">
            {dayLabel ?? `Сегодня практика · ${step.meeting.startTime}`}
          </p>
          <h3 className="mt-2 text-2xl font-extrabold sm:text-3xl">{step.meeting.title}</h3>
          <p className="mt-1.5 max-w-md text-sm text-white/80">
            {dayLabel ? `Google Meet · ${step.meeting.startTime}` : "Google Meet"}
          </p>
          <div className="mt-5">
            <a
              href={step.meeting.meetUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[oklch(0.42_0.19_275)] transition hover:opacity-90 active:scale-[0.99]"
            >
              Подключиться
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={base}>
      {glow}
      <div className="relative">
        <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">
          Ты всё сделал на сегодня ✓
        </p>
        <h3 className="mt-2 text-2xl font-extrabold sm:text-3xl">
          {step.nextMeeting ? "Ждём тебя на практике" : "Следующий урок скоро откроется"}
        </h3>
        <p className="mt-1.5 max-w-md text-sm text-white/80">
          {step.nextMeeting
            ? `${relativeDay(step.nextMeeting.date)} · ${step.nextMeeting.startTime}`
            : "Куратор откроет новый урок после текущего этапа."}
        </p>
      </div>
    </div>
  );
}
