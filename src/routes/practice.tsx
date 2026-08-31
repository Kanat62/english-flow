import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Sparkles, Video } from "lucide-react";
import { TODAY } from "@/lib/mock-data";
import { dueVocab, formatDate, relativeDay, useApp } from "@/lib/store";
import { StudentShell } from "@/components/StudentShell";
import { EmptyState, MeetingPill } from "@/components/shared";

export const Route = createFileRoute("/practice")({
  head: () => ({
    meta: [
      { title: "Практика — Sozmor" },
      {
        name: "description",
        content: "Ближайшее занятие в Google Meet и история практик.",
      },
    ],
  }),
  component: () => (
    <StudentShell>
      <PracticePage />
    </StudentShell>
  ),
});

function PracticePage() {
  const { currentStudent, meetingsFor, lessons } = useApp();
  const student = currentStudent!;
  const meetings = meetingsFor(student);
  const due = dueVocab(student);

  const upcoming = meetings
    .filter((m) => m.status === "scheduled" && m.date >= TODAY)
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))[0];

  const history = meetings
    .filter((m) => m.status !== "scheduled" || m.date < TODAY)
    .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));

  const topicOf = (lessonOrder: number) =>
    lessons.find((l) => l.order === lessonOrder)?.title ?? "";

  return (
    <div className="space-y-6 rise-in">
      <header>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Практика</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Твой английский — через живой разговор с преподавателем.
        </p>
      </header>

      {upcoming ? (
        <div className="relative overflow-hidden rounded-3xl gradient-hero p-5 text-primary-foreground shadow-lift sm:p-7">
          <div className="absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">
              {relativeDay(upcoming.date)} · {upcoming.startTime}–{upcoming.endTime}
            </p>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
              {topicOf(upcoming.lessonOrder) || upcoming.title}
            </h2>
            <p className="mt-1.5 text-sm text-white/80">
              {upcoming.type === "GROUP" ? "Групповое занятие" : "Индивидуальное занятие"} · Google
              Meet
            </p>

            {due.length > 0 && (
              <div className="mt-5 rounded-2xl bg-white/10 p-4">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/70">
                  <Sparkles className="size-3.5" /> Подготовься
                </p>
                <p className="mt-1.5 text-sm text-white/90">
                  Повтори {due.length} {due.length === 1 ? "слово" : "слов"} перед занятием
                </p>
              </div>
            )}

            <a
              href={upcoming.meetUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[oklch(0.42_0.19_275)] transition hover:opacity-90 active:scale-[0.99]"
            >
              <Video className="size-4" /> Подключиться
            </a>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={CalendarClock}
          title="Практика пока не назначена"
          description="Куратор добавит занятие и ссылку Google Meet — оно появится здесь."
        />
      )}

      {history.length > 0 && (
        <section>
          <h2 className="mb-3 text-[13px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            История
          </h2>
          <div className="surface-card divide-y divide-border overflow-hidden">
            {history.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                  <Video className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">
                    {topicOf(m.lessonOrder) || m.title}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {formatDate(m.date)} · {m.startTime}
                  </span>
                </span>
                <MeetingPill status={m.status} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
