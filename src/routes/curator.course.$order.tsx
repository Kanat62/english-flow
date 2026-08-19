import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Lock,
  PlayCircle,
  Unlock,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { lessonStats, publishedUpTo, useApp, watchedPctOf } from "@/lib/store";
import { CuratorShell } from "@/components/CuratorShell";
import {
  Avatar,
  EmptyState,
  Pill,
  ProgressBar,
  SectionTitle,
  VideoPlayer,
} from "@/components/shared";

const DEFAULT_VIDEO_URL = "/Video%20Project%201.mp4";

export const Route = createFileRoute("/curator/course/$order")({
  head: () => ({
    meta: [
      { title: "Редактирование урока — кабинет куратора" },
      {
        name: "description",
        content: "Текст, видео и прогресс учеников по уроку.",
      },
    ],
  }),
  component: () => (
    <CuratorShell>
      <LessonEditorPage />
    </CuratorShell>
  ),
});

function LessonEditorPage() {
  const { order } = Route.useParams();
  const { students, lessons, updateLesson, publishLesson, unpublishLesson } = useApp();
  const num = Number(order);
  const lesson = lessons.find((l) => l.order === num);
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [description, setDescription] = useState(lesson?.description ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!lesson) return;
    setTitle(lesson.title);
    setDescription(lesson.description);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.order, lesson?.title, lesson?.description]);

  if (!lesson) {
    return (
      <div className="space-y-5">
        <BackLink />
        <EmptyState icon={Lock} title="Урок не найден" />
      </div>
    );
  }

  const stats = lessonStats(students, lesson.order);
  const isOpenForAll = lesson.order <= publishedUpTo(students);

  const saveText = () => {
    updateLesson(lesson.order, { title: title.trim() || lesson.title, description });
    toast.success("Урок обновлён");
  };

  const statusOf = (studentId: string) => {
    const s = students.find((st) => st.id === studentId)!;
    if (s.openedUpTo < lesson.order) return { label: "Закрыт", tone: "neutral" as const };
    if (s.completed.includes(lesson.order)) return { label: "Завершён", tone: "success" as const };
    const pct = watchedPctOf(s, lesson.order);
    if (pct > 0) return { label: `Смотрит · ${pct}%`, tone: "primary" as const };
    return { label: "Не начал", tone: "neutral" as const };
  };

  return (
    <div className="max-w-3xl space-y-5 rise-in">
      <BackLink />

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Урок {lesson.order}
          </p>
          <h1 className="truncate text-2xl font-extrabold sm:text-3xl">{lesson.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={isOpenForAll ? "success" : "neutral"}>
            {isOpenForAll ? "Открыт всем" : "Закрыт / частично открыт"}
          </Pill>
          {isOpenForAll ? (
            <button
              onClick={() => {
                unpublishLesson(lesson.order);
                toast.success(`Урок ${lesson.order} закрыт`);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-bold text-muted-foreground transition hover:bg-muted"
            >
              <Lock className="size-3.5" /> Закрыть урок
            </button>
          ) : (
            <button
              onClick={() => {
                publishLesson(lesson.order);
                toast.success(`Урок ${lesson.order} опубликован для всех`);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
            >
              <Unlock className="size-3.5" /> Опубликовать для всех
            </button>
          )}
        </div>
      </header>

      <section className="surface-card space-y-3 p-5">
        <SectionTitle title="Текст урока" />
        <label className="block text-xs font-semibold text-muted-foreground">
          Название
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary"
          />
        </label>
        <label className="block text-xs font-semibold text-muted-foreground">
          Описание
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full resize-none rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary"
          />
        </label>
        <button
          onClick={saveText}
          className="rounded-xl gradient-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow"
        >
          Сохранить текст
        </button>
      </section>

      <section className="surface-card space-y-2.5 p-5">
        <SectionTitle title="Видео" icon={PlayCircle} />
        <VideoPlayer src={lesson.videoUrl} className="aspect-video w-full rounded-xl" />
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const url = URL.createObjectURL(file);
              updateLesson(lesson.order, { videoUrl: url });
              toast.success("Видео урока заменено");
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-bold transition hover:bg-muted"
          >
            <Upload className="size-3.5" /> Заменить видео
          </button>
          {lesson.videoUrl !== DEFAULT_VIDEO_URL && (
            <button
              onClick={() => {
                updateLesson(lesson.order, { videoUrl: DEFAULT_VIDEO_URL });
                toast.success("Видео сброшено к стандартному");
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-bold text-muted-foreground transition hover:text-foreground"
            >
              Сбросить к стандартному
            </button>
          )}
        </div>
      </section>

      <section className="surface-card space-y-2.5 p-5">
        <SectionTitle title="Прогресс учеников" icon={CheckCircle2} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Всего", value: stats.total },
            { label: "Открыт у", value: stats.opened },
            { label: "Смотрят", value: stats.inProgress },
            { label: "Завершили", value: stats.completed },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-muted/70 p-3 text-center">
              <p className="text-lg font-extrabold">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        <ProgressBar
          value={stats.opened ? (stats.completed / stats.opened) * 100 : 0}
          className="mt-1"
          tone="success"
        />

        <div className="surface-card mt-2 divide-y divide-border overflow-hidden">
          {students.map((s) => {
            const st = statusOf(s.id);
            return (
              <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                <Avatar name={`${s.firstName} ${s.lastName}`} tone={s.avatarTone} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {s.firstName} {s.lastName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {s.type === "GROUP" ? "Group" : "Individual"}
                  </p>
                </div>
                {st.label === "Закрыт" ? (
                  <Lock className="size-3.5 shrink-0 text-muted-foreground" />
                ) : st.label === "Не начал" ? (
                  <Circle className="size-3.5 shrink-0 text-muted-foreground" />
                ) : null}
                <Pill tone={st.tone}>{st.label}</Pill>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/curator/course"
      className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> К курсу
    </Link>
  );
}
