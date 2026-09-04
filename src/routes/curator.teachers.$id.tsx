import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarClock, GraduationCap, Lock } from "lucide-react";
import { toast } from "sonner";
import { TODAY, type TeacherStatus } from "@/lib/mock-data";
import {
  groupStage,
  studentsInGroup,
  teacherGroupConflict,
  useApp,
} from "@/lib/store";
import { CuratorShell } from "@/components/CuratorShell";
import {
  Avatar,
  EmptyState,
  GroupStatusPill,
  LangPill,
  Pill,
  SectionTitle,
  TeacherStatusPill,
} from "@/components/shared";

export const Route = createFileRoute("/curator/teachers/$id")({
  head: () => ({
    meta: [
      { title: "Преподаватель — кабинет куратора" },
      { name: "description", content: "Группы, ученики, расписание и замена преподавателя." },
    ],
  }),
  component: () => (
    <CuratorShell>
      <TeacherCard />
    </CuratorShell>
  ),
});

function TeacherCard() {
  const { id } = Route.useParams();
  const {
    teachers,
    groups,
    students,
    lessons,
    meetings,
    updateTeacher,
    assignTeacherToGroup,
  } = useApp();

  const t = teachers.find((x) => x.id === id);
  if (!t) return <EmptyState icon={Lock} title="Преподаватель не найден" />;

  const tGroups = groups.filter((g) => g.teacherId === t.id && g.status !== "archived");
  const groupStudents = tGroups.reduce((sum, g) => sum + studentsInGroup(students, g.id).length, 0);
  const individuals = students.filter((s) => s.type === "INDIVIDUAL" && s.teacherId === t.id);
  const practicesToday = meetings.filter(
    (m) => m.date === TODAY && m.status === "scheduled" && tGroups.some((g) => g.id === m.groupId),
  ).length;

  const otherTeachers = teachers.filter((x) => x.id !== t.id);

  return (
    <div className="space-y-5 rise-in">
      <Link
        to="/curator/teachers"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> К преподавателям
      </Link>

      <header className="surface-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={t.name} tone={t.tone} size="lg" />
            <div>
              <h1 className="text-xl font-extrabold sm:text-2xl">{t.name}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {t.languages.map((l) => (
                  <LangPill key={l} code={l} />
                ))}
                <TeacherStatusPill status={t.status} />
              </div>
            </div>
          </div>
          <select
            value={t.status}
            onChange={(e) => {
              updateTeacher(t.id, { status: e.target.value as TeacherStatus });
              toast.success("Статус обновлён");
            }}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm font-bold outline-none"
          >
            <option value="active">Активна</option>
            <option value="absent">Отсутствует</option>
            <option value="replacement">Нужна замена</option>
          </select>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { l: "Группы", v: tGroups.length },
            { l: "Ученики в группах", v: groupStudents },
            { l: "Individual", v: individuals.length },
            { l: "Практик сегодня", v: practicesToday },
          ].map((x) => (
            <div key={x.l} className="rounded-xl bg-muted/70 p-3">
              <p className="text-lg font-extrabold">{x.v}</p>
              <p className="text-[11px] text-muted-foreground">{x.l}</p>
            </div>
          ))}
        </div>
      </header>

      <section>
        <SectionTitle title="Группы преподавателя" icon={GraduationCap} />
        {tGroups.length === 0 ? (
          <EmptyState icon={GraduationCap} title="Группы не назначены" />
        ) : (
          <div className="space-y-3">
            {tGroups.map((g) => {
              const stage = groupStage(g, lessons);
              return (
                <div key={g.id} className="surface-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <Link
                      to="/curator/groups/$id"
                      params={{ id: g.id }}
                      className="min-w-0 text-sm font-extrabold hover:text-primary"
                    >
                      {g.name}
                    </Link>
                    <GroupStatusPill status={g.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Pill tone="neutral">{g.practiceStart}–{g.practiceEnd}</Pill>
                    <span>
                      {studentsInGroup(students, g.id).length}/{g.maxStudents} · Month {stage.month} ·{" "}
                      {stage.level}
                    </span>
                  </div>
                  <label className="mt-3 block text-xs font-semibold text-muted-foreground">
                    Заменить преподавателя
                    <select
                      className="mt-1 w-full rounded-xl border border-input bg-surface px-3 py-2 text-sm font-medium outline-none focus:border-primary"
                      defaultValue=""
                      onChange={(e) => {
                        const nid = e.target.value;
                        if (!nid) return;
                        const conflict = teacherGroupConflict(groups, nid, g.practiceStart, g.id);
                        if (conflict) {
                          toast.error(
                            `Нельзя: в ${g.practiceStart} у нового преподавателя уже «${conflict.name}»`,
                          );
                          e.target.value = "";
                          return;
                        }
                        assignTeacherToGroup(g.id, nid);
                        toast.success("Преподаватель заменён — расписание проверено");
                        e.target.value = "";
                      }}
                    >
                      <option value="">— выбрать замену —</option>
                      {otherTeachers
                        .filter((x) => x.languages.includes(g.language))
                        .map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.name}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {individuals.length > 0 && (
        <section>
          <SectionTitle title="Индивидуальные ученики" icon={CalendarClock} />
          <div className="surface-card divide-y divide-border overflow-hidden">
            {individuals.map((s) => (
              <Link
                key={s.id}
                to="/curator/students/$id"
                params={{ id: s.id }}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/60"
              >
                <Avatar name={`${s.firstName} ${s.lastName}`} tone={s.avatarTone} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-bold">
                  {s.firstName} {s.lastName}
                </span>
                <LangPill code={s.language} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
