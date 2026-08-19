import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CURATOR,
  LESSONS,
  MEETINGS,
  NOTES,
  STUDENTS,
  TODAY,
  type AccessStatus,
  type CourseType,
  type Lesson,
  type LessonState,
  type Meeting,
  type Note,
  type Role,
  type Student,
} from "./mock-data";

interface Session {
  role: Role;
  id: string;
}

interface AppState {
  students: Student[];
  meetings: Meeting[];
  notes: Note[];
  session: Session | null;
  lessons: Lesson[];
}

const STORAGE_KEY = "elp-state-v2";

const initialState: AppState = {
  students: STUDENTS,
  meetings: MEETINGS,
  notes: NOTES,
  session: null,
  lessons: LESSONS,
};

function normalizeStudent(s: Student): Student {
  return { ...s, completed: s.completed ?? [], watched: s.watched ?? {} };
}

function normalizeState(raw: Partial<AppState>): AppState {
  return {
    ...initialState,
    ...raw,
    students: (raw.students ?? initialState.students).map(normalizeStudent),
    lessons: raw.lessons?.length ? raw.lessons : initialState.lessons,
  };
}

interface Ctx extends AppState {
  ready: boolean;
  login: (login: string, password: string) => Role | null;
  logout: () => void;
  currentStudent: Student | null;
  updateStudent: (id: string, patch: Partial<Student>) => void;
  addStudent: (s: Student) => void;
  openNextLesson: (id: string) => void;
  completeLesson: (studentId: string, order: number) => void;
  updateWatchProgress: (studentId: string, order: number, pct: number) => void;
  updateLesson: (order: number, patch: Partial<Lesson>) => void;
  publishLesson: (order: number, type?: CourseType) => void;
  unpublishLesson: (order: number, type?: CourseType) => void;
  addNote: (studentId: string, content: string) => void;
  deleteNote: (id: string) => void;
  addMeeting: (m: Meeting) => void;
  updateMeeting: (id: string, patch: Partial<Meeting>) => void;
  meetingsFor: (student: Student) => Meeting[];
  reset: () => void;
  testVideoUrl: string | null;
  setTestVideoUrl: (url: string | null) => void;
}

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [ready, setReady] = useState(false);
  const [testVideoUrl, setTestVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(normalizeState(JSON.parse(raw)));
    } catch {
      /* ignore corrupt/stale saved state and start fresh */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, ready]);

  const login = useCallback(
    (login: string, password: string): Role | null => {
      const l = login.trim().toLowerCase();
      if (l === CURATOR.login && password === CURATOR.password) {
        setState((s) => ({ ...s, session: { role: "curator", id: CURATOR.id } }));
        return "curator";
      }
      const found = state.students.find((st) => st.login === l && st.password === password);
      if (found) {
        setState((s) => ({ ...s, session: { role: "student", id: found.id } }));
        return "student";
      }
      return null;
    },
    [state.students],
  );

  const logout = useCallback(() => setState((s) => ({ ...s, session: null })), []);

  const updateStudent = useCallback((id: string, patch: Partial<Student>) => {
    setState((s) => ({
      ...s,
      students: s.students.map((st) => (st.id === id ? { ...st, ...patch } : st)),
    }));
  }, []);

  const value: Ctx = useMemo(() => {
    const currentStudent =
      state.session?.role === "student"
        ? (state.students.find((s) => s.id === state.session!.id) ?? null)
        : null;

    return {
      ...state,
      ready,
      login,
      logout,
      currentStudent,
      updateStudent,
      addStudent: (s) => setState((p) => ({ ...p, students: [s, ...p.students] })),
      openNextLesson: (id) =>
        setState((p) => ({
          ...p,
          students: p.students.map((st) =>
            st.id === id
              ? { ...st, openedUpTo: Math.min(LESSONS.length, st.openedUpTo + 1) }
              : st,
          ),
        })),
      completeLesson: (studentId, order) =>
        setState((p) => ({
          ...p,
          students: p.students.map((st) =>
            st.id === studentId && !(st.completed ?? []).includes(order)
              ? {
                  ...st,
                  completed: [...(st.completed ?? []), order],
                  watched: { ...(st.watched ?? {}), [order]: 100 },
                  lastActivity: TODAY,
                }
              : st,
          ),
        })),
      updateWatchProgress: (studentId, order, pct) =>
        setState((p) => ({
          ...p,
          students: p.students.map((st) =>
            st.id === studentId && pct > ((st.watched ?? {})[order] ?? 0)
              ? { ...st, watched: { ...(st.watched ?? {}), [order]: pct }, lastActivity: TODAY }
              : st,
          ),
        })),
      updateLesson: (order, patch) =>
        setState((p) => ({
          ...p,
          lessons: p.lessons.map((l) => (l.order === order ? { ...l, ...patch } : l)),
        })),
      publishLesson: (order, type) =>
        setState((p) => ({
          ...p,
          students: p.students.map((st) =>
            (!type || st.type === type) && st.openedUpTo < order
              ? { ...st, openedUpTo: order }
              : st,
          ),
        })),
      unpublishLesson: (order, type) =>
        setState((p) => ({
          ...p,
          students: p.students.map((st) =>
            (!type || st.type === type) && st.openedUpTo >= order
              ? { ...st, openedUpTo: order - 1 }
              : st,
          ),
        })),
      addNote: (studentId, content) =>
        setState((p) => ({
          ...p,
          notes: [
            {
              id: `n-${Date.now()}`,
              studentId,
              author: CURATOR.name,
              content,
              createdAt: TODAY,
            },
            ...p.notes,
          ],
        })),
      deleteNote: (id) =>
        setState((p) => ({ ...p, notes: p.notes.filter((n) => n.id !== id) })),
      addMeeting: (m) => setState((p) => ({ ...p, meetings: [...p.meetings, m] })),
      updateMeeting: (id, patch) =>
        setState((p) => ({
          ...p,
          meetings: p.meetings.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),
      meetingsFor: (student) =>
        state.meetings
          .filter((m) =>
            student.type === "GROUP" ? m.studentId === "group" : m.studentId === student.id,
          )
          .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)),
      reset: () => {
        localStorage.removeItem(STORAGE_KEY);
        setState(initialState);
      },
      testVideoUrl,
      setTestVideoUrl,
    };
  }, [state, ready, login, logout, updateStudent, testVideoUrl]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

/* ---------- helpers ---------- */

export function lessonState(student: Student, order: number): LessonState {
  if ((student.completed ?? []).includes(order)) return "completed";
  if (order <= student.openedUpTo) return "available";
  return "locked";
}

export function daysLeft(endDate: string, from = TODAY) {
  const diff = new Date(endDate).getTime() - new Date(from).getTime();
  return Math.round(diff / 86400000);
}

export function accessStatus(student: Student): AccessStatus {
  if (student.status === "disabled") return "disabled";
  return daysLeft(student.endDate) < 0 ? "expired" : student.status;
}

export function progressOf(student: Student) {
  return Math.round(((student.completed ?? []).length / LESSONS.length) * 100);
}

export function currentLessonOrder(student: Student) {
  for (let i = 1; i <= student.openedUpTo; i++) {
    if (!(student.completed ?? []).includes(i)) return i;
  }
  return Math.min(student.openedUpTo, LESSONS.length);
}

export function watchedPctOf(student: Student, order: number) {
  if ((student.completed ?? []).includes(order)) return 100;
  return (student.watched ?? {})[order] ?? 0;
}

export function publishedUpTo(students: Student[], type?: CourseType) {
  const pool = type ? students.filter((s) => s.type === type) : students;
  if (pool.length === 0) return 0;
  return Math.min(...pool.map((s) => s.openedUpTo));
}

export function lessonStats(students: Student[], order: number, type?: CourseType) {
  const pool = type ? students.filter((s) => s.type === type) : students;
  const opened = pool.filter((s) => s.openedUpTo >= order);
  const completed = opened.filter((s) => (s.completed ?? []).includes(order));
  const inProgress = opened.filter(
    (s) => !(s.completed ?? []).includes(order) && ((s.watched ?? {})[order] ?? 0) > 0,
  );
  return {
    total: pool.length,
    opened: opened.length,
    completed: completed.length,
    inProgress: inProgress.length,
    notStarted: opened.length - completed.length - inProgress.length,
  };
}

const MONTHS = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

export function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function formatFull(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export function relativeDay(iso: string) {
  const d = daysLeft(iso);
  if (d === 0) return "Сегодня";
  if (d === 1) return "Завтра";
  if (d === -1) return "Вчера";
  return formatDate(iso);
}

export function addMonths(iso: string, months: number) {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}
