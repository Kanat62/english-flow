import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ChevronRight, Clock3, Layers, Lock, Search, Unlock, Upload, Video, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { COURSE_PRODUCTS } from "@/lib/mock-data";
import { publishedUpTo, useApp } from "@/lib/store";
import { CuratorShell } from "@/components/CuratorShell";
import { EmptyState, LangPill, SectionTitle, VideoPlayer } from "@/components/shared";

export const Route = createFileRoute("/curator/course/")({
  head: () => ({
    meta: [
      { title: "Курс и уроки — кабинет куратора" },
      {
        name: "description",
        content: "Каталог уроков курса English: темы, длительность видео и назначенные практики.",
      },
      { property: "og:title", content: "Курс English — администрирование" },
      { property: "og:description", content: "54 урока, видео и практики по темам." },
    ],
  }),
  component: () => (
    <CuratorShell>
      <CuratorCourse />
    </CuratorShell>
  ),
});

function CuratorCourse() {
  const { meetings, students, lessons, publishLesson, unpublishLesson, testVideoUrl, setTestVideoUrl } =
    useApp();
  const [query, setQuery] = useState("");
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const list = useMemo(
    () =>
      lessons.filter((l) =>
        `${l.title} ${l.description} ${l.block}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [lessons, query],
  );

  const allPublishedUpTo = publishedUpTo(students);

  const toggleLesson = (order: number, isOpen: boolean) => {
    if (isOpen) {
      unpublishLesson(order);
      toast.success(
        order < allPublishedUpTo
          ? `Урок ${order} и последующие закрыты`
          : `Урок ${order} закрыт`,
      );
    } else {
      publishLesson(order);
      toast.success(`Урок ${order} опубликован для всех`);
    }
  };

  return (
    <div className="space-y-5 rise-in">
      <header>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Курсы и контент</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Один теоретический контент — несколько форматов. Практика отличается, теория общая.
        </p>
      </header>

      <section>
        <SectionTitle title="Продукты" icon={Layers} />
        <div className="grid gap-3 sm:grid-cols-2">
          {COURSE_PRODUCTS.map((c) => (
            <div key={c.id} className="surface-card space-y-2 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-extrabold">{c.title}</p>
                <LangPill code={c.language} />
              </div>
              <p className="text-xs text-muted-foreground">
                {c.format === "GROUP" ? "Групповой" : "Индивидуальный"} · {c.durationMonths} мес ·{" "}
                {c.price.toLocaleString("ru")} {c.currency}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {c.features.map((feat) => (
                  <span
                    key={feat}
                    className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                  >
                    {feat}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Программа:{" "}
                {c.levelPlan.map((p) => `M${p.month}→${p.level}`).join(" · ")}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="surface-card flex items-start gap-3 p-4">
        <Layers className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-xs text-muted-foreground">
          Библиотека теории ниже используется всеми форматами без дублирования. Для групп урок
          открывается на экране группы, для Individual — здесь (глобально). Открыто{" "}
          {allPublishedUpTo}/{lessons.length}.
        </p>
      </div>

      <div className="surface-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold">Тестовое видео для уроков</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {testVideoUrl
                ? `Активно: ${uploadedName ?? "загруженный файл"} — показывается ученикам во всех уроках вместо стандартного видео.`
                : "Сейчас во всех уроках показывается одно демонстрационное видео. Загрузите свой .mp4, чтобы временно заменить его для проверки."}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const url = URL.createObjectURL(file);
                setTestVideoUrl(url);
                setUploadedName(file.name);
                toast.success("Тестовое видео загружено — оно показывается во всех уроках у учеников");
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-glow"
            >
              <Upload className="size-4" /> Загрузить видео
            </button>
            {testVideoUrl && (
              <button
                onClick={() => {
                  setTestVideoUrl(null);
                  setUploadedName(null);
                  toast.success("Тестовое видео убрано");
                }}
                aria-label="Убрать тестовое видео"
                className="grid size-10 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>
        {testVideoUrl && (
          <VideoPlayer src={testVideoUrl} className="mt-3 aspect-video w-full rounded-xl" />
        )}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Найти урок"
          className="w-full rounded-xl border border-input bg-surface py-2.5 pl-10 pr-3 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </div>

      <SectionTitle title="Уроки" icon={BookOpen} />
      {list.length === 0 ? (
        <EmptyState icon={Search} title="Уроки не найдены" />
      ) : (
        <div className="surface-card divide-y divide-border overflow-hidden">
          {list.map((l) => {
            const practice = meetings.find((m) => m.lessonOrder === l.order);
            const open = l.order <= allPublishedUpTo;
            return (
              <div
                key={l.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3.5 transition hover:bg-muted/30"
              >
                <Link
                  to="/curator/course/$order"
                  params={{ order: String(l.order) }}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-xl text-xs font-extrabold ${
                      open ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {l.order}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{l.title}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                      <Clock3 className="size-3 shrink-0" /> {l.duration} · {l.block}
                      {practice && (
                        <>
                          {" "}
                          · <Video className="size-3 shrink-0" /> практика
                        </>
                      )}
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>

                <button
                  onClick={() => toggleLesson(l.order, open)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                    open
                      ? "bg-success-soft text-success hover:bg-warning-soft hover:text-warning"
                      : "gradient-primary text-primary-foreground"
                  }`}
                >
                  {open ? (
                    <>
                      <Unlock className="size-3.5" /> Открыт
                    </>
                  ) : (
                    <>
                      <Lock className="size-3.5" /> Закрыт
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
