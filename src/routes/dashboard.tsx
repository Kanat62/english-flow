import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock3,
  Compass,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { TODAY } from "@/lib/mock-data";
import {
  accessStatus,
  courseLevels,
  currentLessonOrder,
  daysLeft,
  dueVocab,
  formatFull,
  levelStatus,
  nextStepFor,
  relativeDay,
  stageForLesson,
  testAvailability,
  testForLesson,
  useApp,
  type NextStep,
} from "@/lib/store";
import { StudentShell } from "@/components/StudentShell";
import { AccessPill, SectionTitle } from "@/components/shared";

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
  const left = daysLeft(student.endDate);
  const meetings = meetingsFor(student);
  const step = nextStepFor(student, lessons, tests, attempts, meetings);
  const due = dueVocab(student);
  const stage = stageForLesson(lessons, Math.max(1, student.openedUpTo));

  const upcoming = meetings
    .filter((m) => m.status === "scheduled" && m.date >= TODAY)
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))[0];
  const todayMeeting = meetings.find((m) => m.status === "scheduled" && m.date === TODAY);

  const currentOrder = currentLessonOrder(student);
  const currentLesson = lessons.find((l) => l.order === currentOrder);
  const lessonDone = student.completed.includes(currentOrder);
  const currentTest = testForLesson(tests, currentOrder);
  const testAvail = currentTest ? testAvailability(student, currentTest, attempts) : null;

  return (
    <div className="space-y-6 rise-in">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold sm:text-3xl">
            Привет, {student.firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            English · {student.type === "GROUP" ? "Group" : "Individual"}
            {stage ? ` · ${stage.level}` : ""}
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

      <section>
        <SectionTitle title="Твой следующий шаг" icon={Sparkles} />
        <NextStepCard step={step} />
      </section>

      <section>
        <SectionTitle title="Сегодня" icon={CheckCircle2} />
        <div className="surface-card divide-y divide-border overflow-hidden">
          {currentLesson && (
            <TodayRow
              done={lessonDone}
              label={`Урок ${currentLesson.order}. ${currentLesson.title}`}
              to="/lesson/$order"
              params={{ order: String(currentLesson.order) }}
            />
          )}
          {currentTest && (
            <TodayRow
              done={testAvail === "passed"}
              active={
                testAvail === "available" || testAvail === "failed" || testAvail === "in_progress"
              }
              label={currentTest.title}
              to="/lesson/$order/test"
              params={{ order: String(currentOrder) }}
            />
          )}
          {todayMeeting ? (
            <TodayRow
              done={false}
              active
              label={`Практика · ${todayMeeting.startTime}`}
              href={todayMeeting.meetUrl}
            />
          ) : upcoming ? (
            <TodayRow
              done={false}
              label={`Практика — ${relativeDay(upcoming.date)} · ${upcoming.startTime}`}
              to="/practice"
            />
          ) : null}
          {due.length > 0 && (
            <TodayRow
              done={false}
              label={`${due.length} ${due.length === 1 ? "слово" : "слов"} на повторение`}
              to="/vocabulary"
            />
          )}
        </div>
      </section>

      <section>
        <SectionTitle title="Твой путь" icon={Compass} />
        <div className="surface-card p-5">
          <div className="flex flex-wrap items-center gap-2">
            {courseLevels().map((level, i, arr) => {
              const status = levelStatus(student, lessons, level);
              return (
                <div key={level} className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold ${
                      status === "completed"
                        ? "bg-success-soft text-success"
                        : status === "current"
                          ? "gradient-primary text-primary-foreground shadow-glow"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {level}
                    {status === "completed" && <CheckCircle2 className="size-3.5" />}
                  </span>
                  {i < arr.length - 1 && (
                    <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                </div>
              );
            })}
          </div>
          {stage && (
            <p className="mt-3 text-xs text-muted-foreground">
              Сейчас: <span className="font-bold text-foreground">{stage.level}</span> ·{" "}
              {stage.title}
            </p>
          )}
          <Link
            to="/journey"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-primary"
          >
            Мой путь <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function TodayRow({
  done,
  active,
  label,
  to,
  params,
  href,
}: {
  done: boolean;
  active?: boolean;
  label: string;
  to?: "/lesson/$order" | "/lesson/$order/test" | "/practice" | "/vocabulary";
  params?: { order: string };
  href?: string;
}) {
  const icon = done ? (
    <CheckCircle2 className="size-4 text-success" />
  ) : active ? (
    <ArrowRight className="size-4 text-primary" />
  ) : (
    <Circle className="size-4 text-muted-foreground" />
  );

  const content = (
    <>
      {icon}
      <span
        className={`min-w-0 flex-1 truncate text-sm ${done ? "text-muted-foreground line-through" : "font-semibold"}`}
      >
        {label}
      </span>
    </>
  );

  const className = "flex items-center gap-3 px-4 py-3.5 transition hover:bg-muted/60";

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {content}
      </a>
    );
  }
  if (to === "/lesson/$order" || to === "/lesson/$order/test") {
    return (
      <Link to={to} params={params!} className={className}>
        {content}
      </Link>
    );
  }
  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}

function NextStepCard({ step }: { step: NextStep }) {
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
            Урок {step.lesson.order}
          </p>
          <h3 className="mt-2 text-2xl font-extrabold sm:text-3xl">{step.lesson.title}</h3>
          <p className="mt-1.5 max-w-md text-sm text-white/80">{step.lesson.description}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              to="/lesson/$order"
              params={{ order: String(step.lesson.order) }}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[oklch(0.42_0.19_275)] transition hover:opacity-90 active:scale-[0.99]"
            >
              <PlayCircle className="size-4" /> Продолжить урок
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
            Сегодня практика · {step.meeting.startTime}
          </p>
          <h3 className="mt-2 text-2xl font-extrabold sm:text-3xl">{step.meeting.title}</h3>
          <p className="mt-1.5 max-w-md text-sm text-white/80">Google Meet</p>
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

  if (step.kind === "vocab") {
    return (
      <div className={base}>
        {glow}
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">
            Слова на повторение
          </p>
          <h3 className="mt-2 text-2xl font-extrabold sm:text-3xl">{step.count} слов</h3>
          <p className="mt-1.5 max-w-md text-sm text-white/80">
            Короткое повторение перед следующей темой.
          </p>
          <div className="mt-5">
            <Link
              to="/vocabulary"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[oklch(0.42_0.19_275)] transition hover:opacity-90 active:scale-[0.99]"
            >
              Повторить слова
            </Link>
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
