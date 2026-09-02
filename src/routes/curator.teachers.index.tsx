import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Presentation, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { TODAY, type LanguageCode, type Teacher } from "@/lib/mock-data";
import { studentsInGroup, useApp } from "@/lib/store";
import { CuratorShell } from "@/components/CuratorShell";
import { Avatar, EmptyState, LangPill, SectionTitle, TeacherStatusPill } from "@/components/shared";

export const Route = createFileRoute("/curator/teachers/")({
  validateSearch: (search: Record<string, unknown>): { new?: number } =>
    search["new"] ? { new: 1 } : {},
  head: () => ({
    meta: [
      { title: "Преподаватели — кабинет куратора" },
      { name: "description", content: "Преподаватели академии: группы, ученики и расписание." },
    ],
  }),
  component: () => (
    <CuratorShell>
      <TeachersPage />
    </CuratorShell>
  ),
});

const field =
  "w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10";

function TeachersPage() {
  const { new: openNew } = Route.useSearch();
  const { teachers, groups, students, meetings } = useApp();
  const [open, setOpen] = useState(Boolean(openNew));

  const summary = {
    active: teachers.filter((t) => t.status === "active").length,
    absent: teachers.filter((t) => t.status === "absent").length,
    replacement: teachers.filter((t) => t.status === "replacement").length,
  };
  const practicesToday = meetings.filter((m) => m.date === TODAY && m.status === "scheduled").length;

  const rowFor = (t: Teacher) => {
    const tGroups = groups.filter((g) => g.teacherId === t.id && g.status !== "archived");
    const studentCount = tGroups.reduce((sum, g) => sum + studentsInGroup(students, g.id).length, 0);
    const indCount = students.filter((s) => s.type === "INDIVIDUAL" && s.teacherId === t.id).length;
    const nextPractice = meetings
      .filter(
        (m) =>
          m.status === "scheduled" &&
          m.date >= TODAY &&
          tGroups.some((g) => g.id === m.groupId),
      )
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))[0];
    return { tGroups, studentCount: studentCount + indCount, nextPractice };
  };

  return (
    <div className="space-y-5 rise-in">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold sm:text-3xl">Преподаватели</h1>
          <p className="mt-1 text-sm text-muted-foreground">{teachers.length} всего</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-glow"
        >
          <Plus className="size-4" /> <span className="hidden sm:inline">Добавить преподавателя</span>
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Активны", v: summary.active },
          { l: "Отсутствуют", v: summary.absent },
          { l: "Нужна замена", v: summary.replacement },
          { l: "Практик сегодня", v: practicesToday },
        ].map((x) => (
          <div key={x.l} className="surface-card p-4">
            <p className="text-2xl font-extrabold">{x.v}</p>
            <p className="text-[11px] font-semibold text-muted-foreground">{x.l}</p>
          </div>
        ))}
      </div>

      <SectionTitle title="Список" icon={Presentation} />
      {teachers.length === 0 ? (
        <EmptyState icon={Presentation} title="Преподавателей нет" />
      ) : (
        <div className="surface-card divide-y divide-border overflow-hidden">
          {teachers.map((t) => {
            const r = rowFor(t);
            return (
              <Link
                key={t.id}
                to="/curator/teachers/$id"
                params={{ id: t.id }}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 transition hover:bg-muted/60"
              >
                <Avatar name={t.name} tone={t.tone} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{t.name}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    {t.languages.map((l) => (
                      <LangPill key={l} code={l} />
                    ))}
                    <span>
                      · {r.tGroups.length} групп · {r.studentCount} учеников
                      {r.nextPractice ? ` · ближайшая ${r.nextPractice.date}` : ""}
                    </span>
                  </p>
                </div>
                <TeacherStatusPill status={t.status} />
              </Link>
            );
          })}
        </div>
      )}

      {open && <CreateTeacherModal onClose={() => setOpen(false)} />}
    </div>
  );
}

function CreateTeacherModal({ onClose }: { onClose: () => void }) {
  const { addTeacher } = useApp();
  const [f, setF] = useState({ name: "", phone: "", en: true, ru: false });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) {
      toast.error("Введите имя");
      return;
    }
    const languages: LanguageCode[] = [];
    if (f.en) languages.push("en");
    if (f.ru) languages.push("ru");
    if (languages.length === 0) languages.push("en");
    addTeacher({
      id: `t-${Date.now()}`,
      name: f.name.trim(),
      phone: f.phone,
      languages,
      status: "active",
      tone: "var(--tone-3)",
    });
    toast.success("Преподаватель добавлен");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-t-3xl bg-surface p-5 shadow-lift sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Новый преподаватель</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground">
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-5 space-y-3">
          <input
            className={field}
            placeholder="Имя и фамилия"
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
          />
          <input
            className={field}
            placeholder="Телефон"
            value={f.phone}
            onChange={(e) => setF({ ...f, phone: e.target.value })}
          />
          <div className="flex gap-2">
            {(["en", "ru"] as const).map((l) => {
              const on = l === "en" ? f.en : f.ru;
              return (
                <button
                  type="button"
                  key={l}
                  onClick={() => setF({ ...f, [l]: !on })}
                  className={`flex-1 rounded-xl border px-3 py-3 text-sm font-bold transition ${
                    on ? "border-primary bg-primary-soft" : "border-border bg-surface"
                  }`}
                >
                  {l === "en" ? "English" : "Русский"}
                </button>
              );
            })}
          </div>
        </div>
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
            Добавить
          </button>
        </div>
      </form>
    </div>
  );
}
