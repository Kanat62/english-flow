import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Plus, Video } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { LESSONS, TODAY, type CourseType, type MeetingStatus } from "@/lib/mock-data";
import { formatDate, relativeDay, useApp } from "@/lib/store";
import { CuratorShell } from "@/components/CuratorShell";
import { EmptyState, MeetingPill, Pill, SectionTitle } from "@/components/shared";

export const Route = createFileRoute("/curator/schedule")({
  head: () => ({
    meta: [
      { title: "Расписание практик — кабинет куратора" },
      {
        name: "description",
        content: "Все практические занятия школы: даты, время, ссылки Google Meet и статусы.",
      },
      { property: "og:title", content: "Расписание практик" },
      { property: "og:description", content: "Создание практик и управление статусами." },
    ],
  }),
  component: () => (
    <CuratorShell>
      <CuratorSchedule />
    </CuratorShell>
  ),
});

function CuratorSchedule() {
  const { meetings, addMeeting, updateMeeting, students } = useApp();
  const [f, setF] = useState({
    lessonOrder: 18,
    studentId: "group",
    date: TODAY,
    time: "21:00",
    url: "",
  });

  const sorted = [...meetings].sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));
  const days = [...new Set(sorted.map((m) => m.date))];

  const create = () => {
    if (!f.url) {
      toast.error("Добавьте ссылку Google Meet");
      return;
    }
    const [h, min] = f.time.split(":");
    const student = students.find((s) => s.id === f.studentId);
    addMeeting({
      id: `m-${Date.now()}`,
      lessonOrder: f.lessonOrder,
      studentId: f.studentId,
      title: `Практика: ${LESSONS[f.lessonOrder - 1]?.title ?? ""}`,
      date: f.date,
      startTime: f.time,
      endTime: `${String((Number(h) + 1) % 24).padStart(2, "0")}:${min}`,
      meetUrl: f.url,
      type: (student ? student.type : "GROUP") as CourseType,
      status: "scheduled",
    });
    setF({ ...f, url: "" });
    toast.success("Практика создана");
  };

  const field =
    "w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary";

  return (
    <div className="space-y-5 rise-in">
      <header>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Расписание</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Практики в Google Meet для группы и индивидуальных учеников.
        </p>
      </header>

      <section className="surface-card p-5">
        <SectionTitle title="Новая практика" icon={Plus} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <select
            className={field}
            value={f.lessonOrder}
            onChange={(e) => setF({ ...f, lessonOrder: Number(e.target.value) })}
          >
            {LESSONS.map((l) => (
              <option key={l.id} value={l.order}>
                {l.order}. {l.title}
              </option>
            ))}
          </select>
          <select
            className={field}
            value={f.studentId}
            onChange={(e) => setF({ ...f, studentId: e.target.value })}
          >
            <option value="group">Группа (все Group)</option>
            {students
              .filter((s) => s.type === "INDIVIDUAL")
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName}
                </option>
              ))}
          </select>
          <input
            type="date"
            className={field}
            value={f.date}
            onChange={(e) => setF({ ...f, date: e.target.value })}
          />
          <input
            type="time"
            className={field}
            value={f.time}
            onChange={(e) => setF({ ...f, time: e.target.value })}
          />
          <input
            className={field}
            placeholder="Google Meet URL"
            value={f.url}
            onChange={(e) => setF({ ...f, url: e.target.value })}
          />
        </div>
        <button
          onClick={create}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3 text-sm font-bold text-primary-foreground shadow-glow sm:w-auto sm:px-6"
        >
          <Plus className="size-4" /> Создать практику
        </button>
      </section>

      {days.length === 0 && <EmptyState icon={CalendarDays} title="Практик пока нет" />}

      {days.map((day) => (
        <section key={day}>
          <SectionTitle title={`${relativeDay(day)} · ${formatDate(day)}`} icon={CalendarDays} />
          <div className="space-y-2.5">
            {sorted
              .filter((m) => m.date === day)
              .map((m) => {
                const student = students.find((s) => s.id === m.studentId);
                return (
                  <div key={m.id} className="surface-card flex flex-wrap items-center gap-3 p-4">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                      <Video className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold">{m.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {m.startTime}–{m.endTime} ·{" "}
                        {m.studentId === "group"
                          ? "Группа"
                          : `${student?.firstName ?? "Ученик"} ${student?.lastName ?? ""}`}{" "}
                        · урок {m.lessonOrder}
                      </p>
                    </div>
                    <Pill tone={m.type === "GROUP" ? "neutral" : "primary"}>
                      {m.type === "GROUP" ? "Group" : "Individual"}
                    </Pill>
                    <MeetingPill status={m.status} />
                    <select
                      value={m.status}
                      onChange={(e) =>
                        updateMeeting(m.id, { status: e.target.value as MeetingStatus })
                      }
                      className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-bold outline-none"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <a
                      href={m.meetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg gradient-primary px-3.5 py-2 text-xs font-bold text-primary-foreground"
                    >
                      Meet
                    </a>
                  </div>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}
