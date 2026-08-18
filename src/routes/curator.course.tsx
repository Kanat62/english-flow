import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Clock3, Search, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { COURSE, LESSONS } from "@/lib/mock-data";
import { useApp } from "@/lib/store";
import { CuratorShell } from "@/components/CuratorShell";
import { EmptyState, Pill, SectionTitle } from "@/components/shared";

export const Route = createFileRoute("/curator/course")({
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
  const { meetings, students } = useApp();
  const [query, setQuery] = useState("");

  const list = useMemo(
    () =>
      LESSONS.filter((l) =>
        `${l.title} ${l.description} ${l.block}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  const openedCount = (order: number) => students.filter((s) => s.openedUpTo >= order).length;

  return (
    <div className="space-y-5 rise-in">
      <header>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Курс English</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {LESSONS.length} уроков · {COURSE.variants.map((v) => `${v.type} ${v.duration}`).join(" · ")}
        </p>
      </header>

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
            return (
              <div key={l.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-4 py-3.5 sm:flex sm:justify-between">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-xs font-extrabold text-muted-foreground">
                  {l.order}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{l.title}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    <Clock3 className="size-3 shrink-0" /> {l.duration} · {l.block}
                  </p>
                </div>
                <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-auto sm:shrink-0">
                  <Pill tone="neutral">Открыт у {openedCount(l.order)}</Pill>
                  {practice ? (
                    <a
                      href={practice.meetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary-soft px-3 py-1.5 text-[11px] font-bold text-accent-foreground"
                    >
                      <Video className="size-3.5" /> Практика
                    </a>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">Без практики</span>
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
