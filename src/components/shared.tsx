import { useEffect, useRef, useState, type ReactNode, type SyntheticEvent } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  AccessStatus,
  GroupStatus,
  LanguageCode,
  LessonState,
  MeetingStatus,
  PaymentStatus,
  TeacherStatus,
} from "@/lib/mock-data";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 lg:pl-3">
      <img
        src="/logo-mark.png"
        alt={compact ? "Sozmor Academy" : ""}
        className="size-9 shrink-0 object-contain"
      />
      {!compact && (
        <div className="-ml-1 leading-none">
          <div className="text-[16px] font-extrabold tracking-tight">Sozmor</div>
          <div className="mt-1 text-[10px] font-bold tracking-wide text-muted-foreground">
            Academy
          </div>
        </div>
      )}
    </div>
  );
}

export function CoinIcon({ className }: { className?: string }) {
  return <img src="/coin.png" alt="" aria-hidden="true" className={className} />;
}

export function Balance({ amount = 0 }: { amount?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1.5 text-sm font-bold text-foreground">
      {amount}
      <CoinIcon className="size-5 shrink-0" />
    </span>
  );
}

type Tone = "neutral" | "primary" | "success" | "warning" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary-soft text-accent-foreground",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-destructive/10 text-destructive",
};

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function AccessPill({ status }: { status: AccessStatus }) {
  const map: Record<AccessStatus, { label: string; tone: Tone }> = {
    active: { label: "Активен", tone: "success" },
    expired: { label: "Истёк", tone: "warning" },
    disabled: { label: "Отключён", tone: "danger" },
  };
  return <Pill tone={map[status].tone}>{map[status].label}</Pill>;
}

export function PaymentPill({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, { label: string; tone: Tone }> = {
    full: { label: "Полностью", tone: "success" },
    partial: { label: "Частично", tone: "warning" },
    unpaid: { label: "Не оплачен", tone: "danger" },
  };
  return <Pill tone={map[status].tone}>{map[status].label}</Pill>;
}

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Кастомный селект со стилизованным списком опций — нативный `<select>` не
 * поддаётся оформлению и открывается «без дизайна» в большинстве браузеров.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder = "Выберите…",
  className,
  buttonClassName,
  disabled,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border border-input bg-surface px-3 py-2.5 text-left text-sm font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10",
          open && "border-primary ring-4 ring-primary/10",
          disabled && "cursor-not-allowed opacity-60",
          buttonClassName,
        )}
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-border bg-surface p-1 shadow-lift"
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-soft text-accent-foreground"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <span className="truncate">{o.label}</span>
                {active && <Check className="size-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function LangPill({ code }: { code: LanguageCode }) {
  return (
    <Pill tone={code === "en" ? "primary" : "neutral"}>{code === "en" ? "English" : "Русский"}</Pill>
  );
}

export function GroupStatusPill({ status }: { status: GroupStatus }) {
  const map: Record<GroupStatus, { label: string; tone: Tone }> = {
    recruiting: { label: "Набор", tone: "warning" },
    active: { label: "Активна", tone: "success" },
    finished: { label: "Завершена", tone: "neutral" },
    archived: { label: "Архив", tone: "neutral" },
  };
  return <Pill tone={map[status].tone}>{map[status].label}</Pill>;
}

export function TeacherStatusPill({ status }: { status: TeacherStatus }) {
  const map: Record<TeacherStatus, { label: string; tone: Tone }> = {
    active: { label: "Активна", tone: "success" },
    absent: { label: "Отсутствует", tone: "warning" },
    replacement: { label: "Нужна замена", tone: "danger" },
  };
  return <Pill tone={map[status].tone}>{map[status].label}</Pill>;
}

export function LessonPill({ state }: { state: LessonState }) {
  const map: Record<LessonState, { label: string; tone: Tone }> = {
    completed: { label: "Завершён", tone: "success" },
    available: { label: "Доступен", tone: "primary" },
    locked: { label: "Закрыт", tone: "neutral" },
  };
  return <Pill tone={map[state].tone}>{map[state].label}</Pill>;
}

export function MeetingPill({ status }: { status: MeetingStatus }) {
  const map: Record<MeetingStatus, { label: string; tone: Tone }> = {
    scheduled: { label: "Запланирована", tone: "primary" },
    completed: { label: "Проведена", tone: "success" },
    cancelled: { label: "Отменена", tone: "danger" },
  };
  return <Pill tone={map[status].tone}>{map[status].label}</Pill>;
}

export function ProgressBar({
  value,
  className,
  tone = "primary",
}: {
  value: number;
  className?: string;
  tone?: "primary" | "success";
}) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-700 ease-out",
          tone === "primary" ? "gradient-primary" : "bg-success",
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function SectionTitle({
  title,
  action,
  icon: Icon,
}: {
  title: string;
  action?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="flex min-w-0 items-center gap-2 text-[13px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {Icon && <Icon className="size-4 shrink-0" />}
        <span className="truncate">{title}</span>
      </h2>
      {action}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/60 px-6 py-10 text-center">
      <div className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </div>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

export function Avatar({
  name,
  tone,
  size = "md",
}: {
  name: string;
  tone?: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  const sizes = {
    sm: "size-8 text-xs",
    md: "size-10 text-sm",
    lg: "size-14 text-lg",
  };
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-bold text-primary-foreground",
        sizes[size],
      )}
      style={{ background: tone ?? "var(--tone-1)" }}
    >
      {initials}
    </div>
  );
}

export function VideoPlayer({
  src,
  className,
  poster,
  onError,
  onTimeUpdate,
  onEnded,
}: {
  src: string;
  className?: string;
  poster?: string;
  onError?: () => void;
  onTimeUpdate?: (e: SyntheticEvent<HTMLVideoElement>) => void;
  onEnded?: (e: SyntheticEvent<HTMLVideoElement>) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  return (
    <div className={cn("relative overflow-hidden bg-black", className)}>
      <video
        key={src}
        ref={ref}
        controls
        playsInline
        preload="metadata"
        poster={poster}
        onError={onError}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
        className="absolute inset-0 size-full"
      >
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}
