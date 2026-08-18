import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Lock,
  Video,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { LESSONS } from "@/lib/mock-data";
import { formatDate, lessonState, useApp } from "@/lib/store";
import { StudentShell } from "@/components/StudentShell";
import { EmptyState, LessonPill, Pill } from "@/components/shared";

export const Route = createFileRoute("/lesson/$order")({
  head: () => ({
    meta: [
      { title: "Урок — English Learning Platform" },
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
  const { currentStudent, completeLesson, meetingsFor } = useApp();
  const navigate = useNavigate();
  const student = currentStudent!;
  const num = Number(order);
  const lesson = LESSONS.find((l) => l.order === num);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);

  if (!lesson) {
    return (
      <EmptyState icon={Lock} title="Урок не найден" description="Проверьте ссылку или вернитесь к курсу." />
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

  const practice = meetingsFor(student).find((m) => m.lessonOrder === lesson.order);
  const prev = LESSONS.find((l) => l.order === lesson.order - 1);
  const next = LESSONS.find((l) => l.order === lesson.order + 1);
  const nextLocked = next ? next.order > student.openedUpTo : true;

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
          <video
            ref={videoRef}
            controls
            playsInline
            preload="metadata"
            onError={() => setVideoError(true)}
            className="aspect-video w-full bg-black"
            poster="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='9'><rect width='16' height='9' fill='%23231f36'/></svg>"
          >
            <source src={lesson.videoUrl} type="video/mp4" />
          </video>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
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

          <div className="mt-5 flex flex-wrap gap-3">
            {state !== "completed" ? (
              <button
                onClick={() => {
                  completeLesson(student.id, lesson.order);
                  toast.success("Урок отмечен как завершённый");
                }}
                className="inline-flex items-center gap-2 rounded-xl gradient-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow transition hover:opacity-95"
              >
                <CheckCircle2 className="size-4" /> Отметить завершённым
              </button>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-xl bg-success-soft px-5 py-3 text-sm font-bold text-success">
                <CheckCircle2 className="size-4" /> Урок завершён
              </span>
            )}
            {next && !nextLocked && (
              <button
                onClick={() => navigate({ to: "/lesson/$order", params: { order: String(next.order) } })}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-3 text-sm font-bold transition hover:bg-muted"
              >
                Следующий урок <ArrowRight className="size-4" />
              </button>
            )}
          </div>

          {next && nextLocked && (
            <p className="mt-4 rounded-2xl border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
              Следующий урок пока закрыт. Куратор откроет его после текущего этапа.
            </p>
          )}
        </section>

        <aside className="space-y-4">
          <div className="surface-card p-5">
            <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Практика по теме
            </p>
            {practice ? (
              <>
                <div className="mt-3 flex items-start gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Video className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold">
                      {formatDate(practice.date)} · {practice.startTime}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {practice.type === "GROUP" ? "Группа" : "Индивидуально"} · Google Meet
                    </p>
                  </div>
                </div>
                <a
                  href={practice.meetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 flex items-center justify-center gap-2 rounded-xl gradient-primary py-3 text-sm font-bold text-primary-foreground shadow-glow"
                >
                  Подключиться к практике
                </a>
              </>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                Практика по этому уроку пока не назначена. Ссылка появится здесь и в расписании.
              </p>
            )}
          </div>

          <div className="surface-card p-5">
            <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Соседние уроки
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

          <Link
            to="/schedule"
            className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-bold transition hover:bg-muted"
          >
            <span className="flex items-center gap-2">
              <CalendarClock className="size-4 text-primary" /> Всё расписание
            </span>
            <ArrowRight className="size-4 text-muted-foreground" />
          </Link>
        </aside>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/course"
      className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> К курсу
    </Link>
  );
}
