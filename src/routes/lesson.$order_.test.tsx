import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, Lock, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  activeAttempt,
  bestAttempt,
  lessonState,
  testAvailability,
  testForLesson,
  useApp,
} from "@/lib/store";
import type { LessonTest, TestAttempt } from "@/lib/mock-data";
import { StudentShell } from "@/components/StudentShell";
import { EmptyState, Pill } from "@/components/shared";

export const Route = createFileRoute("/lesson/$order_/test")({
  head: () => ({
    meta: [
      { title: "Тест к уроку — Sozmor" },
      { name: "description", content: "Короткий тест на понимание материала урока." },
    ],
  }),
  component: () => (
    <StudentShell>
      <TestPage />
    </StudentShell>
  ),
});

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function TestPage() {
  const { order } = Route.useParams();
  const { currentStudent, lessons, tests, attempts, startAttempt, saveAnswer, submitAttempt } =
    useApp();
  const student = currentStudent!;
  const num = Number(order);
  const lesson = lessons.find((l) => l.order === num);
  const test = testForLesson(tests, num);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);
  const autoSubmittedRef = useRef(false);

  const attempt: TestAttempt | undefined = attempts.find((a) => a.id === attemptId);
  const active = test ? activeAttempt(attempts, student.id, test.id) : undefined;
  const best = test ? bestAttempt(attempts, student.id, test.id) : null;

  useEffect(() => {
    setAttemptId(active?.id ?? null);
    autoSubmittedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [num]);

  useEffect(() => {
    if (!attempt || attempt.status !== "in_progress") return;
    const tick = () => {
      const left = Math.max(
        0,
        Math.round((new Date(attempt.expiresAt).getTime() - Date.now()) / 1000),
      );
      setRemaining(left);
      if (left === 0 && !autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        submitAttempt(attempt.id);
        toast.info("Время закончилось — тест отправлен автоматически");
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [attempt, submitAttempt]);

  if (!lesson || !test) {
    return (
      <div className="space-y-5">
        <BackLink order={num} />
        <EmptyState
          icon={Lock}
          title="Тест не найден"
          description="Проверьте ссылку или вернитесь к уроку."
        />
      </div>
    );
  }

  const availability = testAvailability(student, test, attempts);

  if (availability === "locked") {
    const notWatched = lessonState(student, num) !== "completed";
    return (
      <div className="space-y-5">
        <BackLink order={num} />
        <EmptyState
          icon={Lock}
          title="Тест пока недоступен"
          description={
            notWatched
              ? "Досмотрите видеоурок, чтобы открыть тест."
              : "Тест ещё не опубликован куратором."
          }
        />
      </div>
    );
  }

  if (test.questions.length === 0) {
    return (
      <div className="space-y-5">
        <BackLink order={num} />
        <EmptyState
          icon={AlertTriangle}
          title="Тест ещё готовится"
          description="Куратор пока не добавил вопросы."
        />
      </div>
    );
  }

  const submittedAttempt = attempt && attempt.status === "submitted" ? attempt : null;

  return (
    <div className="space-y-6 rise-in">
      <BackLink order={num} />

      {submittedAttempt ? (
        <ResultView attempt={submittedAttempt} test={test} passingScore={test.passingScore} />
      ) : attempt && attempt.status === "in_progress" ? (
        <TakingView
          attempt={attempt}
          test={test}
          remaining={remaining}
          onAnswer={(questionId, optionIds) => saveAnswer(attempt.id, questionId, optionIds)}
          onSubmit={() => submitAttempt(attempt.id)}
        />
      ) : (
        <IntroView
          title={test.title}
          questionCount={test.questions.length}
          timeLimitSec={test.timeLimitSec}
          passingScore={test.passingScore}
          best={best}
          onStart={() => {
            const a = startAttempt(student.id, test.id);
            if (a) setAttemptId(a.id);
          }}
        />
      )}
    </div>
  );
}

function IntroView({
  title,
  questionCount,
  timeLimitSec,
  passingScore,
  best,
  onStart,
}: {
  title: string;
  questionCount: number;
  timeLimitSec: number;
  passingScore: number;
  best: TestAttempt | null;
  onStart: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-5 rise-in">
      <div className="surface-card p-6 text-center">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Тест</p>
        <h1 className="mt-1 text-2xl font-extrabold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Проверьте знания после урока.</p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-muted/70 p-3">
            <p className="text-lg font-extrabold">{questionCount}</p>
            <p className="text-[11px] text-muted-foreground">вопросов</p>
          </div>
          <div className="rounded-xl bg-muted/70 p-3">
            <p className="text-lg font-extrabold">{Math.round(timeLimitSec / 60)} мин</p>
            <p className="text-[11px] text-muted-foreground">на тест</p>
          </div>
          <div className="rounded-xl bg-muted/70 p-3">
            <p className="text-lg font-extrabold">{passingScore}%</p>
            <p className="text-[11px] text-muted-foreground">проходной балл</p>
          </div>
        </div>

        {best && (
          <p className="mt-4 text-xs text-muted-foreground">
            Последний результат: <span className="font-bold text-foreground">{best.score}%</span>{" "}
            {best.passed ? "· тест пройден" : "· нужно повторить"}
          </p>
        )}

        <button
          onClick={onStart}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3 text-sm font-bold text-primary-foreground shadow-glow"
        >
          {best ? "Пройти ещё раз" : "Начать тест"}
        </button>
      </div>
    </div>
  );
}

function TakingView({
  attempt,
  test,
  remaining,
  onAnswer,
  onSubmit,
}: {
  attempt: TestAttempt;
  test: LessonTest;
  remaining: number;
  onAnswer: (questionId: string, optionIds: string[]) => void;
  onSubmit: () => void;
}) {
  const answeredCount = test.questions.filter(
    (q) => (attempt.answers[q.id] ?? []).length > 0,
  ).length;
  const low = remaining <= 60;
  const critical = remaining <= 10;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div
        className={`sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur lg:top-0 lg:mx-0 lg:rounded-2xl lg:border lg:px-5 ${
          critical ? "border-destructive/50" : ""
        }`}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold">{test.title}</p>
          <p className="text-[11px] text-muted-foreground">
            Отвечено {answeredCount} из {test.questions.length}
          </p>
        </div>
        <div
          className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-extrabold tabular-nums ${
            critical
              ? "bg-destructive/10 text-destructive"
              : low
                ? "bg-warning-soft text-warning"
                : "bg-muted text-foreground"
          }`}
        >
          <Clock3 className="size-4" />
          {formatTime(remaining)}
        </div>
      </div>

      {remaining <= 60 && remaining > 10 && (
        <p className="text-center text-xs font-semibold text-warning">Осталась 1 минута</p>
      )}
      {remaining <= 10 && remaining > 0 && (
        <p className="text-center text-xs font-bold text-destructive">
          Осталось {remaining} секунд
        </p>
      )}

      <div className="space-y-4">
        {test.questions.map((q, qi) => {
          const selected = attempt.answers[q.id] ?? [];
          return (
            <div key={q.id} className="surface-card p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Вопрос {qi + 1} из {test.questions.length}
              </p>
              <p className="mt-1.5 text-base font-bold">{q.text || "—"}</p>
              <div className="mt-3.5 space-y-2">
                {q.options.map((o) => {
                  const checked = selected.includes(o.id);
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => {
                        if (q.type === "single") {
                          onAnswer(q.id, [o.id]);
                        } else {
                          onAnswer(
                            q.id,
                            checked ? selected.filter((id) => id !== o.id) : [...selected, o.id],
                          );
                        }
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                        checked
                          ? "border-primary bg-primary-soft/60"
                          : "border-border bg-surface hover:bg-muted/60"
                      }`}
                    >
                      <span
                        className={`grid size-4 shrink-0 place-items-center border text-[10px] ${
                          q.type === "single" ? "rounded-full" : "rounded-[4px]"
                        } ${checked ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}
                      >
                        {checked && "✓"}
                      </span>
                      {o.text || "—"}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onSubmit}
        className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3.5 text-sm font-bold text-primary-foreground shadow-glow"
      >
        Отправить тест
      </button>
    </div>
  );
}

function ResultView({
  attempt,
  test,
  passingScore,
}: {
  attempt: TestAttempt;
  test: LessonTest;
  passingScore: number;
}) {
  const [showReview, setShowReview] = useState(false);

  return (
    <div className="mx-auto max-w-lg space-y-5 rise-in">
      <div className="surface-card p-6 text-center">
        <div
          className={`mx-auto grid size-14 place-items-center rounded-full ${
            attempt.passed ? "bg-success-soft text-success" : "bg-warning-soft text-warning"
          }`}
        >
          {attempt.passed ? <CheckCircle2 className="size-7" /> : <XCircle className="size-7" />}
        </div>
        <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Тест завершён
        </p>
        <h1 className="mt-1 text-xl font-extrabold">{test.title}</h1>

        <p className="mt-4 text-4xl font-extrabold">
          {attempt.correctCount} / {attempt.totalQuestions}
        </p>
        <p className="mt-1 text-sm font-bold text-muted-foreground">{attempt.score}%</p>

        <div className="mt-4">
          <Pill tone={attempt.passed ? "success" : "warning"}>
            {attempt.passed ? "Тест пройден" : `Нужно повторить · проходной ${passingScore}%`}
          </Pill>
        </div>

        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          Куратор видит ваш результат и сам решает, когда открыть следующий урок.
        </p>

        <button
          onClick={() => setShowReview((v) => !v)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-3 text-sm font-bold transition hover:bg-muted"
        >
          {showReview ? "Скрыть разбор ответов" : "Показать разбор ответов"}
        </button>
      </div>

      {showReview && (
        <div className="space-y-3">
          {test.questions.map((q, qi) => {
            const selected = attempt.answers[q.id] ?? [];
            const correctIds = q.options.filter((o) => o.isCorrect).map((o) => o.id);
            const isQuestionCorrect =
              correctIds.length === selected.length &&
              correctIds.every((id) => selected.includes(id));
            return (
              <div key={q.id} className="surface-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Вопрос {qi + 1} из {test.questions.length}
                  </p>
                  <Pill tone={isQuestionCorrect ? "success" : "danger"}>
                    {isQuestionCorrect ? "Верно" : "Неверно"}
                  </Pill>
                </div>
                <p className="mt-1.5 text-base font-bold">{q.text || "—"}</p>
                <div className="mt-3.5 space-y-2">
                  {q.options.map((o) => {
                    const wasSelected = selected.includes(o.id);
                    const tone = o.isCorrect
                      ? "border-success bg-success-soft/60"
                      : wasSelected
                        ? "border-destructive bg-destructive/10"
                        : "border-border bg-surface";
                    return (
                      <div
                        key={o.id}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium ${tone}`}
                      >
                        <span
                          className={`grid size-4 shrink-0 place-items-center border text-[10px] ${
                            q.type === "single" ? "rounded-full" : "rounded-[4px]"
                          } ${
                            o.isCorrect
                              ? "border-success bg-success text-white"
                              : wasSelected
                                ? "border-destructive bg-destructive text-white"
                                : "border-input"
                          }`}
                        >
                          {(o.isCorrect || wasSelected) && (o.isCorrect ? "✓" : "✕")}
                        </span>
                        <span className="min-w-0 flex-1">{o.text || "—"}</span>
                        {wasSelected && !o.isCorrect && (
                          <span className="shrink-0 text-[11px] font-bold text-destructive">
                            Ваш ответ
                          </span>
                        )}
                        {o.isCorrect && (
                          <span className="shrink-0 text-[11px] font-bold text-success">
                            Правильный ответ
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {selected.length === 0 && (
                    <p className="text-xs text-muted-foreground">Вы не ответили на этот вопрос.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BackLink({ order }: { order: number }) {
  return (
    <Link
      to="/lesson/$order"
      params={{ order: String(order) }}
      className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> Вернуться к уроку
    </Link>
  );
}
