import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Plus, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { TODAY, type MeetingStatus } from "@/lib/mock-data";
import {
  formatDate,
  groupStage,
  studentsInGroup,
  teacherOf,
  useApp,
  weekRangeOf,
  weekdayFull,
} from "@/lib/store";
import { CuratorShell } from "@/components/CuratorShell";
import { EmptyState, MeetingPill, Pill, SectionTitle } from "@/components/shared";

export const Route = createFileRoute("/curator/schedule")({
  validateSearch: (search: Record<string, unknown>): { new?: number } =>
    search["new"] ? { new: 1 } : {},
  head: () => ({
    meta: [
      { title: "Расписание — кабинет куратора" },
      {
        name: "description",
        content: "Практики академии: сегодня, эта неделя и следующая, сгруппированы по времени.",
      },
    ],
  }),
  component: () => (
    <CuratorShell>
      <CuratorSchedule />
    </CuratorShell>
  ),
});

const RANGES = ["Сегодня", "Эта неделя", "Следующая неделя"] as const;
const field =
  "w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary";

function CuratorSchedule() {
  const { new: openNew } = Route.useSearch();
  const { meetings, groups, teachers, students, lessons, addMeeting, updateMeeting } = useApp();
  const [range, setRange] = useState<(typeof RANGES)[number]>("Сегодня");
  const [showForm, setShowForm] = useState(Boolean(openNew));
  const [f, setF] = useState({ groupId: groups[0]?.id ?? "", date: TODAY, url: "" });

  const dates = useMemo(() => {
    if (range === "Сегодня") return [TODAY];
    const anchor = new Date(TODAY);
    if (range === "Следующая неделя") anchor.setDate(anchor.getDate() + 7);
    return weekRangeOf(anchor.toISOString().slice(0, 10));
  }, [range]);

  const inRange = meetings
    .filter((m) => dates.includes(m.date))
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));

  const byDate = dates
    .map((d) => ({ date: d, items: inRange.filter((m) => m.date === d) }))
    .filter((x) => x.items.length > 0);

  const create = () => {
    const g = groups.find((x) => x.id === f.groupId);
    if (!g) {
      toast.error("Выберите группу");
      return;
    }
    if (!f.url && !g.meetUrl) {
      toast.error("Добавьте ссылку Google Meet");
      return;
    }
    const stage = groupStage(g, lessons);
    addMeeting({
      id: `m-${Date.now()}`,
      lessonOrder: g.currentLesson,
      studentId: "group",
      groupId: g.id,
      title: `Практика: ${stage.topic}`,
      date: f.date,
      startTime: g.practiceStart,
      endTime: g.practiceEnd,
      meetUrl: f.url || g.meetUrl,
      type: "GROUP",
      status: "scheduled",
    });
    setF({ ...f, url: "" });
    toast.success("Практика создана");
  };

  return (
    <div className="space-y-5 rise-in">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Расписание</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Практики групп и индивидуальных учеников в Google Meet.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-glow"
        >
          <Plus className="size-4" /> Создать практику
        </button>
      </header>

      {showForm && (
        <section className="surface-card p-5">
          <SectionTitle title="Новая практика" icon={Plus} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select
              className={field}
              value={f.groupId}
              onChange={(e) => setF({ ...f, groupId: e.target.value })}
            >
              {groups
                .filter((g) => g.status === "active" || g.status === "recruiting")
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
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
              className={field}
              placeholder="Google Meet URL (или ссылка группы)"
              value={f.url}
              onChange={(e) => setF({ ...f, url: e.target.value })}
            />
            <button
              onClick={create}
              className="inline-flex items-center justify-center gap-2 rounded-xl gradient-primary py-2.5 text-sm font-bold text-primary-foreground"
            >
              <Plus className="size-4" /> Создать
            </button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Время берётся из настроек группы — вечерний слот не зашит в код.
          </p>
        </section>
      )}

      <div className="flex gap-2 overflow-x-auto">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
              range === r
                ? "gradient-primary text-primary-foreground shadow-glow"
                : "border border-border bg-surface text-muted-foreground"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {byDate.length === 0 && <EmptyState icon={CalendarDays} title="Практик в этом периоде нет" />}

      {byDate.map(({ date, items }) => {
        const slots = [...new Set(items.map((m) => m.startTime))].sort();
        return (
          <section key={date}>
            <SectionTitle
              title={`${weekdayFull(date)} · ${formatDate(date)}`}
              icon={CalendarDays}
            />
            {slots.map((slot) => (
              <div key={slot} className="mb-3">
                <p className="mb-1.5 text-xs font-bold text-muted-foreground">{slot}</p>
                <div className="space-y-2">
                  {items
                    .filter((m) => m.startTime === slot)
                    .map((m) => {
                      const g = groups.find((x) => x.id === m.groupId);
                      const teacher = g ? teacherOf(teachers, g.teacherId) : null;
                      const count = g ? studentsInGroup(students, g.id).length : 1;
                      return (
                        <div
                          key={m.id}
                          className="surface-card flex flex-wrap items-center gap-3 p-4"
                        >
                          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                            <Video className="size-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-extrabold">
                              {g ? g.name : m.title}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {m.startTime}–{m.endTime} · {teacher?.name ?? "без преподавателя"} ·{" "}
                              {count} учеников
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
                          {m.meetUrl ? (
                            <a
                              href={m.meetUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg gradient-primary px-3.5 py-2 text-xs font-bold text-primary-foreground"
                            >
                              Meet
                            </a>
                          ) : (
                            <span className="text-xs font-bold text-warning">нет ссылки</span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
