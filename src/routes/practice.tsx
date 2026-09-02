import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Coffee, FileText, PlayCircle, Video } from "lucide-react";
import { TODAY } from "@/lib/mock-data";
import {
  formatDate,
  useApp,
  weekdayShort,
  weekPlan,
  weekRangeOf,
  type WeekPlanDay,
  type WeekPlanKind,
  type WeekPlanStatus,
} from "@/lib/store";
import { cn } from "@/lib/utils";
import { StudentShell } from "@/components/StudentShell";

export const Route = createFileRoute("/practice")({
  head: () => ({
    meta: [
      { title: "Расписание — Sozmor" },
      {
        name: "description",
        content: "План обучения на неделю: теория, тест и живая практика по дням.",
      },
    ],
  }),
  component: () => (
    <StudentShell>
      <SchedulePage />
    </StudentShell>
  ),
});

const kindIcon: Record<WeekPlanKind, React.ComponentType<{ className?: string }>> = {
  theory: BookOpen,
  practice: Video,
  rest: Coffee,
};

const statusLabel: Record<WeekPlanStatus, string> = {
  done: "Пройдено",
  past: "Позади",
  today: "Сейчас",
  upcoming: "Закрыт",
  locked: "Закрыт",
  rest: "Выходной",
};

function SchedulePage() {
  const { currentStudent, meetingsFor, lessons, tests, attempts } = useApp();
  const student = currentStudent!;
  const week = weekRangeOf(TODAY);
  const days = weekPlan(student, lessons, tests, attempts, meetingsFor(student), week);

  return (
    <div className="space-y-6 rise-in">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Расписание</h1>
        <p className="text-sm text-muted-foreground">План на неделю.</p>
      </header>

      <div>
        {days.map((day, i) => (
          <DayRow key={day.date} day={day} first={i === 0} last={i === days.length - 1} />
        ))}
      </div>
    </div>
  );
}

function DayRow({ day, first, last }: { day: WeekPlanDay; first: boolean; last: boolean }) {
  const Icon = kindIcon[day.kind];
  const s = day.status;

  const nodeClass =
    s === "done"
      ? "bg-success-soft text-success"
      : s === "today"
        ? "gradient-primary text-primary-foreground shadow-glow"
        : s === "rest"
          ? "border-2 border-dashed border-border bg-surface text-muted-foreground"
          : "bg-muted text-muted-foreground";

  const cardClass =
    s === "today"
      ? "rounded-xl border-2 border-primary bg-surface shadow-lift"
      : s === "rest"
        ? "surface-card border-dashed bg-surface/60"
        : s === "locked"
          ? "surface-card opacity-60"
          : "surface-card";

  return (
    <div className="relative flex gap-3.5 pb-3 last:pb-0 sm:gap-4">
      {/* Step rail */}
      <div className="relative flex w-9 shrink-0 items-center justify-center">
        <span
          className={cn(
            "absolute left-1/2 w-0.5 -translate-x-1/2 bg-border",
            first ? "top-1/2" : "top-0",
            last ? "bottom-1/2" : "-bottom-3",
          )}
        />
        <span
          className={cn(
            "relative z-10 grid size-9 shrink-0 place-items-center rounded-full text-[11px] font-extrabold uppercase tracking-wide",
            nodeClass,
          )}
        >
          {weekdayShort(day.date)}
        </span>
      </div>

      {/* Day card */}
      <div className={cn("flex min-h-41 min-w-0 flex-1 flex-col p-4", cardClass)}>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {day.weekday} · {formatDate(day.date)}
          </p>
          <span
            className={cn(
              "shrink-0 text-[11px] font-bold uppercase tracking-wide",
              s === "today" ? "text-primary" : "text-muted-foreground",
            )}
          >
            {statusLabel[s]}
          </span>
        </div>

        <div className="mt-2 flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "truncate text-sm font-extrabold",
                s === "rest" && "text-muted-foreground",
              )}
            >
              {day.title}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{day.meta}</p>
          </div>
        </div>

        <div className="mt-auto">
          <DayAction day={day} />
        </div>
      </div>
    </div>
  );
}

const BTN =
  "flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-2 text-xs font-bold text-foreground transition";
const BTN_HOVER = "hover:border-primary/40 hover:bg-muted";

function DayAction({ day }: { day: WeekPlanDay }) {
  const { status, kind, meetUrl, lessonOrder } = day;

  if (kind === "rest") return null;

  // Закрытая карточка уже приглушена целиком — кнопку дополнительно не гасим.
  const offClass = cn("cursor-not-allowed", status !== "locked" && "opacity-45");

  if (kind === "practice") {
    if (status === "today" && meetUrl) {
      return (
        <a
          href={meetUrl}
          target="_blank"
          rel="noreferrer"
          className={cn(
            BTN,
            "mt-3 border-transparent gradient-primary text-primary-foreground shadow-glow hover:opacity-95",
          )}
        >
          <Video className="size-4" /> Подключиться к уроку
        </a>
      );
    }
    return (
      <span className={cn(BTN, offClass, "mt-3")}>
        <Video className="size-4" /> Подключиться к уроку
      </span>
    );
  }

  const locked = status === "locked" || !lessonOrder;

  return (
    <div className="mt-3 flex gap-2">
      {locked ? (
        <>
          <span className={cn(BTN, offClass)}>
            <PlayCircle className="size-4" /> Смотреть урок
          </span>
          <span className={cn(BTN, offClass)}>
            <FileText className="size-4" /> Пройти тест
          </span>
        </>
      ) : (
        <>
          <Link
            to="/lesson/$order"
            params={{ order: String(lessonOrder) }}
            className={cn(BTN, BTN_HOVER)}
          >
            <PlayCircle className="size-4" /> Смотреть урок
          </Link>
          <Link
            to="/lesson/$order/test"
            params={{ order: String(lessonOrder) }}
            className={cn(BTN, BTN_HOVER)}
          >
            <FileText className="size-4" /> Пройти тест
          </Link>
        </>
      )}
    </div>
  );
}
