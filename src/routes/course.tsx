import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Clock3, Lock, PlayCircle, Search, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import {
  courseLevels,
  currentLessonOrder,
  lessonState,
  levelStatus,
  progressOf,
  stageForBlock,
  stageForLesson,
  testAvailability,
  testForLesson,
  useApp,
} from "@/lib/store";
import { StudentShell } from "@/components/StudentShell";
import { EmptyState, LessonPill, Pill, ProgressBar } from "@/components/shared";
import type { LessonTest, Student, TestAttempt } from "@/lib/mock-data";

export const Route = createFileRoute("/course")({
  head: () => ({
    meta: [
      { title: "Курс English — учебный путь" },
      {
        name: "description",
        content: "Полный учебный путь курса: завершённые, текущий и закрытые уроки.",
      },
      { property: "og:title", content: "Учебный путь курса English" },
      { property: "og:description", content: "54 урока: теория, видео и практика." },
    ],
  }),
  component: () => (
    <StudentShell>
      <CoursePage />
    </StudentShell>
  ),
});

const filters = [
  { id: "all", label: "Все" },
  { id: "available", label: "Доступные" },
  { id: "completed", label: "Завершённые" },
  { id: "locked", label: "Закрытые" },
] as const;

function CoursePage() {
  const { currentStudent, lessons, tests, attempts } = useApp();
  const student = currentStudent!;
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const current = currentLessonOrder(student);

  const list = useMemo(
    () =>
      lessons.filter((l) => {
        const state = lessonState(student, l.order);
        if (filter !== "all" && state !== filter) return false;
        if (query && !`${l.title} ${l.description}`.toLowerCase().includes(query.toLowerCase()))
          return false;
        return true;
      }),
    [lessons, student, filter, query],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, typeof lessons>();
    list.forEach((l) => map.set(l.block, [...(map.get(l.block) ?? []), l]));
    return [...map.entries()];
  }, [list]);

  const stage = stageForLesson(lessons, Math.max(1, student.openedUpTo));

  return (
    <div className="space-y-6 rise-in">
      <header>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Курс English</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {student.completed.length} из {lessons.length} уроков завершено · {progressOf(student)}%
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
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
          <p className="mt-2.5 text-xs text-muted-foreground">
            Текущий этап: <span className="font-bold text-foreground">{stage.level}</span> ·{" "}
            {stage.title}
          </p>
        )}

        <ProgressBar value={progressOf(student)} className="mt-4" />
      </header>

      <div className="sticky top-[57px] z-10 -mx-4 space-y-3 bg-background/90 px-4 py-3 backdrop-blur lg:top-0 lg:mx-0 lg:px-0">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти тему"
            className="w-full rounded-xl border border-input bg-surface py-2.5 pl-10 pr-3 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                filter === f.id
                  ? "gradient-primary text-primary-foreground shadow-glow"
                  : "border border-border bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {grouped.length === 0 && (
        <EmptyState
          icon={Search}
          title="Ничего не найдено"
          description="Измените фильтр или запрос."
        />
      )}

      {grouped.map(([block, lessons]) => {
        const blockStage = stageForBlock(block);
        return (
          <section key={block}>
            <h2 className="mb-2 text-[13px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {blockStage ? `${blockStage.level} · ${block}` : block}
            </h2>
            <div className="surface-card divide-y divide-border overflow-hidden">
              {lessons.map((l) => {
                const state = lessonState(student, l.order);
                const locked = state === "locked";
                const test = testForLesson(tests, l.order);
                return (
                  <div key={l.id}>
                    <Link
                      to="/lesson/$order"
                      params={{ order: String(l.order) }}
                      disabled={locked}
                      className={`flex items-center gap-3 px-4 py-3.5 transition ${
                        locked ? "cursor-not-allowed opacity-55" : "hover:bg-muted/60"
                      } ${l.order === current ? "bg-primary-soft/40" : ""}`}
                    >
                      <span
                        className={`grid size-9 shrink-0 place-items-center rounded-xl text-xs font-bold ${
                          state === "completed"
                            ? "bg-success-soft text-success"
                            : locked
                              ? "bg-muted text-muted-foreground"
                              : "gradient-primary text-primary-foreground"
                        }`}
                      >
                        {state === "completed" ? (
                          <CheckCircle2 className="size-4" />
                        ) : locked ? (
                          <Lock className="size-3.5" />
                        ) : (
                          <PlayCircle className="size-4" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">
                          {l.order}. {l.title}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                          <Clock3 className="size-3" /> {l.duration}
                        </span>
                      </span>
                      <span className="hidden sm:block">
                        <LessonPill state={state} />
                      </span>
                    </Link>
                    <TestRow order={l.order} test={test} student={student} attempts={attempts} />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function TestRow({
  order,
  test,
  student,
  attempts,
}: {
  order: number;
  test: LessonTest | undefined;
  student: Student;
  attempts: TestAttempt[];
}) {
  const availability = test ? testAvailability(student, test, attempts) : "locked";
  const locked = availability === "locked";
  const minutes = test ? Math.round(test.timeLimitSec / 60) : 0;
  const best = test
    ? attempts
        .filter(
          (a) => a.studentId === student.id && a.testId === test.id && a.status === "submitted",
        )
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0]
    : undefined;

  const badgeClass =
    availability === "passed"
      ? "bg-success-soft text-success"
      : availability === "failed"
        ? "bg-warning-soft text-warning"
        : locked
          ? "bg-muted text-muted-foreground"
          : "gradient-primary text-primary-foreground";

  const icon =
    availability === "passed" ? (
      <CheckCircle2 className="size-4" />
    ) : locked ? (
      <Lock className="size-3.5" />
    ) : (
      <FileText className="size-4" />
    );

  const subtitle = !test
    ? "Куратор ещё готовит тест"
    : locked
      ? "Откроется после урока"
      : `${test.questions.length} вопросов · ${minutes} мин`;

  const pill =
    availability === "passed" ? (
      <Pill tone="success">Пройден · {best?.score}%</Pill>
    ) : availability === "failed" ? (
      <Pill tone="warning">{best?.score}% · Повторить</Pill>
    ) : availability === "in_progress" ? (
      <Pill tone="warning">Продолжить</Pill>
    ) : locked ? (
      <Pill tone="neutral">Закрыт</Pill>
    ) : (
      <Pill tone="primary">Пройти тест</Pill>
    );

  const content = (
    <>
      <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${badgeClass}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold">
          {test?.title ?? `Тест к уроку ${order}`}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{subtitle}</span>
      </span>
      <span className="hidden sm:block">{pill}</span>
    </>
  );

  const rowClass =
    "flex items-center gap-3 border-t border-dashed border-border/70 px-4 py-2.5 pl-[52px] transition";

  if (locked) {
    return <div className={`${rowClass} cursor-not-allowed opacity-70`}>{content}</div>;
  }

  return (
    <Link
      to="/lesson/$order/test"
      params={{ order: String(order) }}
      className={`${rowClass} hover:bg-muted/60`}
    >
      {content}
    </Link>
  );
}
