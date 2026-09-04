import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  FileText,
  Lock,
  PlayCircle,
  Plus,
  Trash2,
  Unlock,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useApp } from "@/lib/store";
import type { QuestionType } from "@/lib/mock-data";
import { CuratorShell } from "@/components/CuratorShell";
import { EmptyState, Pill, SectionTitle, VideoPlayer } from "@/components/shared";

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
  const {
    lessons,
    updateLesson,
    tests,
    createTest,
    updateTest,
    deleteTest,
    publishTest,
    unpublishTest,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    updateOption,
  } = useApp();
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

  const test = tests.find((t) => t.lessonOrder === lesson.order);

  const saveText = () => {
    updateLesson(lesson.order, { title: title.trim() || lesson.title, description });
    toast.success("Урок обновлён");
  };

  return (
    <div className="max-w-3xl space-y-5 rise-in">
      <BackLink />

      <header className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Урок {lesson.order}
        </p>
        <h1 className="truncate text-2xl font-extrabold sm:text-3xl">{lesson.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Контент урока общий для всех форматов. Доступ открывается каждой группе на её экране.
        </p>
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

      <section className="surface-card space-y-3.5 p-5">
        <SectionTitle title="Тест к уроку" icon={FileText} />
        {!test ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-8 text-center">
            <p className="text-sm text-muted-foreground">У этого урока пока нет теста.</p>
            <button
              onClick={() => createTest(lesson.order)}
              className="inline-flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-xs font-bold text-primary-foreground"
            >
              <Plus className="size-3.5" /> Создать тест
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-3">
              <label className="min-w-[200px] flex-1 text-xs font-semibold text-muted-foreground">
                Название теста
                <input
                  value={test.title}
                  onChange={(e) => updateTest(test.id, { title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary"
                />
              </label>
              <label className="w-28 text-xs font-semibold text-muted-foreground">
                Время (мин)
                <input
                  type="number"
                  min={1}
                  value={Math.round(test.timeLimitSec / 60)}
                  onChange={(e) =>
                    updateTest(test.id, {
                      timeLimitSec: Math.max(1, Number(e.target.value) || 1) * 60,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary"
                />
              </label>
              <label className="w-32 text-xs font-semibold text-muted-foreground">
                Проходной, %
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={test.passingScore}
                  onChange={(e) =>
                    updateTest(test.id, {
                      passingScore: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={test.status === "published" ? "success" : "neutral"}>
                {test.status === "published" ? "Опубликован" : "Черновик"}
              </Pill>
              {test.status === "published" ? (
                <button
                  onClick={() => {
                    unpublishTest(test.id);
                    toast.success("Тест снят с публикации");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-bold text-muted-foreground transition hover:bg-muted"
                >
                  <Lock className="size-3.5" /> Снять с публикации
                </button>
              ) : (
                <button
                  disabled={test.questions.length === 0}
                  onClick={() => {
                    publishTest(test.id);
                    toast.success("Тест опубликован");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-40"
                >
                  <Unlock className="size-3.5" /> Опубликовать
                </button>
              )}
              <button
                onClick={() => {
                  if (!window.confirm("Удалить тест вместе со всеми вопросами?")) return;
                  deleteTest(test.id);
                  toast.success("Тест удалён");
                }}
                className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-bold text-muted-foreground transition hover:text-destructive"
              >
                <Trash2 className="size-3.5" /> Удалить тест
              </button>
            </div>

            <div className="space-y-3">
              {test.questions.map((q, qi) => (
                <div key={q.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-2 grid size-6 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-bold">
                      {qi + 1}
                    </span>
                    <div className="min-w-0 flex-1 space-y-2">
                      <input
                        value={q.text}
                        onChange={(e) => updateQuestion(test.id, q.id, { text: e.target.value })}
                        placeholder="Текст вопроса"
                        className="w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary"
                      />
                      <select
                        value={q.type}
                        onChange={(e) =>
                          updateQuestion(test.id, q.id, { type: e.target.value as QuestionType })
                        }
                        className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-bold outline-none"
                      >
                        <option value="single">Один правильный ответ</option>
                        <option value="multiple">Несколько правильных ответов</option>
                      </select>
                      <div className="space-y-1.5 pt-1">
                        {q.options.map((o) => (
                          <div key={o.id} className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                updateOption(test.id, q.id, o.id, { isCorrect: !o.isCorrect })
                              }
                              title="Отметить правильным"
                              className={`grid size-5 shrink-0 place-items-center border text-[10px] ${
                                q.type === "single" ? "rounded-full" : "rounded-[4px]"
                              } ${
                                o.isCorrect
                                  ? "border-success bg-success text-white"
                                  : "border-input"
                              }`}
                            >
                              {o.isCorrect && "✓"}
                            </button>
                            <input
                              value={o.text}
                              onChange={(e) =>
                                updateOption(test.id, q.id, o.id, { text: e.target.value })
                              }
                              placeholder="Вариант ответа"
                              className="w-full min-w-0 flex-1 rounded-lg border border-input bg-surface px-2.5 py-2 text-xs font-medium outline-none focus:border-primary"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteQuestion(test.id, q.id)}
                      aria-label="Удалить вопрос"
                      className="mt-2 shrink-0 text-muted-foreground transition hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => addQuestion(test.id)}
              className="inline-flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-2.5 text-xs font-bold text-muted-foreground transition hover:bg-muted"
            >
              <Plus className="size-3.5" /> Добавить вопрос
            </button>
          </>
        )}
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
