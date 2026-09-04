import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  Lock,
  Plus,
  StickyNote,
  Trash2,
  Video,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  TODAY,
  courseProduct,
  languageNameRu,
  type AccessStatus,
} from "@/lib/mock-data";
import {
  accessStatus,
  currentLessonOrder,
  daysLeft,
  formatDate,
  formatFull,
  groupOf,
  lessonState,
  levelForLesson,
  monthOfLesson,
  practiceStats,
  progressOf,
  teacherOf,
  testsStats,
  useApp,
} from "@/lib/store";
import { CuratorShell } from "@/components/CuratorShell";
import {
  AccessPill,
  Avatar,
  EmptyState,
  LangPill,
  MeetingPill,
  PaymentPill,
  Pill,
  ProgressBar,
  SectionTitle,
  Select,
} from "@/components/shared";

export const Route = createFileRoute("/curator/students/$id")({
  head: () => ({
    meta: [
      { title: "Карточка ученика — кабинет куратора" },
      {
        name: "description",
        content: "Обзор, обучение, практика, прогресс, заметки и оплата ученика.",
      },
    ],
  }),
  component: () => (
    <CuratorShell>
      <StudentCard />
    </CuratorShell>
  ),
});

const tabs = ["Обзор", "Обучение", "Практика", "Прогресс", "Заметки", "Оплата"] as const;

function StudentCard() {
  const { id } = Route.useParams();
  const {
    students,
    groups,
    teachers,
    lessons,
    notes,
    addNote,
    deleteNote,
    updateStudent,
    assignStudentToGroup,
    meetingsFor,
    tests,
    attempts,
  } = useApp();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Обзор");
  const [note, setNote] = useState("");

  const s = students.find((st) => st.id === id);
  if (!s) return <EmptyState icon={Lock} title="Ученик не найден" />;

  const status = accessStatus(s);
  const order = currentLessonOrder(s);
  const product = courseProduct(s.language, s.type);
  const group = groupOf(groups, s);
  const teacher = teacherOf(teachers, s.teacherId);
  const meetings = meetingsFor(s);
  const nextMeeting = meetings.find((m) => m.status === "scheduled" && m.date >= TODAY);
  const studentNotes = notes.filter((n) => n.studentId === s.id);
  const ts = testsStats(s, tests, attempts);
  const ps = practiceStats(meetings);
  const pay = s.payment;

  return (
    <div className="space-y-5 overflow-x-hidden rise-in">
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
                <LangPill code={s.language} />
                <Pill tone={s.type === "GROUP" ? "neutral" : "primary"}>
                  {s.type === "GROUP" ? "Group" : "Individual"}
                </Pill>
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
            { l: "Открыто", v: `${s.openedUpTo}/${lessons.length}` },
            {
              l: "Ближайшая практика",
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
          <Select
            className="w-40"
            ariaLabel="Статус доступа"
            value={s.status}
            onChange={(v) => {
              updateStudent(s.id, { status: v as AccessStatus });
              toast.success("Статус обновлён");
            }}
            options={[
              { value: "active", label: "Active" },
              { value: "expired", label: "Expired" },
              { value: "disabled", label: "Disabled" },
            ]}
          />
          <label className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-bold text-muted-foreground">
            Доступ до
            <input
              type="date"
              value={s.endDate}
              onChange={(e) => updateStudent(s.id, { endDate: e.target.value })}
              className="bg-transparent text-sm font-bold text-foreground outline-none"
            />
          </label>
          {!s.onboarded && (
            <button
              onClick={() => {
                updateStudent(s.id, { onboarded: true });
                toast.success("Onboarding отмечен завершённым");
              }}
              className="rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              Завершить onboarding
            </button>
          )}
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
            <SectionTitle title="Кто и что купил" />
            <div className="surface-card divide-y divide-border overflow-hidden text-sm">
              {[
                ["Логин", `@${s.login}`],
                ["Телефон", s.phone || "—"],
                ["Возраст", s.age ? String(s.age) : "—"],
                ["Город", s.city || "—"],
                ["Менеджер", s.managerName],
                ["Продукт", `${product.title} · ${product.price.toLocaleString("ru")} ${product.currency}`],
                ["Начало курса", formatFull(s.startDate)],
                ["Конец курса", formatFull(s.endDate)],
              ].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-muted-foreground">{l}</span>
                  <span className="text-right font-bold">{v}</span>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-muted-foreground">Оплата курса</span>
                <div className="flex flex-col items-end gap-1">
                  <PaymentPill status={pay.status} />
                  <span className="text-xs font-bold">
                    {pay.paid.toLocaleString("ru")} / {pay.totalCost.toLocaleString("ru")}{" "}
                    {product.currency}
                    {pay.status !== "full" && (
                      <span className="ml-1 font-semibold text-muted-foreground">
                        (осталось {Math.max(0, pay.totalCost - pay.paid).toLocaleString("ru")})
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <SectionTitle title="Где учится" icon={GraduationCap} />
            <div className="surface-card space-y-3 p-4 text-sm">
              {s.type === "GROUP" ? (
                group ? (
                  <Link
                    to="/curator/groups/$id"
                    params={{ id: group.id }}
                    className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2.5 font-bold transition hover:bg-muted"
                  >
                    {group.name}
                    <ArrowLeft className="size-4 rotate-180 text-muted-foreground" />
                  </Link>
                ) : (
                  <p className="rounded-xl bg-warning-soft px-3 py-2.5 text-xs font-bold text-warning">
                    Не назначен в группу
                  </p>
                )
              ) : (
                <p className="text-xs text-muted-foreground">
                  Индивидуальное обучение — группа не требуется.
                </p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Преподаватель</span>
                <span className="font-bold">{teacher?.name ?? "—"}</span>
              </div>

              {s.type === "GROUP" && (
                <label className="block text-xs font-semibold text-muted-foreground">
                  Изменить группу
                  <Select
                    className="mt-1"
                    ariaLabel="Изменить группу"
                    value={s.groupId ?? ""}
                    onChange={(v) => {
                      assignStudentToGroup(s.id, v || null);
                      toast.success(
                        v
                          ? "Группа изменена — расписание практики обновлено"
                          : "Ученик снят с группы",
                      );
                    }}
                    options={[
                      { value: "", label: "— без группы —" },
                      ...groups
                        .filter((g) => g.language === s.language)
                        .map((g) => ({ value: g.id, label: g.name })),
                    ]}
                  />
                </label>
              )}
            </div>
          </section>
        </div>
      )}

      {tab === "Обучение" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: "Текущий уровень", v: levelForLesson(product, order) },
              { l: "Текущий месяц", v: `${monthOfLesson(order)} / 6` },
              { l: "Текущий урок", v: `${order}` },
              { l: "Открытые уроки", v: `${s.openedUpTo}` },
              { l: "Пройдено", v: `${s.completed.length}` },
              { l: "Тесты пройдены", v: `${ts.passed}/${ts.total}` },
            ].map((x) => (
              <div key={x.l} className="surface-card p-3">
                <p className="text-sm font-extrabold">{x.v}</p>
                <p className="text-[11px] text-muted-foreground">{x.l}</p>
              </div>
            ))}
          </div>
          <div className="surface-card max-h-[60vh] divide-y divide-border overflow-y-auto">
            {lessons.map((l) => {
              const stt = lessonState(s, l.order);
              return (
                <div key={l.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                      stt === "completed"
                        ? "bg-success-soft text-success"
                        : stt === "available"
                          ? "gradient-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {stt === "completed" ? <CheckCircle2 className="size-3.5" /> : l.order}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {l.order}. {l.title}
                  </span>
                  <Pill tone={stt === "completed" ? "success" : stt === "available" ? "primary" : "neutral"}>
                    {stt === "completed" ? "Пройден" : stt === "available" ? "Открыт" : "Закрыт"}
                  </Pill>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "Практика" && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              { l: "Всего практик", v: `${ps.total}` },
              { l: "Посещено", v: `${ps.attended}` },
              {
                l: "Ближайшая",
                v: nextMeeting ? formatDate(nextMeeting.date) : "—",
              },
            ].map((x) => (
              <div key={x.l} className="surface-card p-3 text-center">
                <p className="text-lg font-extrabold">{x.v}</p>
                <p className="text-[11px] text-muted-foreground">{x.l}</p>
              </div>
            ))}
          </div>
          {meetings.length === 0 && <EmptyState icon={Video} title="Практик пока нет" />}
          {meetings.map((m) => (
            <div key={m.id} className="surface-card flex flex-wrap items-center gap-3 p-4">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                <Video className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{m.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(m.date)} · {m.startTime}–{m.endTime}
                  {m.status === "completed" &&
                    ` · ${m.attended?.includes(s.id) ? "присутствовал" : "не присутствовал"}`}
                </p>
              </div>
              {m.meetUrl && (
                <a
                  href={m.meetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg gradient-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
                >
                  Meet
                </a>
              )}
              <MeetingPill status={m.status} />
            </div>
          ))}
        </div>
      )}

      {tab === "Прогресс" && (
        <div className="space-y-4">
          <div className="surface-card p-5">
            <SectionTitle title="Course progress" icon={CheckCircle2} />
            <ProgressBar value={progressOf(s)} tone="success" />
            <p className="mt-2 text-xs text-muted-foreground">
              {s.completed.length} из {lessons.length} уроков · {progressOf(s)}%
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: "Lessons", v: `${s.completed.length}/${lessons.length}` },
              { l: "Tests", v: `${ts.passed}/${ts.total}` },
              { l: "Practice", v: `${ps.attended}/${ps.total}` },
              { l: "Streak", v: `${Math.max(0, daysLeft(TODAY, s.lastActivity))} дн.` },
            ].map((x) => (
              <div key={x.l} className="surface-card p-3">
                <p className="text-sm font-extrabold">{x.v}</p>
                <p className="text-[11px] text-muted-foreground">{x.l}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Заметки" && (
        <div className="space-y-3">
          <div className="surface-card p-4">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Внутренняя заметка куратора… (ученик её не видит)"
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
            <EmptyState icon={StickyNote} title="Заметок пока нет" />
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

      {tab === "Оплата" && (
        <div className="space-y-4">
          <div className="surface-card p-5">
            <SectionTitle title="Платёжная информация" icon={CalendarClock} />
            <p className="mb-3 text-xs text-muted-foreground">
              Платформа не принимает оплату — данные передаёт отдел продаж.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { l: "Стоимость", v: pay.totalCost.toLocaleString("ru") },
                { l: "Оплачено", v: pay.paid.toLocaleString("ru") },
                { l: "Осталось", v: Math.max(0, pay.totalCost - pay.paid).toLocaleString("ru") },
              ].map((x) => (
                <div key={x.l} className="rounded-xl bg-muted/70 p-3 text-center">
                  <p className="text-base font-extrabold">{x.v}</p>
                  <p className="text-[11px] text-muted-foreground">{x.l}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Дата покупки</span>
              <span className="font-bold">{formatFull(pay.purchaseDate)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Статус оплаты</span>
              <Pill
                tone={pay.status === "full" ? "success" : pay.status === "partial" ? "warning" : "danger"}
              >
                {pay.status === "full"
                  ? "Оплачено полностью"
                  : pay.status === "partial"
                    ? "Первоначальный платёж"
                    : "Не оплачено"}
              </Pill>
            </div>
          </div>
          <div className="surface-card space-y-3 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Обновить платёж
            </p>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Общая сумма
                <input
                  type="number"
                  defaultValue={pay.totalCost}
                  onBlur={(e) => {
                    const total = Number(e.target.value) || pay.totalCost;
                    updateStudent(s.id, {
                      payment: {
                        ...pay,
                        totalCost: total,
                        status: pay.paid >= total ? "full" : pay.paid > 0 ? "partial" : "unpaid",
                      },
                    });
                    toast.success("Оплата обновлена");
                  }}
                  className="mt-1 w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary"
                />
              </label>
              <label className="text-xs font-semibold text-muted-foreground">
                Оплачено
                <input
                  type="number"
                  defaultValue={pay.paid}
                  onBlur={(e) => {
                    const paid = Number(e.target.value) || 0;
                    updateStudent(s.id, {
                      payment: {
                        ...pay,
                        paid,
                        status:
                          paid >= pay.totalCost ? "full" : paid > 0 ? "partial" : "unpaid",
                      },
                    });
                    toast.success("Оплата обновлена");
                  }}
                  className="mt-1 w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary"
                />
              </label>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Доступ выдаётся независимо от полноты оплаты — бизнес утверждает правило отдельно.
              Продукт: {languageNameRu(s.language)}.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
