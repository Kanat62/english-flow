import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock3, Lock, PlayCircle, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { currentLessonOrder, lessonState, progressOf, useApp } from "@/lib/store";
import { StudentShell } from "@/components/StudentShell";
import { EmptyState, LessonPill, ProgressBar } from "@/components/shared";

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
  const { currentStudent, lessons } = useApp();
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

  return (
    <div className="space-y-6 rise-in">
      <header>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Курс English</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {student.completed.length} из {lessons.length} уроков завершено · открыто{" "}
          {student.openedUpTo}
        </p>
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
        <EmptyState icon={Search} title="Ничего не найдено" description="Измените фильтр или запрос." />
      )}

      {grouped.map(([block, lessons]) => (
        <section key={block}>
          <h2 className="mb-2 text-[13px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {block}
          </h2>
          <div className="surface-card divide-y divide-border overflow-hidden">
            {lessons.map((l) => {
              const state = lessonState(student, l.order);
              const locked = state === "locked";
              return (
                <Link
                  key={l.id}
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
                      <Clock3 className="size-3" /> {l.duration} · {l.description}
                    </span>
                  </span>
                  <span className="hidden sm:block">
                    <LessonPill state={state} />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
