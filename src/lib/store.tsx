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
}

const STORAGE_KEY = "elp-state-v1";

const initialState: AppState = {
  students: STUDENTS,
  meetings: MEETINGS,
  notes: NOTES,
  session: null,
};

interface Ctx extends AppState {
  ready: boolean;
  login: (login: string, password: string) => Role | null;
  logout: () => void;
  currentStudent: Student | null;
  updateStudent: (id: string, patch: Partial<Student>) => void;
  addStudent: (s: Student) => void;
  openNextLesson: (id: string) => void;
  completeLesson: (studentId: string, order: number) => void;
  addNote: (studentId: string, content: string) => void;
  deleteNote: (id: string) => void;
  addMeeting: (m: Meeting) => void;
  updateMeeting: (id: string, patch: Partial<Meeting>) => void;
  meetingsFor: (student: Student) => Meeting[];
  reset: () => void;
}

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...initialState, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, ready]);

  const login = useCallback((login: string, password: string): Role | null => {
    const l = login.trim().toLowerCase();
    if (l === CURATOR.login && password === CURATOR.password) {
      setState((s) => ({ ...s, session: { role: "curator", id: CURATOR.id } }));
      return "curator";
    }
    let found: Student | undefined;
    setState((s) => {
      found = s.students.find((st) => st.login === l && st.password === password);
      return found ? { ...s, session: { role: "student", id: found.id } } : s;
    });
    const direct = STUDENTS.find((st) => st.login === l && st.password === password);
    return found || direct ? "student" : null;
  }, []);

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
            st.id === studentId && !st.completed.includes(order)
              ? { ...st, completed: [...st.completed, order], lastActivity: TODAY }
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
    };
  }, [state, ready, login, logout, updateStudent]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

/* ---------- helpers ---------- */

export function lessonState(student: Student, order: number): LessonState {
  if (student.completed.includes(order)) return "completed";
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
  return Math.round((student.completed.length / LESSONS.length) * 100);
}

export function currentLessonOrder(student: Student) {
  for (let i = 1; i <= student.openedUpTo; i++) {
    if (!student.completed.includes(i)) return i;
  }
  return Math.min(student.openedUpTo, LESSONS.length);
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
