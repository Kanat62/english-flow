import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  LANGUAGES,
  groupName,
  nextGroupCode,
  type Group,
  type GroupStatus,
  type LanguageCode,
} from "@/lib/mock-data";
import {
  groupStage,
  studentsInGroup,
  teacherGroupConflict,
  teacherOf,
  useApp,
} from "@/lib/store";
import { CuratorShell } from "@/components/CuratorShell";
import { Avatar, EmptyState, GroupStatusPill, LangPill, SectionTitle } from "@/components/shared";

export const Route = createFileRoute("/curator/groups/")({
  validateSearch: (search: Record<string, unknown>): { new?: number } =>
    search["new"] ? { new: 1 } : {},
  head: () => ({
    meta: [
      { title: "Группы — кабинет куратора" },
      { name: "description", content: "Потоки академии: набор, активные и завершённые группы." },
    ],
  }),
  component: () => (
    <CuratorShell>
      <GroupsPage />
    </CuratorShell>
  ),
});

const field =
  "w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10";

function GroupsPage() {
  const { new: openNew } = Route.useSearch();
  const { groups, students, teachers, lessons } = useApp();
  const [status, setStatus] = useState<"all" | GroupStatus>("all");
  const [lang, setLang] = useState<"all" | LanguageCode>("all");
  const [open, setOpen] = useState(Boolean(openNew));

  const list = useMemo(
    () =>
      groups
        .filter((g) => (status === "all" ? true : g.status === status))
        .filter((g) => (lang === "all" ? true : g.language === lang))
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [groups, status, lang],
  );

  const byLang = LANGUAGES.map((l) => ({
    code: l.code,
    name: l.name,
    count: groups.filter((g) => g.language === l.code && g.status !== "archived").length,
  }));

  return (
    <div className="space-y-5 rise-in">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold sm:text-3xl">Группы</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {byLang.map((b) => `${b.name} · ${b.count}`).join("   ·   ")}
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-glow"
        >
          <Plus className="size-4" /> <span className="hidden sm:inline">Создать группу</span>
        </button>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select className={field} value={status} onChange={(e) => setStatus(e.target.value as never)}>
          <option value="all">Любой статус</option>
          <option value="recruiting">Набор</option>
          <option value="active">Активные</option>
          <option value="finished">Завершены</option>
          <option value="archived">Архив</option>
        </select>
        <select className={field} value={lang} onChange={(e) => setLang(e.target.value as never)}>
          <option value="all">Все языки</option>
          <option value="en">English</option>
          <option value="ru">Русский</option>
        </select>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={GraduationCap} title="Групп не найдено" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((g) => {
            const stage = groupStage(g, lessons);
            const count = studentsInGroup(students, g.id).length;
            const teacher = teacherOf(teachers, g.teacherId);
            return (
              <Link
                key={g.id}
                to="/curator/groups/$id"
                params={{ id: g.id }}
                className="surface-card space-y-3 p-4 transition hover:border-primary"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold">{g.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {g.startDate} → {g.endDate} · практика {g.practiceStart}–{g.practiceEnd}
                    </p>
                  </div>
                  <GroupStatusPill status={g.status} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <LangPill code={g.language} />
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                    {count} / {g.maxStudents} учеников
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                    Month {stage.month} · {stage.level} · Lesson {stage.lesson}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {teacher ? (
                    <>
                      <Avatar name={teacher.name} tone={teacher.tone} size="sm" />
                      <span className="font-bold">{teacher.name}</span>
                    </>
                  ) : (
                    <span className="font-bold text-warning">⚠ Без преподавателя</span>
                  )}
                  {!g.meetUrl && (g.status === "active" || g.status === "recruiting") && (
                    <span className="font-bold text-warning">· ⚠ Без ссылки</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {open && <CreateGroupModal onClose={() => setOpen(false)} />}
    </div>
  );
}

function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const { teachers, groups, addGroup } = useApp();
  const [f, setF] = useState({
    language: "en" as LanguageCode,
    startDate: "2026-09-14",
    start: "20:00",
    end: "21:00",
    teacherId: "",
    max: "50",
  });

  const conflict = f.teacherId
    ? teacherGroupConflict(groups, f.teacherId, f.start)
    : undefined;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (conflict) {
      toast.error(`У преподавателя уже есть группа в ${f.start}: ${conflict.name}`);
      return;
    }
    const d = new Date(f.startDate);
    const end = new Date(d);
    end.setMonth(end.getMonth() + 6);
    const code = nextGroupCode(groups, f.language);
    const g: Group = {
      id: `g-${Date.now()}`,
      code,
      name: groupName(code, f.language, f.startDate, f.start),
      language: f.language,
      startDate: f.startDate,
      endDate: end.toISOString().slice(0, 10),
      practiceStart: f.start,
      practiceEnd: f.end,
      teacherId: f.teacherId || null,
      maxStudents: Number(f.max) || 50,
      status: "recruiting",
      currentLesson: 1,
      meetUrl: "",
    };
    addGroup(g);
    toast.success(`Группа «${g.name}» создана`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <form
        onSubmit={submit}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface p-5 shadow-lift sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Новая группа</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground">
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Язык
            <select
              className={`${field} mt-1`}
              value={f.language}
              onChange={(e) => setF({ ...f, language: e.target.value as LanguageCode })}
            >
              <option value="en">English</option>
              <option value="ru">Русский</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Дата старта
            <input
              type="date"
              className={`${field} mt-1`}
              value={f.startDate}
              onChange={(e) => setF({ ...f, startDate: e.target.value })}
            />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Начало практики
            <input
              type="time"
              className={`${field} mt-1`}
              value={f.start}
              onChange={(e) => setF({ ...f, start: e.target.value })}
            />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Конец практики
            <input
              type="time"
              className={`${field} mt-1`}
              value={f.end}
              onChange={(e) => setF({ ...f, end: e.target.value })}
            />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Преподаватель
            <select
              className={`${field} mt-1`}
              value={f.teacherId}
              onChange={(e) => setF({ ...f, teacherId: e.target.value })}
            >
              <option value="">— назначить позже —</option>
              {teachers
                .filter((t) => t.languages.includes(f.language))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Максимум учеников
            <input
              type="number"
              min={1}
              className={`${field} mt-1`}
              value={f.max}
              onChange={(e) => setF({ ...f, max: e.target.value })}
            />
          </label>
        </div>

        {conflict && (
          <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive">
            ⚠ У преподавателя в {f.start} уже есть группа: {conflict.name}
          </p>
        )}

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-3 text-sm font-bold text-muted-foreground"
          >
            Отмена
          </button>
          <button
            type="submit"
            className="flex-1 rounded-xl gradient-primary py-3 text-sm font-bold text-primary-foreground shadow-glow"
          >
            Создать группу
          </button>
        </div>
      </form>
    </div>
  );
}
