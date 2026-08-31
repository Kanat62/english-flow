import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, CalendarDays, Video } from "lucide-react";
import { useState } from "react";
import { TODAY } from "@/lib/mock-data";
import { formatDate, relativeDay, useApp } from "@/lib/store";
import { StudentShell } from "@/components/StudentShell";
import { EmptyState, MeetingPill, Pill, SectionTitle } from "@/components/shared";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "Расписание — akcent_academy" },
      {
        name: "description",
        content: "Теория и практика по датам: темы, время занятий и ссылки Google Meet.",
      },
      { property: "og:title", content: "Расписание занятий" },
      { property: "og:description", content: "Практики в Google Meet и открытые темы теории." },
    ],
  }),
  component: () => (
    <StudentShell>
      <SchedulePage />
    </StudentShell>
  ),
});

interface Item {
  date: string;
  kind: "theory" | "practice";
  title: string;
  subtitle: string;
  order: number;
  meetUrl?: string;
  time?: string;
  status?: "scheduled" | "completed" | "cancelled";
}

const scheduleFilters = [
  { id: "all", label: "Все" },
  { id: "theory", label: "Теория" },
  { id: "practice", label: "Практика" },
] as const;

function SchedulePage() {
  const { currentStudent, meetingsFor, lessons } = useApp();
  const student = currentStudent!;
  const meetings = meetingsFor(student);
  const [filter, setFilter] = useState<(typeof scheduleFilters)[number]["id"]>("all");

  const theory: Item[] = lessons
    .slice(Math.max(0, student.openedUpTo - 4), student.openedUpTo)
    .map((l, i, arr) => {
      const d = new Date(TODAY);
      d.setDate(d.getDate() - (arr.length - 1 - i) * 2);
      return {
        date: d.toISOString().slice(0, 10),
        kind: "theory",
        title: `Урок ${l.order}. ${l.title}`,
        subtitle: "Теория · смотрите в любое время",
        order: l.order,
      };
    });

  const practice: Item[] = meetings.map((m) => ({
    date: m.date,
    kind: "practice",
    title: m.title,
    subtitle: `${m.type === "GROUP" ? "Группа" : "Индивидуально"} · ${m.startTime}–${m.endTime}`,
    order: m.lessonOrder,
    meetUrl: m.meetUrl,
    time: m.startTime,
    status: m.status,
  }));

  const all = [...theory, ...practice]
    .filter((i) => filter === "all" || i.kind === filter)
    .sort((a, b) => a.date.localeCompare(b.date));
  const days = [...new Set(all.map((i) => i.date))];

  const todayPractice = practice.find((p) => p.date === TODAY && p.status === "scheduled");

  return (
    <div className="space-y-6 rise-in">
      <header>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Расписание</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Теория доступна в любое время, практика проходит в живом формате.
        </p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {scheduleFilters.map((f) => (
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

      {todayPractice && (
        <a
          href={todayPractice.meetUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between gap-3 rounded-2xl gradient-hero px-5 py-4 text-primary-foreground shadow-glow"
        >
          <span className="min-w-0">
            <span className="block text-xs font-bold uppercase tracking-wider text-white/70">
              Сегодня практика в {todayPractice.time}
            </span>
            <span className="mt-0.5 block truncate text-sm font-extrabold">
              {todayPractice.title}
            </span>
          </span>
          <span className="shrink-0 rounded-xl bg-white/15 px-4 py-2 text-xs font-bold">
            Подключиться
          </span>
        </a>
      )}

      {days.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title="Занятий пока нет"
          description="Куратор скоро добавит расписание."
        />
      )}

      <div className="space-y-5">
        {days.map((day) => (
          <section key={day}>
            <SectionTitle title={`${relativeDay(day)} · ${formatDate(day)}`} icon={CalendarDays} />
            <div className="space-y-2.5">
              {all
                .filter((i) => i.date === day)
                .map((item, idx) => (
                  <div key={idx} className="surface-card flex items-start gap-3 p-4">
                    <div
                      className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                        item.kind === "theory"
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary-soft text-primary"
                      }`}
                    >
                      {item.kind === "theory" ? (
                        <BookOpen className="size-5" />
                      ) : (
                        <Video className="size-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill tone={item.kind === "theory" ? "neutral" : "primary"}>
                          {item.kind === "theory" ? "Теория" : "Практика"}
                        </Pill>
                        {item.status && <MeetingPill status={item.status} />}
                      </div>
                      <p className="mt-1.5 truncate text-sm font-extrabold">{item.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                      <div className="mt-3">
                        {item.kind === "theory" ? (
                          <Link
                            to="/lesson/$order"
                            params={{ order: String(item.order) }}
                            className="inline-flex rounded-lg bg-muted px-3.5 py-2 text-xs font-bold transition hover:bg-primary-soft"
                          >
                            Смотреть теорию
                          </Link>
                        ) : item.status === "scheduled" ? (
                          <a
                            href={item.meetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex rounded-lg gradient-primary px-3.5 py-2 text-xs font-bold text-primary-foreground"
                          >
                            Join Google Meet
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Ссылка на практику недоступна
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
