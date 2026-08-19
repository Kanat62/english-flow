import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search, Users, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { LESSONS, TODAY, type CourseType, type Student } from "@/lib/mock-data";
import {
  accessStatus,
  addMonths,
  currentLessonOrder,
  formatFull,
  progressOf,
  useApp,
} from "@/lib/store";
import { CuratorShell } from "@/components/CuratorShell";
import { AccessPill, Avatar, EmptyState, Pill, ProgressBar } from "@/components/shared";

export const Route = createFileRoute("/curator/students/")({
  head: () => ({
    meta: [
      { title: "Ученики — кабинет куратора" },
      {
        name: "description",
        content: "Список учеников школы: тип обучения, прогресс и статус доступа.",
      },
      { property: "og:title", content: "Управление учениками" },
      { property: "og:description", content: "Поиск, фильтры и создание учеников." },
    ],
  }),
  component: () => (
    <CuratorShell>
      <StudentsPage />
    </CuratorShell>
  ),
});

const filters = ["Все", "Group", "Individual", "Active", "Expired"] as const;

function StudentsPage() {
  const { students, addStudent } = useApp();
  const [filter, setFilter] = useState<(typeof filters)[number]>("Все");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const list = useMemo(
    () =>
      students.filter((s) => {
        const status = accessStatus(s);
        if (filter === "Group" && s.type !== "GROUP") return false;
        if (filter === "Individual" && s.type !== "INDIVIDUAL") return false;
        if (filter === "Active" && status !== "active") return false;
        if (filter === "Expired" && status !== "expired") return false;
        if (query && !`${s.firstName} ${s.lastName} ${s.login}`.toLowerCase().includes(query.toLowerCase()))
          return false;
        return true;
      }),
    [students, filter, query],
  );

  return (
    <div className="space-y-5 rise-in">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold sm:text-3xl">Ученики</h1>
          <p className="mt-1 text-sm text-muted-foreground">{students.length} всего</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-glow"
        >
          <Plus className="size-4" /> <span className="hidden sm:inline">Добавить ученика</span>
        </button>
      </header>

      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по имени или логину"
            className="w-full rounded-xl border border-input bg-surface py-2.5 pl-10 pr-3 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                filter === f
                  ? "gradient-primary text-primary-foreground shadow-glow"
                  : "border border-border bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={Users} title="Учеников не найдено" description="Измените фильтр или поиск." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="surface-card hidden overflow-hidden lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Ученик</th>
                  <th className="px-4 py-3">Тип</th>
                  <th className="px-4 py-3">Урок</th>
                  <th className="px-4 py-3">Прогресс</th>
                  <th className="px-4 py-3">Доступ</th>
                  <th className="px-4 py-3">До</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((s) => (
                  <tr key={s.id} className="transition hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <Link
                        to="/curator/students/$id"
                        params={{ id: s.id }}
                        className="flex items-center gap-3"
                      >
                        <Avatar name={`${s.firstName} ${s.lastName}`} tone={s.avatarTone} size="sm" />
                        <span>
                          <span className="block font-bold">
                            {s.firstName} {s.lastName}
                          </span>
                          <span className="block text-xs text-muted-foreground">@{s.login}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Pill tone={s.type === "GROUP" ? "neutral" : "primary"}>
                        {s.type === "GROUP" ? "Group" : "Individual"}
                      </Pill>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {currentLessonOrder(s)}/{LESSONS.length}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={progressOf(s)} className="w-24" />
                        <span className="text-xs font-bold">{progressOf(s)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <AccessPill status={accessStatus(s)} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatFull(s.endDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2.5 lg:hidden">
            {list.map((s) => (
              <Link
                key={s.id}
                to="/curator/students/$id"
                params={{ id: s.id }}
                className="surface-card flex items-center gap-3 p-4"
              >
                <Avatar name={`${s.firstName} ${s.lastName}`} tone={s.avatarTone} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold">
                    {s.firstName} {s.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.type === "GROUP" ? "Group" : "Individual"} · урок{" "}
                    {currentLessonOrder(s)}
                  </p>
                  <ProgressBar value={progressOf(s)} className="mt-2 h-1.5" />
                </div>
                <AccessPill status={accessStatus(s)} />
              </Link>
            ))}
          </div>
        </>
      )}

      {open && <CreateStudentModal onClose={() => setOpen(false)} onCreate={addStudent} />}
    </div>
  );
}

function CreateStudentModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (s: Student) => void;
}) {
  const [f, setF] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    login: "",
    password: "",
    type: "GROUP" as CourseType,
    startDate: TODAY,
    endDate: addMonths(TODAY, 3),
  });

  const setType = (type: CourseType) =>
    setF((p) => ({ ...p, type, endDate: addMonths(p.startDate, type === "GROUP" ? 3 : 1) }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.firstName || !f.login || !f.password) {
      toast.error("Заполните имя, логин и пароль");
      return;
    }
    onCreate({
      ...f,
      id: `s-${Date.now()}`,
      status: "active",
      openedUpTo: 1,
      completed: [],
      watched: {},
      lastActivity: TODAY,
      avatarTone: "var(--tone-3)",
    });
    toast.success("Ученик создан и получил доступ");
    onClose();
  };

  const field =
    "w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <form
        onSubmit={submit}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface p-5 shadow-lift sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Новый ученик</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground">
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <input className={field} placeholder="Имя" value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} />
          <input className={field} placeholder="Фамилия" value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} />
          <input className={field} placeholder="Телефон" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          <input className={field} placeholder="Логин" value={f.login} onChange={(e) => setF({ ...f, login: e.target.value.toLowerCase() })} />
          <input className={field} placeholder="Пароль" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Тип обучения
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(["GROUP", "INDIVIDUAL"] as CourseType[]).map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setType(t)}
              className={`rounded-xl border px-3 py-3 text-left text-xs font-bold transition ${
                f.type === t ? "border-primary bg-primary-soft" : "border-border bg-surface"
              }`}
            >
              {t === "GROUP" ? "Group" : "Individual"}
              <span className="mt-0.5 block text-[11px] font-medium text-muted-foreground">
                {t === "GROUP" ? "3 месяца · 10 000 сом" : "1 месяц · 25 000 сом"}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Начало
            <input
              type="date"
              className={`${field} mt-1`}
              value={f.startDate}
              onChange={(e) =>
                setF({
                  ...f,
                  startDate: e.target.value,
                  endDate: addMonths(e.target.value, f.type === "GROUP" ? 3 : 1),
                })
              }
            />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Окончание
            <input
              type="date"
              className={`${field} mt-1`}
              value={f.endDate}
              onChange={(e) => setF({ ...f, endDate: e.target.value })}
            />
          </label>
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
            Создать
          </button>
        </div>
      </form>
    </div>
  );
}
