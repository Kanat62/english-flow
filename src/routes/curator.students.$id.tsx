import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Lock,
  Plus,
  StickyNote,
  Trash2,
  Unlock,
  Video,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { LESSONS, TODAY, type AccessStatus } from "@/lib/mock-data";
import {
  accessStatus,
  currentLessonOrder,
  daysLeft,
  formatDate,
  formatFull,
  lessonState,
  progressOf,
  useApp,
} from "@/lib/store";
import { CuratorShell } from "@/components/CuratorShell";
import {
  AccessPill,
  Avatar,
  EmptyState,
  MeetingPill,
  Pill,
  ProgressBar,
  SectionTitle,
} from "@/components/shared";

export const Route = createFileRoute("/curator/students/$id")({
  head: () => ({
    meta: [
      { title: "Карточка ученика — кабинет куратора" },
      {
        name: "description",
        content: "Прогресс ученика, учебный путь, практики и внутренние заметки куратора.",
      },
      { property: "og:title", content: "Карточка ученика" },
      { property: "og:description", content: "Открытие уроков, практики и заметки." },
    ],
  }),
  component: () => (
    <CuratorShell>
      <StudentCard />
    </CuratorShell>
  ),
});

const tabs = ["Обзор", "Учебный путь", "Заметки"] as const;

function StudentCard() {
  const { id } = Route.useParams();
  const {
    students,
    notes,
    addNote,
    deleteNote,
    openNextLesson,
    updateStudent,
    meetingsFor,
    addMeeting,
  } = useApp();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Обзор");
  const [note, setNote] = useState("");
  const [meetForm, setMeetForm] = useState({ date: TODAY, time: "21:00", url: "" });

  const s = students.find((st) => st.id === id);
  if (!s) return <EmptyState icon={Lock} title="Ученик не найден" />;

  const status = accessStatus(s);
  const order = currentLessonOrder(s);
  const meetings = meetingsFor(s);
  const nextMeeting = meetings.find((m) => m.status === "scheduled" && m.date >= TODAY);
  const studentNotes = notes.filter((n) => n.studentId === s.id);
  const canOpen = s.openedUpTo < LESSONS.length;

  return (
    <div className="space-y-5 rise-in">
      <Link
        to="/curator/students"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> К списку
      </Link>

      <header className="surface-card p-5">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 sm:flex sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={`${s.firstName} ${s.lastName}`} tone={s.avatarTone} size="lg" />
            <div className="min-w-0">
              <h1 className="truncate text-xl font-extrabold sm:text-2xl">
                {s.firstName} {s.lastName}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Pill tone={s.type === "GROUP" ? "neutral" : "primary"}>
                  {s.type === "GROUP" ? "Group" : "Individual"}
                </Pill>
                <Pill>{s.level}</Pill>
                <AccessPill status={status} />
              </div>
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground sm:shrink-0">
            <p className="font-bold text-foreground">
              {status === "active" ? `Осталось ${daysLeft(s.endDate)} дн.` : formatFull(s.endDate)}
            </p>
            <p>Последняя активность: {formatDate(s.lastActivity)}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { l: "Текущий урок", v: `${order}` },
            { l: "Прогресс", v: `${progressOf(s)}%` },
            { l: "Открыто", v: `${s.openedUpTo}/${LESSONS.length}` },
            {
              l: "Следующая практика",
              v: nextMeeting ? `${formatDate(nextMeeting.date)} · ${nextMeeting.startTime}` : "—",
            },
          ].map((x) => (
            <div key={x.l} className="rounded-xl bg-muted/70 p-3">
              <p className="text-sm font-extrabold">{x.v}</p>
              <p className="text-[11px] text-muted-foreground">{x.l}</p>
            </div>
          ))}
        </div>

        <ProgressBar value={progressOf(s)} className="mt-4" />

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            disabled={!canOpen}
            onClick={() => {
              openNextLesson(s.id);
              toast.success(`Открыт урок ${s.openedUpTo + 1}`);
            }}
            className="inline-flex items-center gap-2 rounded-xl gradient-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-50"
          >
            <Unlock className="size-4" /> Открыть следующий урок
          </button>
          <select
            value={s.status}
            onChange={(e) => {
              updateStudent(s.id, { status: e.target.value as AccessStatus });
              toast.success("Статус обновлён");
            }}
            className="rounded-xl border border-border bg-surface px-4 py-3 text-sm font-bold outline-none"
          >
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="disabled">Disabled</option>
          </select>
          <label className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-bold text-muted-foreground">
            Доступ до
            <input
              type="date"
              value={s.endDate}
              onChange={(e) => updateStudent(s.id, { endDate: e.target.value })}
              className="bg-transparent text-sm font-bold text-foreground outline-none"
            />
          </label>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
              tab === t
                ? "gradient-primary text-primary-foreground shadow-glow"
                : "border border-border bg-surface text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Обзор" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <section>
            <SectionTitle title="Контакты и доступ" />
            <div className="surface-card divide-y divide-border overflow-hidden text-sm">
              {[
                ["Логин", s.login],
                ["Телефон", s.phone || "—"],
                ["Email", s.email || "—"],
                ["Начало", formatFull(s.startDate)],
                ["Окончание", formatFull(s.endDate)],
              ].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between px-4 py-3">
                  <span className="text-muted-foreground">{l}</span>
                  <span className="font-bold">{v}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionTitle title="Практики" icon={CalendarClock} />
            <div className="space-y-2.5">
              {meetings.length === 0 && <EmptyState icon={Video} title="Практик пока нет" />}
              {meetings.map((m) => (
                <div key={m.id} className="surface-card flex items-center gap-3 p-4">
                  <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Video className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(m.date)} · {m.startTime}
                    </p>
                  </div>
                  <MeetingPill status={m.status} />
                </div>
              ))}
            </div>

            <div className="surface-card mt-3 space-y-2 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Новая практика по уроку {order}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={meetForm.date}
                  onChange={(e) => setMeetForm({ ...meetForm, date: e.target.value })}
                  className="rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none"
                />
                <input
                  type="time"
                  value={meetForm.time}
                  onChange={(e) => setMeetForm({ ...meetForm, time: e.target.value })}
                  className="rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none"
                />
              </div>
              <input
                placeholder="https://meet.google.com/..."
                value={meetForm.url}
                onChange={(e) => setMeetForm({ ...meetForm, url: e.target.value })}
                className="w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none"
              />
              <button
                onClick={() => {
                  if (!meetForm.url) return toast.error("Добавьте ссылку Google Meet");
                  const [h, min] = meetForm.time.split(":");
                  addMeeting({
                    id: `m-${Date.now()}`,
                    lessonOrder: order,
                    studentId: s.type === "GROUP" ? "group" : s.id,
                    title: `Практика: ${LESSONS[order - 1]?.title ?? ""}`,
                    date: meetForm.date,
                    startTime: meetForm.time,
                    endTime: `${String((Number(h) + 1) % 24).padStart(2, "0")}:${min}`,
                    meetUrl: meetForm.url,
                    type: s.type,
                    status: "scheduled",
                  });
                  setMeetForm({ ...meetForm, url: "" });
                  toast.success("Практика назначена");
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-2.5 text-sm font-bold text-primary-foreground"
              >
                <Plus className="size-4" /> Назначить практику
              </button>
            </div>
          </section>
        </div>
      )}

      {tab === "Учебный путь" && (
        <div className="surface-card max-h-[70vh] divide-y divide-border overflow-y-auto">
          {LESSONS.map((l) => {
            const st = lessonState(s, l.order);
            return (
              <div key={l.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    st === "completed"
                      ? "bg-success-soft text-success"
                      : st === "available"
                        ? "gradient-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {st === "completed" ? (
                    <CheckCircle2 className="size-4" />
                  ) : st === "locked" ? (
                    <Lock className="size-3.5" />
                  ) : (
                    l.order
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">
                    {l.order}. {l.title}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{l.block}</span>
                </span>
                <span className="hidden sm:block">
                  <Pill
                    tone={st === "completed" ? "success" : st === "available" ? "primary" : "neutral"}
                  >
                    {st === "completed" ? "Завершён" : st === "available" ? "Открыт" : "Закрыт"}
                  </Pill>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {tab === "Заметки" && (
        <div className="space-y-3">
          <div className="surface-card p-4">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Внутренняя заметка о прогрессе ученика…"
              className="w-full resize-none rounded-xl border border-input bg-surface p-3 text-sm outline-none focus:border-primary"
            />
            <button
              onClick={() => {
                if (!note.trim()) return;
                addNote(s.id, note.trim());
                setNote("");
                toast.success("Заметка добавлена");
              }}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-2.5 text-sm font-bold text-primary-foreground sm:w-auto sm:px-6"
            >
              <Plus className="size-4" /> Добавить заметку
            </button>
          </div>

          {studentNotes.length === 0 ? (
            <EmptyState icon={StickyNote} title="У вас пока нет заметок" description="Ученик их не видит." />
          ) : (
            studentNotes.map((n) => (
              <div key={n.id} className="surface-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold">{n.author}</p>
                    <p className="text-[11px] text-muted-foreground">{formatFull(n.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => deleteNote(n.id)}
                    className="text-muted-foreground transition hover:text-destructive"
                    aria-label="Удалить заметку"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{n.content}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
