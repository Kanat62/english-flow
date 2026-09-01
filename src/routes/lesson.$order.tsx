import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Lock } from "lucide-react";
import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import { toast } from "sonner";
import {
  lessonState,
  testAvailability,
  testForLesson,
  useApp,
  watchedPctOf,
} from "@/lib/store";
import { StudentShell } from "@/components/StudentShell";
import { EmptyState, LessonPill, Pill, ProgressBar, VideoPlayer } from "@/components/shared";
import type { LessonTest, Student, TestAttempt } from "@/lib/mock-data";

const COMPLETE_THRESHOLD = 0.9;

export const Route = createFileRoute("/lesson/$order")({
  head: () => ({
    meta: [
      { title: "Урок — akcent_academy" },
      { name: "description", content: "Видеоурок, теория и практика по теме курса." },
      { property: "og:title", content: "Видеоурок курса English" },
      { property: "og:description", content: "Теория в видео и практика в Google Meet." },
    ],
  }),
  component: () => (
    <StudentShell>
      <LessonPage />
    </StudentShell>
  ),
});

function LessonPage() {
  const { order } = Route.useParams();
  const {
    currentStudent,
    completeLesson,
    updateWatchProgress,
    testVideoUrl,
    lessons,
    tests,
    attempts,
  } = useApp();
  const navigate = useNavigate();
  const student = currentStudent!;
  const num = Number(order);
  const lesson = lessons.find((l) => l.order === num);
  const [videoError, setVideoError] = useState(false);
  const [watchedPct, setWatchedPct] = useState(0);
  const autoCompletedRef = useRef(false);

  useEffect(() => {
    setWatchedPct(watchedPctOf(student, num));
    autoCompletedRef.current = false;
    setVideoError(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [num]);

  if (!lesson) {
    return (
      <EmptyState
        icon={Lock}
        title="Урок не найден"
        description="Проверьте ссылку или вернитесь к курсу."
      />
    );
  }

  const state = lessonState(student, lesson.order);
  if (state === "locked") {
    return (
      <div className="space-y-5">
        <BackLink />
        <EmptyState
          icon={Lock}
          title="Урок пока закрыт"
          description="Куратор откроет его после текущего этапа обучения."
        />
      </div>
    );
  }

  const prev = lessons.find((l) => l.order === lesson.order - 1);
  const next = lessons.find((l) => l.order === lesson.order + 1);
  const nextLocked = next ? next.order > student.openedUpTo : true;
  const videoSrc = testVideoUrl || lesson.videoUrl;

  const handleProgress = (e: SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    if (!v.duration || Number.isNaN(v.duration)) return;
    const pct = Math.min(100, Math.round((v.currentTime / v.duration) * 100));
    setWatchedPct((prev) => Math.max(prev, pct));
    updateWatchProgress(student.id, lesson.order, pct);
    if (
      !autoCompletedRef.current &&
      state !== "completed" &&
      v.currentTime / v.duration >= COMPLETE_THRESHOLD
    ) {
      autoCompletedRef.current = true;
      completeLesson(student.id, lesson.order);
      toast.success("Урок завершён — вы посмотрели 90%+ видео");
    }
  };

  return (
    <div className="space-y-6 rise-in">
      <BackLink />

      <div className="overflow-hidden rounded-3xl bg-[oklch(0.18_0.02_285)] shadow-lift">
        {videoError ? (
          <div className="flex aspect-video flex-col items-center justify-center gap-2 text-center text-sm text-white/70">
            <p className="font-semibold text-white">Не удалось загрузить видео.</p>
            <p>Попробуйте обновить страницу.</p>
          </div>
        ) : (
          <VideoPlayer
            src={videoSrc}
            onError={() => setVideoError(true)}
            onTimeUpdate={handleProgress}
            onEnded={handleProgress}
            className="aspect-video w-full"
            poster="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='9'><rect width='16' height='9' fill='%23231f36'/></svg>"
          />
        )}
      </div>

      <section>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="primary">Урок {lesson.order}</Pill>
          <LessonPill state={state} />
          <span className="text-xs font-semibold text-muted-foreground">
            Видео {lesson.duration}
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">{lesson.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {lesson.description}. Смотрите теорию в любое удобное время — урок остаётся доступным.
          На практике вы отработаете тему в живом разговоре с преподавателем.
        </p>

        <div className="mt-5 space-y-3">
          {state === "completed" ? (
            <span className="inline-flex items-center gap-2 rounded-xl bg-success-soft px-5 py-3 text-sm font-bold text-success">
              <CheckCircle2 className="size-4" /> Урок завершён
            </span>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-muted-foreground">
                  Просмотрено {watchedPct}%
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Завершается автоматически после 90%
                </p>
              </div>
              <ProgressBar value={watchedPct} className="mt-2" />
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {next && !nextLocked && (
              <button
                onClick={() =>
                  navigate({ to: "/lesson/$order", params: { order: String(next.order) } })
                }
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-3 text-sm font-bold transition hover:bg-muted"
              >
                Следующий урок <ArrowRight className="size-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      <TestCard order={lesson.order} student={student} tests={tests} attempts={attempts} />

      <div className="surface-card p-5">
        <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Следующий урок
        </p>
        <div className="mt-3 space-y-2">
          {prev && (
            <Link
              to="/lesson/$order"
              params={{ order: String(prev.order) }}
              className="flex items-center gap-2 rounded-xl bg-muted/70 px-3 py-2.5 text-xs font-semibold hover:bg-muted"
            >
              <ArrowLeft className="size-3.5 shrink-0" />
              <span className="truncate">
                {prev.order}. {prev.title}
              </span>
            </Link>
          )}
          {next && (
            <div
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold ${
                nextLocked ? "bg-muted/40 text-muted-foreground" : "bg-muted/70"
              }`}
            >
              {nextLocked ? (
                <Lock className="size-3.5 shrink-0" />
              ) : (
                <ArrowRight className="size-3.5 shrink-0" />
              )}
              <span className="truncate">
                {next.order}. {next.title}
              </span>
            </div>
          )}
        </div>
      </div>

      {next && nextLocked && (
        <p className="rounded-2xl border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
          Следующий урок пока закрыт. Куратор откроет его после текущего этапа.
        </p>
      )}
    </div>
  );
}

function TestCard({
  order,
  student,
  tests,
  attempts,
}: {
  order: number;
  student: Student;
  tests: LessonTest[];
  attempts: TestAttempt[];
}) {
  const test = testForLesson(tests, order);

  if (!test) {
    return (
      <div className="surface-card p-5">
        <p className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          <FileText className="size-4" /> Тест к уроку
        </p>
        <p className="mt-2.5 text-sm text-muted-foreground">
          Куратор пока не добавил тест к этому уроку.
        </p>
      </div>
    );
  }

  const availability = testAvailability(student, test, attempts);
  const minutes = Math.round(test.timeLimitSec / 60);

  return (
    <div className="surface-card p-5">
      <p className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        <FileText className="size-4" /> Тест к уроку
      </p>
      <p className="mt-2.5 text-sm font-bold">{test.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {test.questions.length} вопросов · {minutes} мин
      </p>

      {availability === "locked" ? (
        <span className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-muted px-4 py-2.5 text-xs font-bold text-muted-foreground">
          <Lock className="size-3.5" /> Доступен после просмотра урока
        </span>
      ) : (
        <Link
          to="/lesson/$order/test"
          params={{ order: String(order) }}
          className="mt-4 flex items-center justify-center gap-2 rounded-xl gradient-primary py-2.5 text-sm font-bold text-primary-foreground shadow-glow"
        >
          {availability === "in_progress"
            ? "Продолжить тест"
            : availability === "passed"
              ? "Пересмотреть результат"
              : availability === "failed"
                ? "Пройти ещё раз"
                : "Пройти тест"}
        </Link>
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/learn"
      className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> Назад
    </Link>
  );
}
