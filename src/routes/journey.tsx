import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Compass, Target } from "lucide-react";
import {
  courseLevels,
  levelStatus,
  practiceStats,
  progressOf,
  testsStats,
  useApp,
  vocabStats,
} from "@/lib/store";
import { StudentShell } from "@/components/StudentShell";

export const Route = createFileRoute("/journey")({
  head: () => ({
    meta: [
      { title: "Мой путь — Sozmor" },
      { name: "description", content: "Уровень, прогресс по урокам, тестам и словам." },
    ],
  }),
  component: () => (
    <StudentShell>
      <JourneyPage />
    </StudentShell>
  ),
});

function JourneyPage() {
  const { currentStudent, lessons, tests, attempts, meetingsFor } = useApp();
  const student = currentStudent!;
  const progress = progressOf(student);
  const vocab = vocabStats(student);
  const testStats = testsStats(student, tests, attempts);
  const practice = practiceStats(meetingsFor(student));

  return (
    <div className="space-y-6 rise-in">
      <header>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Мой путь</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Твой уровень и прогресс по курсу English.
        </p>
      </header>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          <Compass className="size-4" /> Твой путь
        </h2>
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
                  {i < arr.length - 1 && <span className="text-muted-foreground">—</span>}
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Текущий уровень:{" "}
            <span className="font-bold text-foreground">
              {courseLevels().find((l) => levelStatus(student, lessons, l) === "current") ??
                courseLevels()[0]}
            </span>
            . Ты сейчас здесь.
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          <Target className="size-4" /> Цель
        </h2>
        <div className="surface-card p-5 text-sm">
          <p className="font-bold">Уверенно говорить по-английски</p>
          <p className="mt-1 text-muted-foreground">Ориентир курса: B1 / B2</p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[13px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Обучение
        </h2>
        <div className="surface-card divide-y divide-border overflow-hidden">
          {[
            { label: "Уроки", value: `${student.completed.length} / ${lessons.length}` },
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

      <Link to="/learn" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary">
        Открыть учёбу →
      </Link>
    </div>
  );
}
