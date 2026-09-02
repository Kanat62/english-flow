import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Plus, Search, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  LESSONS,
  TODAY,
  courseProduct,
  languageName,
  type CourseType,
  type LanguageCode,
  type Student,
} from "@/lib/mock-data";
import {
  accessStatus,
  currentLessonOrder,
  findMatchingGroup,
  formatFull,
  progressOf,
  useApp,
} from "@/lib/store";
import { CuratorShell } from "@/components/CuratorShell";
import { AccessPill, Avatar, EmptyState, LangPill, Pill, ProgressBar } from "@/components/shared";

export const Route = createFileRoute("/curator/students/")({
  validateSearch: (search: Record<string, unknown>): { new?: number } =>
    search["new"] ? { new: 1 } : {},
  head: () => ({
    meta: [
      { title: "Ученики — кабинет куратора" },
      {
        name: "description",
        content: "Поиск, многоуровневые фильтры, массовое управление и создание учеников.",
      },
      { property: "og:title", content: "Управление учениками" },
      { property: "og:description", content: "1000+ учеников: поиск, фильтры, группы, bulk-действия." },
    ],
  }),
  component: () => (
    <CuratorShell>
      <StudentsPage />
    </CuratorShell>
  ),
});

const PAGE_SIZE = 20;
const field =
  "w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10";

function StudentsPage() {
  const { new: openNew } = Route.useSearch();
  const { students, groups, teachers } = useApp();

  const [query, setQuery] = useState("");
  const [lang, setLang] = useState<"all" | LanguageCode>("all");
  const [format, setFormat] = useState<"all" | CourseType>("all");
  const [status, setStatus] = useState<"all" | "active" | "expired">("all");
  const [groupId, setGroupId] = useState<"all" | string>("all");
  const [teacherId, setTeacherId] = useState<"all" | string>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(Boolean(openNew));

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      const st = accessStatus(s);
      if (lang !== "all" && s.language !== lang) return false;
      if (format !== "all" && s.type !== format) return false;
      if (status === "active" && st !== "active") return false;
      if (status === "expired" && st !== "expired") return false;
      if (groupId !== "all" && s.groupId !== groupId) return false;
      if (teacherId !== "all" && s.teacherId !== teacherId) return false;
      if (
        q &&
        !`${s.firstName} ${s.lastName} ${s.login} ${s.phone}`.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [students, query, lang, format, status, groupId, teacherId]);

  useEffect(() => setPage(1), [query, lang, format, status, groupId, teacherId]);

  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const pageItems = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allOnPageSelected = pageItems.length > 0 && pageItems.every((s) => selected.has(s.id));
  const toggleAllOnPage = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageItems.forEach((s) => next.delete(s.id));
      else pageItems.forEach((s) => next.add(s.id));
      return next;
    });

  const groupLabel = (id: string | null) => groups.find((g) => g.id === id)?.name.split(" · ")[1] ?? "—";

  return (
    <div className="space-y-5 rise-in">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold sm:text-3xl">Ученики</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {list.length} из {students.length} · страница {page}/{pageCount}
          </p>
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
            placeholder="Поиск по имени, логину или телефону"
            className="w-full rounded-xl border border-input bg-surface py-2.5 pl-10 pr-3 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <select className={field} value={lang} onChange={(e) => setLang(e.target.value as never)}>
            <option value="all">Все языки</option>
            <option value="en">English</option>
            <option value="ru">Русский</option>
          </select>
          <select className={field} value={format} onChange={(e) => setFormat(e.target.value as never)}>
            <option value="all">Group + Individual</option>
            <option value="GROUP">Group</option>
            <option value="INDIVIDUAL">Individual</option>
          </select>
          <select className={field} value={status} onChange={(e) => setStatus(e.target.value as never)}>
            <option value="all">Любой доступ</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
          <select className={field} value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            <option value="all">Все группы</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <select className={field} value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <option value="all">Все преподаватели</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selected.size > 0 && (
        <BulkBar
          ids={[...selected]}
          onClear={() => setSelected(new Set())}
          students={students}
        />
      )}

      {list.length === 0 ? (
        <EmptyState icon={Users} title="Учеников не найдено" description="Измените фильтр или поиск." />
      ) : (
        <>
          <div className="surface-card hidden overflow-x-auto lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-3">
                    <input type="checkbox" checked={allOnPageSelected} onChange={toggleAllOnPage} />
                  </th>
                  <th className="px-3 py-3">Ученик</th>
                  <th className="px-3 py-3">Язык</th>
                  <th className="px-3 py-3">Формат</th>
                  <th className="px-3 py-3">Группа</th>
                  <th className="px-3 py-3">Урок</th>
                  <th className="px-3 py-3">Прогресс</th>
                  <th className="px-3 py-3">Статус</th>
                  <th className="px-3 py-3">До</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageItems.map((s) => (
                  <tr key={s.id} className="transition hover:bg-muted/50">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(s.id)}
                        onChange={() => toggle(s.id)}
                      />
                    </td>
                    <td className="px-3 py-3">
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
                    <td className="px-3 py-3">
                      <LangPill code={s.language} />
                    </td>
                    <td className="px-3 py-3">
                      <Pill tone={s.type === "GROUP" ? "neutral" : "primary"}>
                        {s.type === "GROUP" ? "Group" : "Individual"}
                      </Pill>
                    </td>
                    <td className="px-3 py-3 text-xs font-semibold">{groupLabel(s.groupId)}</td>
                    <td className="px-3 py-3 font-semibold">
                      {currentLessonOrder(s)}/{LESSONS.length}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={progressOf(s)} className="w-20" />
                        <span className="text-xs font-bold">{progressOf(s)}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <AccessPill status={accessStatus(s)} />
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{formatFull(s.endDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2.5 lg:hidden">
            {pageItems.map((s) => (
              <div key={s.id} className="surface-card flex items-center gap-3 p-4">
                <input
                  type="checkbox"
                  checked={selected.has(s.id)}
                  onChange={() => toggle(s.id)}
                  className="size-4 shrink-0"
                />
                <Link
                  to="/curator/students/$id"
                  params={{ id: s.id }}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <Avatar name={`${s.firstName} ${s.lastName}`} tone={s.avatarTone} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold">
                      {s.firstName} {s.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {languageName(s.language)} · {s.type === "GROUP" ? "Group" : "Individual"} ·{" "}
                      урок {currentLessonOrder(s)}
                    </p>
                    <ProgressBar value={progressOf(s)} className="mt-2 h-1.5" />
                  </div>
                  <AccessPill status={accessStatus(s)} />
                </Link>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-bold text-muted-foreground disabled:opacity-40"
            >
              Назад
            </button>
            <span className="text-xs font-semibold text-muted-foreground">
              {page} / {pageCount}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
              className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-bold text-muted-foreground disabled:opacity-40"
            >
              Вперёд
            </button>
          </div>
        </>
      )}

      {open && <CreateStudentModal onClose={() => setOpen(false)} />}
    </div>
  );
}

function BulkBar({
  ids,
  onClear,
  students,
}: {
  ids: string[];
  onClear: () => void;
  students: Student[];
}) {
  const { groups, teachers, bulkUpdateStudents } = useApp();
  const [groupId, setGroupId] = useState("");
  const [teacherId, setTeacherId] = useState("");

  const exportCsv = () => {
    const rows = students.filter((s) => ids.includes(s.id));
    const header = "Name,Login,Phone,Language,Type,Group,Status,EndDate";
    const body = rows
      .map((s) =>
        [
          `${s.firstName} ${s.lastName}`,
          s.login,
          s.phone,
          s.language,
          s.type,
          groups.find((g) => g.id === s.groupId)?.name ?? "",
          accessStatusLabel(s),
          s.endDate,
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students-${ids.length}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Экспортировано: ${ids.length}`);
  };

  return (
    <div className="surface-card sticky top-16 z-10 flex flex-wrap items-center gap-2 p-3">
      <span className="text-sm font-bold">Выбрано: {ids.length}</span>
      <select
        className="rounded-lg border border-border bg-surface px-2.5 py-2 text-xs font-semibold outline-none"
        value={groupId}
        onChange={(e) => {
          setGroupId(e.target.value);
          if (e.target.value) {
            const g = groups.find((x) => x.id === e.target.value);
            bulkUpdateStudents(ids, {
              groupId: e.target.value,
              teacherId: g?.teacherId ?? null,
            });
            toast.success(`${ids.length} учеников назначены в группу`);
          }
        }}
      >
        <option value="">Изменить группу…</option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
      <select
        className="rounded-lg border border-border bg-surface px-2.5 py-2 text-xs font-semibold outline-none"
        value={teacherId}
        onChange={(e) => {
          setTeacherId(e.target.value);
          if (e.target.value) {
            bulkUpdateStudents(ids, { teacherId: e.target.value });
            toast.success("Преподаватель изменён");
          }
        }}
      >
        <option value="">Изменить преподавателя…</option>
        {teachers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <select
        className="rounded-lg border border-border bg-surface px-2.5 py-2 text-xs font-semibold outline-none"
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) {
            bulkUpdateStudents(ids, { status: e.target.value as never });
            toast.success("Статус изменён");
          }
        }}
      >
        <option value="">Изменить статус…</option>
        <option value="active">Active</option>
        <option value="expired">Expired</option>
        <option value="disabled">Disabled</option>
      </select>
      <button
        onClick={exportCsv}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-2 text-xs font-bold"
      >
        <Download className="size-3.5" /> Экспорт CSV
      </button>
      <button onClick={onClear} className="ml-auto text-muted-foreground" aria-label="Снять выделение">
        <X className="size-4" />
      </button>
    </div>
  );
}

function accessStatusLabel(s: Student) {
  return accessStatus(s);
}

function CreateStudentModal({ onClose }: { onClose: () => void }) {
  const { students, groups, addStudent } = useApp();
  const [f, setF] = useState({
    firstName: "",
    lastName: "",
    age: "",
    city: "",
    phone: "",
    login: "",
    password: "",
    language: "en" as LanguageCode,
    type: "GROUP" as CourseType,
    startDate: TODAY,
    time: "20:00",
    total: "",
    paid: "",
    manager: "",
  });

  const product = courseProduct(f.language, f.type);
  const suggestedGroup =
    f.type === "GROUP"
      ? findMatchingGroup(groups, students, f.language, f.startDate, f.time)
      : undefined;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.firstName || !f.login || !f.password) {
      toast.error("Заполните имя, логин и пароль");
      return;
    }
    const group = suggestedGroup ?? null;
    const start = group ? group.startDate : f.startDate;
    const end = new Date(start);
    end.setMonth(end.getMonth() + product.durationMonths);
    const total = Number(f.total) || product.price;
    const paid = Number(f.paid) || 0;
    addStudent({
      id: `s-${Date.now()}`,
      login: f.login,
      password: f.password,
      firstName: f.firstName,
      lastName: f.lastName,
      phone: f.phone,
      language: f.language,
      type: f.type,
      age: f.age ? Number(f.age) : null,
      city: f.city,
      groupId: group?.id ?? null,
      teacherId: group?.teacherId ?? null,
      startDate: start,
      endDate: end.toISOString().slice(0, 10),
      status: "active",
      openedUpTo: 1,
      completed: [],
      completedAt: {},
      watched: {},
      lastActivity: TODAY,
      avatarTone: "var(--tone-3)",
      onboarded: false,
      managerName: f.manager || "—",
      payment: {
        totalCost: total,
        paid,
        purchaseDate: TODAY,
        status: paid >= total ? "full" : paid > 0 ? "partial" : "unpaid",
      },
    });
    toast.success(
      group
        ? `Ученик создан и назначен в группу «${group.name}»`
        : f.type === "GROUP"
          ? "Ученик создан. Подходящей группы нет — назначьте вручную."
          : "Индивидуальный ученик создан",
    );
    onClose();
  };

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

        <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Личные данные
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <input className={field} placeholder="Имя" value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} />
          <input className={field} placeholder="Фамилия" value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} />
          <input className={field} placeholder="Возраст" inputMode="numeric" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })} />
          <input className={field} placeholder="Город" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
          <input className={field} placeholder="Телефон" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          <input className={field} placeholder="Менеджер" value={f.manager} onChange={(e) => setF({ ...f, manager: e.target.value })} />
          <input className={field} placeholder="Логин" value={f.login} onChange={(e) => setF({ ...f, login: e.target.value.toLowerCase() })} />
          <input className={field} placeholder="Пароль" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        </div>

        <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Обучение
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <select className={field} value={f.language} onChange={(e) => setF({ ...f, language: e.target.value as LanguageCode })}>
            <option value="en">English</option>
            <option value="ru">Русский</option>
          </select>
          <select className={field} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as CourseType })}>
            <option value="GROUP">Group</option>
            <option value="INDIVIDUAL">Individual</option>
          </select>
          <label className="text-xs font-semibold text-muted-foreground">
            Дата начала
            <input type="date" className={`${field} mt-1`} value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} />
          </label>
          {f.type === "GROUP" && (
            <label className="text-xs font-semibold text-muted-foreground">
              Вечерний слот
              <select className={`${field} mt-1`} value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })}>
                <option value="20:00">20:00–21:00</option>
                <option value="21:00">21:00–22:00</option>
              </select>
            </label>
          )}
        </div>

        <div className="mt-2 rounded-xl bg-muted/70 p-3 text-xs">
          <p className="font-bold">{product.title}</p>
          <p className="mt-0.5 text-muted-foreground">
            {product.durationMonths} мес · {product.price.toLocaleString("ru")} {product.currency}
          </p>
          {f.type === "GROUP" && (
            <p className="mt-1.5 font-semibold text-primary">
              {suggestedGroup
                ? `Будет назначен в: ${suggestedGroup.name}`
                : "Подходящей открытой группы нет — назначьте вручную после создания"}
            </p>
          )}
        </div>

        <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Оплата (со слов отдела продаж)
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <input className={field} placeholder={`Общая сумма (${product.price})`} inputMode="numeric" value={f.total} onChange={(e) => setF({ ...f, total: e.target.value })} />
          <input className={field} placeholder="Первоначальный платёж" inputMode="numeric" value={f.paid} onChange={(e) => setF({ ...f, paid: e.target.value })} />
        </div>

        <div className="mt-6 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-3 text-sm font-bold text-muted-foreground">
            Отмена
          </button>
          <button type="submit" className="flex-1 rounded-xl gradient-primary py-3 text-sm font-bold text-primary-foreground shadow-glow">
            Создать
          </button>
        </div>
      </form>
    </div>
  );
}
