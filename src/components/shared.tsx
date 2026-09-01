import { useRef, type ReactNode, type SyntheticEvent } from "react";
import { cn } from "@/lib/utils";
import type { AccessStatus, LessonState, MeetingStatus } from "@/lib/mock-data";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/icon.jpg"
        alt="sozmor"
        className="size-9 shrink-0 rounded-xl object-cover shadow-glow"
      />
      {!compact && (
        <div className="leading-tight">
          <p className="text-sm font-extrabold tracking-tight">Sozmor Academy</p>
          <p className="text-[11px] font-medium text-muted-foreground">Learning Platform</p>
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
