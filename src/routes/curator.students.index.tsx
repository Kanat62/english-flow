import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Plus, RefreshCw, Search, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  LESSONS,
  TODAY,
  courseProduct,
  type CourseType,
  type LanguageCode,
  type Student,
} from "@/lib/mock-data";
import {
  accessStatus,
  currentLessonOrder,
  findMatchingGroup,
  formatFull,
  generateLogin,
  generatePassword,
  progressOf,
  useApp,
} from "@/lib/store";
import { CuratorShell } from "@/components/CuratorShell";
import {
  AccessPill,
  Avatar,
  EmptyState,
  PaymentPill,
  Pill,
  ProgressBar,
  Select,
} from "@/components/shared";

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

  const groupLabel = (id: string | null) => groups.find((g) => g.id === id)?.code ?? "—";

  return (
    <div className="space-y-5 rise-in lg:ml-[calc(50%-50vw+8.75rem)] lg:w-[calc(100vw-17.5rem)]">
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
          <Select
            ariaLabel="Язык"
            value={lang}
            onChange={(v) => setLang(v as never)}
            options={[
              { value: "all", label: "Все языки" },
              { value: "en", label: "English" },
              { value: "ru", label: "Русский" },
            ]}
          />
          <Select
            ariaLabel="Формат"
            value={format}
            onChange={(v) => setFormat(v as never)}
            options={[
              { value: "all", label: "Group + Individual" },
              { value: "GROUP", label: "Group" },
              { value: "INDIVIDUAL", label: "Individual" },
            ]}
          />
          <Select
            ariaLabel="Доступ"
            value={status}
            onChange={(v) => setStatus(v as never)}
            options={[
              { value: "all", label: "Любой доступ" },
              { value: "active", label: "Active" },
              { value: "expired", label: "Expired" },
            ]}
          />
          <Select
            ariaLabel="Группа"
            value={groupId}
            onChange={setGroupId}
            options={[
              { value: "all", label: "Все группы" },
              ...groups.map((g) => ({ value: g.id, label: g.name })),
            ]}
          />
          <Select
            ariaLabel="Преподаватель"
            value={teacherId}
            onChange={setTeacherId}
            options={[
              { value: "all", label: "Все преподаватели" },
              ...teachers.map((t) => ({ value: t.id, label: t.name })),
            ]}
          />
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
                  <th className="px-3 py-3">Курс</th>
                  <th className="px-3 py-3">Формат</th>
                  <th className="px-3 py-3">Группа</th>
                  <th className="px-3 py-3">Начало курса</th>
                  <th className="px-3 py-3">Конец курса</th>
                  <th className="px-3 py-3">Урок</th>
                  <th className="px-3 py-3">Прогресс</th>
                  <th className="px-3 py-3">Оплата</th>
                  <th className="px-3 py-3">Посл. активность</th>
                  <th className="px-3 py-3">Статус</th>
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
                    <td className="px-3 py-3 text-xs font-semibold">
                      {courseProduct(s.language, s.type).title}
                    </td>
                    <td className="px-3 py-3">
                      <Pill tone={s.type === "GROUP" ? "neutral" : "primary"}>
                        {s.type === "GROUP" ? "Group" : "Individual"}
                      </Pill>
                    </td>
                    <td className="px-3 py-3 text-xs font-semibold">{groupLabel(s.groupId)}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {formatFull(s.startDate)}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {formatFull(s.endDate)}
                    </td>
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
                      <div className="flex flex-col items-start gap-1">
                        <PaymentPill status={s.payment.status} />
                        {s.payment.status !== "full" && (
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            {Math.round((s.payment.paid / s.payment.totalCost) * 100)}% ·{" "}
                            {s.payment.paid.toLocaleString("ru")} {courseProduct(s.language, s.type).currency}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {formatFull(s.lastActivity)}
                    </td>
                    <td className="px-3 py-3">
                      <AccessPill status={accessStatus(s)} />
                    </td>
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
                    <p className="truncate text-xs text-muted-foreground">
                      {courseProduct(s.language, s.type).title} · урок {currentLessonOrder(s)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatFull(s.startDate)} – {formatFull(s.endDate)}
                    </p>
                    <ProgressBar value={progressOf(s)} className="mt-2 h-1.5" />
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <AccessPill status={accessStatus(s)} />
                      <PaymentPill status={s.payment.status} />
                    </div>
                  </div>
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

  const exportCsv = () => {
    const rows = students.filter((s) => ids.includes(s.id));
    const header = "Name,Login,Phone,Course,Type,Group,StartDate,EndDate,Status,Paid,Total,Payment";
    const body = rows
      .map((s) =>
        [
          `${s.firstName} ${s.lastName}`,
          s.login,
          s.phone,
          courseProduct(s.language, s.type).title,
          s.type,
          groups.find((g) => g.id === s.groupId)?.name ?? "",
          s.startDate,
          s.endDate,
          accessStatusLabel(s),
          s.payment.paid,
          s.payment.totalCost,
          s.payment.status,
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
      <Select
        className="w-48"
        value=""
        placeholder="Изменить группу…"
        onChange={(v) => {
          const g = groups.find((x) => x.id === v);
          bulkUpdateStudents(ids, { groupId: v, teacherId: g?.teacherId ?? null });
          toast.success(`${ids.length} учеников назначены в группу`);
        }}
        options={groups.map((g) => ({ value: g.id, label: g.name }))}
      />
      <Select
        className="w-52"
        value=""
        placeholder="Изменить преподавателя…"
        onChange={(v) => {
          bulkUpdateStudents(ids, { teacherId: v });
          toast.success("Преподаватель изменён");
        }}
        options={teachers.map((t) => ({ value: t.id, label: t.name }))}
      />
      <Select
        className="w-44"
        value=""
        placeholder="Изменить статус…"
        onChange={(v) => {
          bulkUpdateStudents(ids, { status: v as never });
          toast.success("Статус изменён");
        }}
        options={[
          { value: "active", label: "Active" },
          { value: "expired", label: "Expired" },
          { value: "disabled", label: "Disabled" },
        ]}
      />
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

  const takenLogins = useMemo(() => new Set(students.map((s) => s.login)), [students]);
  const takenPasswords = useMemo(() => new Set(students.map((s) => s.password)), [students]);

  const [f, setF] = useState({
    firstName: "",
    lastName: "",
    age: "",
    city: "",
    phone: "",
    login: "",
    language: "en" as LanguageCode,
    type: "GROUP" as CourseType,
    startDate: TODAY,
    time: "20:00",
    total: "",
    paid: "",
    manager: "",
    groupChoice: "", // "" = авто-подбор
  });
  const [loginTouched, setLoginTouched] = useState(false);
  // Пароль генерируется один раз и не редактируется куратором.
  const [password] = useState(() => generatePassword(takenPasswords));

  // Пока логин не правили вручную — держим его синхронным с именем и телефоном.
  useEffect(() => {
    if (loginTouched) return;
    setF((prev) => ({ ...prev, login: generateLogin(prev.firstName, prev.phone, takenLogins) }));
  }, [f.firstName, f.phone, loginTouched, takenLogins]);

  const product = courseProduct(f.language, f.type);
  const suggestedGroup =
    f.type === "GROUP"
      ? findMatchingGroup(groups, students, f.language, f.startDate, f.time)
      : undefined;
  const languageGroups = groups.filter((g) => g.language === f.language);
  const chosenGroup =
    f.type === "GROUP"
      ? f.groupChoice
        ? (languageGroups.find((g) => g.id === f.groupChoice) ?? null)
        : (suggestedGroup ?? null)
      : null;

  const loginError = !f.login
    ? "Укажите логин"
    : takenLogins.has(f.login)
      ? "Такой логин уже есть в базе — измените"
      : null;

  const regenerateLogin = () => {
    setLoginTouched(false);
    setF((prev) => ({ ...prev, login: generateLogin(prev.firstName, prev.phone, takenLogins) }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.firstName) {
      toast.error("Укажите имя ученика");
      return;
    }
    if (loginError) {
      toast.error(loginError);
      return;
    }
    const group = chosenGroup;
    const start = group ? group.startDate : f.startDate;
    const end = new Date(start);
    end.setMonth(end.getMonth() + product.durationMonths);
    const total = Number(f.total) || product.price;
    const paid = Number(f.paid) || 0;
    addStudent({
      id: `s-${Date.now()}`,
      login: f.login,
      password,
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <button
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
        className="fixed inset-0 h-full w-full cursor-default backdrop-blur-sm"
      />
      <form
        onSubmit={submit}
        className="relative mx-auto my-4 w-full max-w-lg rounded-3xl border border-border bg-surface p-5 shadow-lift sm:my-8"
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
        </div>

        <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Доступ ученика
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <div>
            <div className="flex items-center gap-2">
              <input
                className={`${field} ${loginError ? "border-destructive focus:border-destructive focus:ring-destructive/10" : ""}`}
                placeholder="Логин"
                value={f.login}
                onChange={(e) => {
                  setLoginTouched(true);
                  setF({ ...f, login: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "") });
                }}
              />
              <button
                type="button"
                onClick={regenerateLogin}
                aria-label="Сгенерировать логин заново"
                className="grid size-10 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="size-4" />
              </button>
            </div>
            <p className={`mt-1 text-[11px] ${loginError ? "font-semibold text-destructive" : "text-muted-foreground"}`}>
              {loginError ?? "Генерируется из имени и телефона · можно изменить, проверка уникальности автоматом"}
            </p>
          </div>
          <div>
            <input
              className={`${field} cursor-not-allowed bg-muted/60`}
              value={password}
              readOnly
              tabIndex={-1}
              aria-label="Пароль"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Пароль из 5 букв · сгенерирован и уникален · куратор не меняет
            </p>
          </div>
        </div>

        <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Обучение
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <Select
            ariaLabel="Язык"
            value={f.language}
            onChange={(v) => setF({ ...f, language: v as LanguageCode, groupChoice: "" })}
            options={[
              { value: "en", label: "English" },
              { value: "ru", label: "Русский" },
            ]}
          />
          <Select
            ariaLabel="Формат"
            value={f.type}
            onChange={(v) => setF({ ...f, type: v as CourseType, groupChoice: "" })}
            options={[
              { value: "GROUP", label: "Group" },
              { value: "INDIVIDUAL", label: "Individual" },
            ]}
          />
          <label className="text-xs font-semibold text-muted-foreground">
            Дата начала
            <input type="date" className={`${field} mt-1`} value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} />
          </label>
          {f.type === "GROUP" && (
            <label className="text-xs font-semibold text-muted-foreground">
              Вечерний слот
              <Select
                className="mt-1"
                ariaLabel="Вечерний слот"
                value={f.time}
                onChange={(v) => setF({ ...f, time: v })}
                options={[
                  { value: "20:00", label: "20:00–21:00" },
                  { value: "21:00", label: "21:00–22:00" },
                ]}
              />
            </label>
          )}
        </div>

        {f.type === "GROUP" && (
          <label className="mt-3 block text-xs font-semibold text-muted-foreground">
            Группа
            <Select
              className="mt-1"
              ariaLabel="Группа"
              value={f.groupChoice}
              onChange={(v) => setF({ ...f, groupChoice: v })}
              placeholder={
                suggestedGroup ? `Авто · ${suggestedGroup.name}` : "Авто · подходящей группы нет"
              }
              options={[
                {
                  value: "",
                  label: suggestedGroup
                    ? `Авто · ${suggestedGroup.name}`
                    : "Авто · без группы (назначить позже)",
                },
                ...languageGroups.map((g) => ({ value: g.id, label: g.name })),
              ]}
            />
            <span className="mt-1 block text-[11px] font-normal text-muted-foreground">
              По умолчанию подбирается автоматически — можно выбрать другую вручную.
            </span>
          </label>
        )}

        <div className="mt-3 rounded-xl bg-muted/70 p-3 text-xs">
          <p className="font-bold">{product.title}</p>
          <p className="mt-0.5 text-muted-foreground">
            {product.durationMonths} мес · {product.price.toLocaleString("ru")} {product.currency}
          </p>
          {f.type === "GROUP" && (
            <p className="mt-1.5 font-semibold text-primary">
              {chosenGroup
                ? `Будет назначен в: ${chosenGroup.name}`
                : "Группа не выбрана — назначьте вручную после создания"}
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
