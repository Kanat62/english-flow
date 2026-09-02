import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, CalendarClock, Lock, Plus, Unlock, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { TODAY, type GroupStatus } from "@/lib/mock-data";
import {
  accessStatus,
  currentLessonOrder,
  daysLeft,
  formatDate,
  formatFull,
  groupHealth,
  groupStage,
  groupWeekSchedule,
  progressOf,
  studentsInGroup,
  teacherGroupConflict,
  teacherOf,
  useApp,
  weekdayFull,
} from "@/lib/store";
import { CuratorShell } from "@/components/CuratorShell";
import {
  Avatar,
  EmptyState,
  GroupStatusPill,
  LangPill,
  Pill,
  ProgressBar,
  SectionTitle,
} from "@/components/shared";

export const Route = createFileRoute("/curator/groups/$id")({
  head: () => ({
    meta: [
      { title: "Группа — кабинет куратора" },
      { name: "description", content: "Операционный экран группы: этап, расписание, ученики." },
    ],
  }),
  component: () => (
    <CuratorShell>
      <GroupScreen />
    </CuratorShell>
  ),
});

function GroupScreen() {
  const { id } = Route.useParams();
  const {
    groups,
    students,
    teachers,
    lessons,
    meetings,
    updateGroup,
    assignTeacherToGroup,
    publishLessonForGroup,
    addMeeting,
  } = useApp();
  const [meetForm, setMeetForm] = useState({ date: TODAY, url: "" });
  const [showStudents, setShowStudents] = useState(true);

  const g = groups.find((x) => x.id === id);
  if (!g) return <EmptyState icon={Lock} title="Группа не найдена" />;

  const stage = groupStage(g, lessons);
  const health = groupHealth(students, g.id);
  const teacher = teacherOf(teachers, g.teacherId);
  const roster = studentsInGroup(students, g.id);
  const groupMeetings = meetings
    .filter((m) => m.groupId === g.id)
    .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));

  const dayKind = (d: Date) => {
    const idx = (d.getDay() + 6) % 7; // 0=Пн … 6=Вс
    if (idx === 6) return "Выходной";
    return idx % 2 === 0 ? "Теория" : "Практика";
  };
  const todayKind = dayKind(new Date(TODAY));
  const tomorrow = new Date(TODAY);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKind = dayKind(tomorrow);

  const nextLesson = Math.min(lessons.length, g.currentLesson + 1);
  const nextLessonTitle = lessons.find((l) => l.order === nextLesson)?.title ?? "";

  const scheduleMeeting = () => {
    if (!meetForm.url && !g.meetUrl) {
      toast.error("Добавьте ссылку Google Meet (в группе или в форме)");
      return;
    }
    const [h, min] = g.practiceStart.split(":");
    addMeeting({
      id: `m-${Date.now()}`,
      lessonOrder: g.currentLesson,
      studentId: "group",
      groupId: g.id,
      title: `Практика: ${stage.topic}`,
      date: meetForm.date,
      startTime: g.practiceStart,
      endTime: g.practiceEnd || `${String((Number(h) + 1) % 24).padStart(2, "0")}:${min}`,
      meetUrl: meetForm.url || g.meetUrl,
      type: "GROUP",
      status: "scheduled",
    });
    setMeetForm({ ...meetForm, url: "" });
    toast.success("Практика назначена группе");
  };

  return (
    <div className="space-y-5 overflow-x-hidden rise-in">
      <Link
        to="/curator/groups"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> К группам
      </Link>

      <header className="surface-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold sm:text-2xl">{g.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <LangPill code={g.language} />
              <GroupStatusPill status={g.status} />
              <Pill tone="neutral">
                {roster.length} / {g.maxStudents} учеников
              </Pill>
            </div>
          </div>
          <select
            value={g.status}
            onChange={(e) => {
              updateGroup(g.id, { status: e.target.value as GroupStatus });
              toast.success("Статус группы обновлён");
            }}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm font-bold outline-none"
          >
            <option value="recruiting">Набор</option>
            <option value="active">Активна</option>
            <option value="finished">Завершена</option>
            <option value="archived">Архив</option>
          </select>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { l: "Старт", v: formatFull(g.startDate) },
            { l: "Финиш", v: formatFull(g.endDate) },
            { l: "Практика", v: `${g.practiceStart}–${g.practiceEnd}` },
            { l: "Преподаватель", v: teacher?.name ?? "—" },
          ].map((x) => (
            <div key={x.l} className="rounded-xl bg-muted/70 p-3">
              <p className="truncate text-sm font-extrabold">{x.v}</p>
              <p className="text-[11px] text-muted-foreground">{x.l}</p>
            </div>
          ))}
        </div>
      </header>

      {/* Текущий этап группы */}
      <section className="surface-card p-5">
        <SectionTitle title="Текущий этап группы" icon={BookOpen} />
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-xl gradient-primary px-3 py-2 text-sm font-extrabold text-primary-foreground">
            MONTH {stage.month} · {stage.level}
          </span>
          <span className="rounded-xl bg-muted px-3 py-2 text-sm font-bold">Lesson {stage.lesson}</span>
          <span className="text-sm font-semibold text-muted-foreground">Topic: {stage.topic}</span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Это общий учебный этап группы — прогресс каждого ученика хранится отдельно.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-muted/60 p-3">
            <p className="text-[11px] text-muted-foreground">Сегодня ({weekdayFull(TODAY)})</p>
            <p className="text-sm font-extrabold">{todayKind}</p>
          </div>
          <div className="rounded-xl bg-muted/60 p-3">
            <p className="text-[11px] text-muted-foreground">Завтра</p>
            <p className="text-sm font-extrabold">{tomorrowKind}</p>
          </div>
        </div>
      </section>

      {/* Здоровье группы */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Всего", v: health.total, tone: "neutral" as const },
          { l: "Активны", v: health.active, tone: "success" as const },
          { l: "At risk", v: health.atRisk, tone: "warning" as const },
          { l: "Не заходят", v: health.inactive, tone: "danger" as const },
        ].map((x) => (
          <div key={x.l} className="surface-card p-4">
            <Pill tone={x.tone}>{x.l}</Pill>
            <p className="mt-2 text-2xl font-extrabold">{x.v}</p>
          </div>
        ))}
      </section>

      {/* Открытие урока для группы */}
      <section className="surface-card p-5">
        <SectionTitle title="Открытие урока для группы" icon={Unlock} />
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">
              Lesson {nextLesson}. {nextLessonTitle}
            </p>
            <p className="text-xs text-muted-foreground">
              Текущий открытый этап группы: Lesson {g.currentLesson}
            </p>
          </div>
          <button
            onClick={() => {
              publishLessonForGroup(g.id, nextLesson);
              toast.success(`Lesson ${nextLesson} открыт всем активным ученикам группы`);
            }}
            className="inline-flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-xs font-bold text-primary-foreground"
          >
            <Unlock className="size-3.5" /> Открыть для группы
          </button>
        </div>
      </section>

      {/* Расписание группы */}
      <section className="surface-card p-5">
        <SectionTitle title="Расписание группы" icon={CalendarClock} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {groupWeekSchedule(g).map((d) => (
            <div
              key={d.day}
              className={`rounded-xl p-3 text-center ${
                d.kind === "practice"
                  ? "bg-primary-soft"
                  : d.kind === "rest"
                    ? "bg-muted/40"
                    : "bg-muted/70"
              }`}
            >
              <p className="text-xs font-extrabold">{d.day}</p>
              <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
                {d.kind === "practice" ? "Практика" : d.kind === "rest" ? "Выходной" : "Теория"}
              </p>
              {d.time && <p className="text-[10px] text-muted-foreground">{d.time}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Преподаватель */}
      <section className="surface-card p-5">
        <SectionTitle title="Преподаватель" />
        <label className="block text-xs font-semibold text-muted-foreground">
          Назначить / заменить
          <select
            className="mt-1 w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary"
            value={g.teacherId ?? ""}
            onChange={(e) => {
              const tid = e.target.value || null;
              if (tid) {
                const conflict = teacherGroupConflict(groups, tid, g.practiceStart, g.id);
                if (conflict) {
                  toast.error(`Нельзя назначить: в ${g.practiceStart} у преподавателя уже «${conflict.name}»`);
                  return;
                }
              }
              assignTeacherToGroup(g.id, tid);
              toast.success(tid ? "Преподаватель назначен" : "Преподаватель снят");
            }}
          >
            <option value="">— без преподавателя —</option>
            {teachers
              .filter((t) => t.languages.includes(g.language))
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
        </label>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Система не даёт назначить преподавателя в две группы с одинаковым вечерним слотом.
        </p>
      </section>

      {/* Практики группы */}
      <section className="surface-card p-5">
        <SectionTitle title="Практика группы" icon={CalendarClock} />
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <input
            type="date"
            value={meetForm.date}
            onChange={(e) => setMeetForm({ ...meetForm, date: e.target.value })}
            className="rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none"
          />
          <input
            placeholder={g.meetUrl || "https://meet.google.com/…"}
            value={meetForm.url}
            onChange={(e) => setMeetForm({ ...meetForm, url: e.target.value })}
            className="rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none"
          />
          <button
            onClick={scheduleMeeting}
            className="inline-flex items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
          >
            <Plus className="size-4" /> Назначить
          </button>
        </div>
        <label className="mt-3 block text-xs font-semibold text-muted-foreground">
          Постоянная ссылка Google Meet группы
          <input
            defaultValue={g.meetUrl}
            onBlur={(e) => {
              updateGroup(g.id, { meetUrl: e.target.value.trim() });
              toast.success("Ссылка группы сохранена");
            }}
            placeholder="https://meet.google.com/…"
            className="mt-1 w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary"
          />
        </label>
        <div className="mt-3 space-y-2">
          {groupMeetings.slice(0, 5).map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2 text-sm">
              <span className="font-bold">{formatDate(m.date)}</span>
              <span className="text-muted-foreground">
                {m.startTime}–{m.endTime}
              </span>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{m.title}</span>
              <Pill
                tone={m.status === "completed" ? "success" : m.status === "cancelled" ? "danger" : "primary"}
              >
                {m.status === "completed" ? "Проведена" : m.status === "cancelled" ? "Отменена" : "Запланирована"}
              </Pill>
            </div>
          ))}
        </div>
      </section>

      {/* Ученики группы */}
      <section>
        <SectionTitle
          title={`Ученики (${roster.length})`}
          icon={Users}
          action={
            <button
              onClick={() => setShowStudents((v) => !v)}
              className="text-xs font-bold text-primary"
            >
              {showStudents ? "Свернуть" : "Показать"}
            </button>
          }
        />
        {showStudents &&
          (roster.length === 0 ? (
            <EmptyState icon={Users} title="В группе пока нет учеников" />
          ) : (
            <div className="surface-card divide-y divide-border overflow-hidden">
              {roster.map((s) => {
                const idle = -daysLeft(s.lastActivity, TODAY);
                return (
                  <Link
                    key={s.id}
                    to="/curator/students/$id"
                    params={{ id: s.id }}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition hover:bg-muted/60"
                  >
                    <Avatar name={`${s.firstName} ${s.lastName}`} tone={s.avatarTone} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">
                        {s.firstName} {s.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        урок {currentLessonOrder(s)} · {progressOf(s)}% · активность{" "}
                        {formatDate(s.lastActivity)}
                      </p>
                      <ProgressBar value={progressOf(s)} className="mt-1.5 h-1.5 max-w-48" />
                    </div>
                    {accessStatus(s) !== "active" ? (
                      <Pill tone="warning">{accessStatus(s)}</Pill>
                    ) : idle >= 5 ? (
                      <Pill tone="danger">Не заходит</Pill>
                    ) : idle >= 3 ? (
                      <Pill tone="warning">At risk</Pill>
                    ) : (
                      <Pill tone="success">Активен</Pill>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
      </section>
    </div>
  );
}
