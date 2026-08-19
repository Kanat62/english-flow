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
  COMPLETE_THRESHOLD,
  COURSES,
  CURATOR,
  LESSONS,
  MEETINGS,
  NOTES,
  PROGRESS,
  STUDENTS,
  TODAY,
  VIDEOS,
  type AccessStatus,
  type Course,
  type Lesson,
  type LessonState,
  type LessonStatus,
  type Meeting,
  type Note,
  type Progress,
  type Role,
  type Student,
  type Video,
} from "./mock-data";

interface Session {
  role: Role;
  id: string;
}

interface AppState {
  courses: Course[];
  lessons: Lesson[];
  videos: Video[];
  students: Student[];
  meetings: Meeting[];
  notes: Note[];
  progress: Record<string, Progress>;
  globalVideoId: string | null;
  session: Session | null;
}

const STORAGE_KEY = "akcent-state-v2";

const initialState: AppState = {
  courses: COURSES,
  lessons: LESSONS,
  videos: VIDEOS,
  students: STUDENTS,
  meetings: MEETINGS,
  notes: NOTES,
  progress: PROGRESS,
  globalVideoId: "v-demo",
  session: null,
};

export interface StudentStats {
  completed: number;
  total: number;
  percent: number;
  current: Lesson | null;
}

interface Ctx extends AppState {
  ready: boolean;
  login: (login: string, password: string) => Role | null;
  logout: () => void;
  currentStudent: Student | null;
  currentCourse: Course | null;
  courseById: (id: string) => Course | undefined;
  lessonsOf: (courseId: string) => Lesson[];
  publishedOf: (courseId: string) => Lesson[];
  lessonByOrder: (courseId: string, order: number) => Lesson | undefined;
  videoFor: (lesson: Lesson | null | undefined) => Video | null;
  progressFor: (studentId: string, lessonId: string) => Progress;
  setWatched: (studentId: string, lessonId: string, percent: number) => void;
  lessonStateFor: (student: Student, lesson: Lesson) => LessonState;
  statsFor: (student: Student) => StudentStats;
  updateLesson: (id: string, patch: Partial<Lesson>) => void;
  setLessonStatus: (id: string, status: LessonStatus) => void;
  publishUpTo: (courseId: string, order: number) => void;
  addVideo: (v: Video) => void;
  deleteVideo: (id: string) => void;
  attachVideo: (lessonId: string, videoId: string | null, applyToAll: boolean) => void;
  setGlobalVideo: (id: string | null) => void;
  addCourse: (c: Course) => void;
  updateCourse: (id: string, patch: Partial<Course>) => void;
  updateStudent: (id: string, patch: Partial<Student>) => void;
  addStudent: (s: Student) => void;
  addNote: (studentId: string, content: string) => void;
  deleteNote: (id: string) => void;
  addMeeting: (m: Meeting) => void;
  updateMeeting: (id: string, patch: Partial<Meeting>) => void;
  meetingsFor: (student: Student) => Meeting[];
  reset: () => void;
}

const AppContext = createContext<Ctx | null>(null);

const emptyProgress: Progress = { percent: 0, status: "not_started", updatedAt: TODAY };

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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota */
    }
  }, [state, ready]);

  const login = useCallback(
    (loginValue: string, password: string): Role | null => {
      const l = loginValue.trim().toLowerCase();
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

  const value: Ctx = useMemo(() => {
    const currentStudent =
      state.session?.role === "student"
        ? (state.students.find((s) => s.id === state.session!.id) ?? null)
        : null;

    const courseById = (id: string) => state.courses.find((c) => c.id === id);

    const lessonsOf = (courseId: string) =>
      state.lessons
        .filter((l) => l.courseId === courseId && l.status !== "archived")
        .sort((a, b) => a.order - b.order);

    const publishedOf = (courseId: string) =>
      lessonsOf(courseId).filter((l) => l.status === "published");

    const progressFor = (studentId: string, lessonId: string) =>
      state.progress[`${studentId}:${lessonId}`] ?? emptyProgress;

    const lessonStateFor = (student: Student, lesson: Lesson): LessonState => {
      if (lesson.status !== "published") return "locked";
      return progressFor(student.id, lesson.id).status === "completed" ? "completed" : "available";
    };

    const statsFor = (student: Student): StudentStats => {
      const list = publishedOf(student.courseId);
      const total = lessonsOf(student.courseId).length;
      const completed = list.filter(
        (l) => progressFor(student.id, l.id).status === "completed",
      ).length;
      const current =
        list.find((l) => progressFor(student.id, l.id).status !== "completed") ??
        list[list.length - 1] ??
        null;
      return {
        completed,
        total,
        percent: total ? Math.round((completed / total) * 100) : 0,
        current,
      };
    };

    return {
      ...state,
      ready,
      login,
      logout,
      currentStudent,
      currentCourse: currentStudent ? (courseById(currentStudent.courseId) ?? null) : null,
      courseById,
      lessonsOf,
      publishedOf,
      lessonByOrder: (courseId, order) =>
        state.lessons.find((l) => l.courseId === courseId && l.order === order),
      videoFor: (lesson) => {
        if (state.globalVideoId) {
          const v = state.videos.find((x) => x.id === state.globalVideoId);
          if (v) return v;
        }
        if (!lesson?.videoId) return null;
        return state.videos.find((v) => v.id === lesson.videoId) ?? null;
      },
      progressFor,
      setWatched: (studentId, lessonId, percent) =>
        setState((p) => {
          const key = `${studentId}:${lessonId}`;
          const prev = p.progress[key] ?? emptyProgress;
          const next = Math.max(prev.percent, Math.min(100, Math.round(percent)));
          if (next === prev.percent && prev.status !== "not_started") return p;
          return {
            ...p,
            progress: {
              ...p.progress,
              [key]: {
                percent: next,
                status: next >= COMPLETE_THRESHOLD ? "completed" : "in_progress",
                updatedAt: TODAY,
              },
            },
            students: p.students.map((s) =>
              s.id === studentId ? { ...s, lastActivity: TODAY } : s,
            ),
          };
        }),
      lessonStateFor,
      statsFor,
      updateLesson: (id, patch) =>
        setState((p) => ({
          ...p,
          lessons: p.lessons.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        })),
      setLessonStatus: (id, status) =>
        setState((p) => ({
          ...p,
          lessons: p.lessons.map((l) =>
            l.id === id
              ? {
                  ...l,
                  status,
                  publishedAt: status === "published" ? (l.publishedAt ?? TODAY) : null,
                }
              : l,
          ),
        })),
      publishUpTo: (courseId, order) =>
        setState((p) => ({
          ...p,
          lessons: p.lessons.map((l) =>
            l.courseId === courseId && l.status !== "archived"
              ? l.order <= order
                ? { ...l, status: "published", publishedAt: l.publishedAt ?? TODAY }
                : { ...l, status: "draft", publishedAt: null }
              : l,
          ),
        })),
      addVideo: (v) => setState((p) => ({ ...p, videos: [v, ...p.videos] })),
      deleteVideo: (id) =>
        setState((p) => ({
          ...p,
          videos: p.videos.filter((v) => v.id !== id),
          globalVideoId: p.globalVideoId === id ? null : p.globalVideoId,
          lessons: p.lessons.map((l) => (l.videoId === id ? { ...l, videoId: null } : l)),
        })),
      attachVideo: (lessonId, videoId, applyToAll) =>
        setState((p) => ({
          ...p,
          lessons: p.lessons.map((l) => (l.id === lessonId ? { ...l, videoId } : l)),
          globalVideoId: applyToAll ? videoId : p.globalVideoId,
        })),
      setGlobalVideo: (id) => setState((p) => ({ ...p, globalVideoId: id })),
      addCourse: (c) => setState((p) => ({ ...p, courses: [...p.courses, c] })),
      updateCourse: (id, patch) =>
        setState((p) => ({
          ...p,
          courses: p.courses.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      updateStudent: (id, patch) =>
        setState((p) => ({
          ...p,
          students: p.students.map((st) => (st.id === id ? { ...st, ...patch } : st)),
        })),
      addStudent: (s) => setState((p) => ({ ...p, students: [s, ...p.students] })),
      addNote: (studentId, content) =>
        setState((p) => ({
          ...p,
          notes: [
            { id: `n-${Date.now()}`, studentId, author: CURATOR.name, content, createdAt: TODAY },
            ...p.notes,
          ],
        })),
      deleteNote: (id) => setState((p) => ({ ...p, notes: p.notes.filter((n) => n.id !== id) })),
      addMeeting: (m) => setState((p) => ({ ...p, meetings: [...p.meetings, m] })),
      updateMeeting: (id, patch) =>
        setState((p) => ({
          ...p,
          meetings: p.meetings.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),
      meetingsFor: (student) =>
        state.meetings
          .filter(
            (m) =>
              m.courseId === student.courseId &&
              (student.type === "GROUP" ? m.studentId === "group" : m.studentId === student.id),
          )
          .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)),
      reset: () => {
        localStorage.removeItem(STORAGE_KEY);
        setState(initialState);
      },
    };
  }, [state, ready, login, logout]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

/* ---------- helpers ---------- */

export function daysLeft(endDate: string, from = TODAY) {
  const diff = new Date(endDate).getTime() - new Date(from).getTime();
  return Math.round(diff / 86400000);
}

export function accessStatus(student: Student): AccessStatus {
  if (student.status === "disabled") return "disabled";
  return daysLeft(student.endDate) < 0 ? "expired" : student.status;
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
