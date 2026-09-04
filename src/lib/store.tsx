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
  COURSE_STAGES,
  CURATOR,
  GROUPS,
  LESSONS,
  MEETINGS,
  NOTES,
  STUDENTS,
  TEACHERS,
  TESTS,
  TEST_ATTEMPTS,
  TODAY,
  courseProduct,
  type AccessStatus,
  type CefrLevel,
  type CourseProduct,
  type CourseStage,
  type CourseType,
  type Group,
  type GroupStatus,
  type LanguageCode,
  type Lesson,
  type LessonState,
  type LessonTest,
  type Meeting,
  type Note,
  type PaymentInfo,
  type QuestionType,
  type Role,
  type Student,
  type Teacher,
  type TestAttempt,
} from "./mock-data";

interface Session {
  role: Role;
  id: string;
}

interface AppState {
  students: Student[];
  groups: Group[];
  teachers: Teacher[];
  meetings: Meeting[];
  notes: Note[];
  session: Session | null;
  lessons: Lesson[];
  tests: LessonTest[];
  attempts: TestAttempt[];
}

const STORAGE_KEY = "elp-state-v6";

const initialState: AppState = {
  students: STUDENTS,
  groups: GROUPS,
  teachers: TEACHERS,
  meetings: MEETINGS,
  notes: NOTES,
  session: null,
  lessons: LESSONS,
  tests: TESTS,
  attempts: TEST_ATTEMPTS,
};

function normalizeStudent(s: Student): Student {
  const language: LanguageCode = s.language ?? "en";
  const type: CourseType = s.type ?? "GROUP";
  const product = courseProduct(language, type);
  return {
    ...s,
    language,
    type,
    age: s.age ?? null,
    city: s.city ?? "",
    groupId: s.groupId ?? null,
    teacherId: s.teacherId ?? null,
    completed: s.completed ?? [],
    completedAt: s.completedAt ?? {},
    watched: s.watched ?? {},
    onboarded: s.onboarded ?? true,
    managerName: s.managerName ?? "—",
    payment:
      s.payment ??
      ({
        totalCost: product.price,
        paid: product.price,
        purchaseDate: s.startDate,
        status: "full",
      } satisfies PaymentInfo),
  };
}

function normalizeState(raw: Partial<AppState>): AppState {
  return {
    ...initialState,
    ...raw,
    students: (raw.students ?? initialState.students).map(normalizeStudent),
    groups: (raw.groups?.length ? raw.groups : initialState.groups).map((g, i) => ({
      ...g,
      code: g.code ?? `${g.language === "ru" ? "RU" : "EN"}-${String(i + 1).padStart(2, "0")}`,
    })),
    teachers: raw.teachers?.length ? raw.teachers : initialState.teachers,
    meetings: (raw.meetings ?? initialState.meetings).map((m) => ({ ...m, groupId: m.groupId ?? null })),
    lessons: raw.lessons?.length ? raw.lessons : initialState.lessons,
    tests: raw.tests ?? initialState.tests,
    attempts: raw.attempts ?? initialState.attempts,
  };
}

interface Ctx extends AppState {
  ready: boolean;
  login: (login: string, password: string) => Role | null;
  logout: () => void;
  currentStudent: Student | null;
  updateStudent: (id: string, patch: Partial<Student>) => void;
  addStudent: (s: Student) => void;
  bulkUpdateStudents: (ids: string[], patch: Partial<Student>) => void;
  assignStudentToGroup: (studentId: string, groupId: string | null) => void;
  addGroup: (g: Group) => void;
  updateGroup: (id: string, patch: Partial<Group>) => void;
  assignTeacherToGroup: (groupId: string, teacherId: string | null) => void;
  setGroupCurrentLesson: (groupId: string, order: number) => void;
  publishLessonForGroup: (groupId: string, order: number) => void;
  unpublishLessonForGroup: (groupId: string, order: number) => void;
  addTeacher: (t: Teacher) => void;
  updateTeacher: (id: string, patch: Partial<Teacher>) => void;
  markAttendance: (meetingId: string, studentId: string, present: boolean) => void;
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
  createTest: (lessonOrder: number) => void;
  updateTest: (testId: string, patch: Partial<LessonTest>) => void;
  deleteTest: (testId: string) => void;
  publishTest: (testId: string) => void;
  unpublishTest: (testId: string) => void;
  addQuestion: (testId: string) => void;
  updateQuestion: (
    testId: string,
    questionId: string,
    patch: { text?: string; type?: QuestionType },
  ) => void;
  deleteQuestion: (testId: string, questionId: string) => void;
  updateOption: (
    testId: string,
    questionId: string,
    optionId: string,
    patch: { text?: string; isCorrect?: boolean },
  ) => void;
  startAttempt: (studentId: string, testId: string) => TestAttempt | null;
  saveAnswer: (attemptId: string, questionId: string, optionIds: string[]) => void;
  submitAttempt: (attemptId: string) => void;
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
      bulkUpdateStudents: (ids, patch) =>
        setState((p) => ({
          ...p,
          students: p.students.map((st) => (ids.includes(st.id) ? { ...st, ...patch } : st)),
        })),
      assignStudentToGroup: (studentId, groupId) =>
        setState((p) => {
          const group = p.groups.find((g) => g.id === groupId) ?? null;
          return {
            ...p,
            students: p.students.map((st) =>
              st.id === studentId
                ? {
                    ...st,
                    groupId,
                    teacherId: group ? group.teacherId : st.teacherId,
                    startDate: group ? group.startDate : st.startDate,
                    endDate: group ? group.endDate : st.endDate,
                  }
                : st,
            ),
          };
        }),
      addGroup: (g) => setState((p) => ({ ...p, groups: [...p.groups, g] })),
      updateGroup: (id, patch) =>
        setState((p) => ({
          ...p,
          groups: p.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        })),
      assignTeacherToGroup: (groupId, teacherId) =>
        setState((p) => ({
          ...p,
          groups: p.groups.map((g) => (g.id === groupId ? { ...g, teacherId } : g)),
          students: p.students.map((st) =>
            st.groupId === groupId ? { ...st, teacherId } : st,
          ),
        })),
      setGroupCurrentLesson: (groupId, order) =>
        setState((p) => ({
          ...p,
          groups: p.groups.map((g) => (g.id === groupId ? { ...g, currentLesson: order } : g)),
        })),
      publishLessonForGroup: (groupId, order) =>
        setState((p) => ({
          ...p,
          groups: p.groups.map((g) =>
            g.id === groupId ? { ...g, currentLesson: Math.max(g.currentLesson, order) } : g,
          ),
          students: p.students.map((st) =>
            st.groupId === groupId && accessStatus(st) === "active" && st.openedUpTo < order
              ? { ...st, openedUpTo: order }
              : st,
          ),
        })),
      unpublishLessonForGroup: (groupId, order) =>
        setState((p) => ({
          ...p,
          groups: p.groups.map((g) =>
            g.id === groupId ? { ...g, currentLesson: Math.max(0, Math.min(g.currentLesson, order - 1)) } : g,
          ),
          students: p.students.map((st) =>
            st.groupId === groupId && st.openedUpTo >= order
              ? { ...st, openedUpTo: order - 1 }
              : st,
          ),
        })),
      addTeacher: (t) => setState((p) => ({ ...p, teachers: [...p.teachers, t] })),
      updateTeacher: (id, patch) =>
        setState((p) => ({
          ...p,
          teachers: p.teachers.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      markAttendance: (meetingId, studentId, present) =>
        setState((p) => ({
          ...p,
          meetings: p.meetings.map((m) => {
            if (m.id !== meetingId) return m;
            const set = new Set(m.attended ?? []);
            if (present) set.add(studentId);
            else set.delete(studentId);
            return { ...m, attended: [...set] };
          }),
        })),
      openNextLesson: (id) =>
        setState((p) => ({
          ...p,
          students: p.students.map((st) =>
            st.id === id ? { ...st, openedUpTo: Math.min(LESSONS.length, st.openedUpTo + 1) } : st,
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
                  completedAt: { ...(st.completedAt ?? {}), [order]: TODAY },
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
      deleteNote: (id) => setState((p) => ({ ...p, notes: p.notes.filter((n) => n.id !== id) })),
      addMeeting: (m) => setState((p) => ({ ...p, meetings: [...p.meetings, m] })),
      updateMeeting: (id, patch) =>
        setState((p) => ({
          ...p,
          meetings: p.meetings.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),
      meetingsFor: (student) =>
        state.meetings
          .filter((m) =>
            student.type === "GROUP"
              ? student.groupId
                ? m.groupId === student.groupId
                : m.studentId === "group"
              : m.studentId === student.id,
          )
          .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)),
      reset: () => {
        localStorage.removeItem(STORAGE_KEY);
        setState(initialState);
      },
      testVideoUrl,
      setTestVideoUrl,
      createTest: (lessonOrder) =>
        setState((p) => ({
          ...p,
          tests: p.tests.some((t) => t.lessonOrder === lessonOrder)
            ? p.tests
            : [
                ...p.tests,
                {
                  id: `test-${Date.now()}`,
                  lessonOrder,
                  title: `Тест к уроку ${lessonOrder}`,
                  timeLimitSec: 300,
                  passingScore: 70,
                  status: "draft",
                  questions: [],
                },
              ],
        })),
      updateTest: (testId, patch) =>
        setState((p) => ({
          ...p,
          tests: p.tests.map((t) => (t.id === testId ? { ...t, ...patch } : t)),
        })),
      deleteTest: (testId) =>
        setState((p) => ({ ...p, tests: p.tests.filter((t) => t.id !== testId) })),
      publishTest: (testId) =>
        setState((p) => ({
          ...p,
          tests: p.tests.map((t) => (t.id === testId ? { ...t, status: "published" } : t)),
        })),
      unpublishTest: (testId) =>
        setState((p) => ({
          ...p,
          tests: p.tests.map((t) => (t.id === testId ? { ...t, status: "draft" } : t)),
        })),
      addQuestion: (testId) =>
        setState((p) => ({
          ...p,
          tests: p.tests.map((t) => {
            if (t.id !== testId) return t;
            const order = t.questions.length + 1;
            const qId = `${testId}-q${Date.now()}`;
            return {
              ...t,
              questions: [
                ...t.questions,
                {
                  id: qId,
                  text: "",
                  type: "single",
                  order,
                  options: [0, 1, 2, 3].map((i) => ({
                    id: `${qId}-o${i}`,
                    text: "",
                    isCorrect: i === 0,
                  })),
                },
              ],
            };
          }),
        })),
      updateQuestion: (testId, questionId, patch) =>
        setState((p) => ({
          ...p,
          tests: p.tests.map((t) =>
            t.id !== testId
              ? t
              : {
                  ...t,
                  questions: t.questions.map((q) => (q.id === questionId ? { ...q, ...patch } : q)),
                },
          ),
        })),
      deleteQuestion: (testId, questionId) =>
        setState((p) => ({
          ...p,
          tests: p.tests.map((t) =>
            t.id !== testId
              ? t
              : {
                  ...t,
                  questions: t.questions
                    .filter((q) => q.id !== questionId)
                    .map((q, i) => ({ ...q, order: i + 1 })),
                },
          ),
        })),
      updateOption: (testId, questionId, optionId, patch) =>
        setState((p) => ({
          ...p,
          tests: p.tests.map((t) =>
            t.id !== testId
              ? t
              : {
                  ...t,
                  questions: t.questions.map((q) => {
                    if (q.id !== questionId) return q;
                    let options = q.options.map((o) =>
                      o.id === optionId ? { ...o, ...patch } : o,
                    );
                    if (patch.isCorrect && q.type === "single") {
                      options = options.map((o) => ({ ...o, isCorrect: o.id === optionId }));
                    }
                    return { ...q, options };
                  }),
                },
          ),
        })),
      startAttempt: (studentId, testId) => {
        const test = state.tests.find((t) => t.id === testId);
        if (!test) return null;
        const existing = state.attempts.find(
          (a) =>
            a.studentId === studentId &&
            a.testId === testId &&
            a.status === "in_progress" &&
            new Date(a.expiresAt).getTime() > Date.now(),
        );
        if (existing) return existing;
        const now = new Date();
        const attempt: TestAttempt = {
          id: `attempt-${Date.now()}`,
          testId,
          lessonOrder: test.lessonOrder,
          studentId,
          startedAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + test.timeLimitSec * 1000).toISOString(),
          submittedAt: null,
          answers: {},
          correctCount: null,
          totalQuestions: test.questions.length,
          score: null,
          passed: null,
          status: "in_progress",
        };
        setState((p) => ({ ...p, attempts: [...p.attempts, attempt] }));
        return attempt;
      },
      saveAnswer: (attemptId, questionId, optionIds) =>
        setState((p) => ({
          ...p,
          attempts: p.attempts.map((a) =>
            a.id === attemptId && a.status === "in_progress"
              ? { ...a, answers: { ...a.answers, [questionId]: optionIds } }
              : a,
          ),
        })),
      submitAttempt: (attemptId) =>
        setState((p) => ({
          ...p,
          attempts: p.attempts.map((a) => {
            if (a.id !== attemptId || a.status !== "in_progress") return a;
            const test = p.tests.find((t) => t.id === a.testId);
            if (!test) return a;
            const correctCount = test.questions.reduce((sum, q) => {
              const correctIds = q.options
                .filter((o) => o.isCorrect)
                .map((o) => o.id)
                .sort();
              const givenIds = [...(a.answers[q.id] ?? [])].sort();
              const isCorrect =
                correctIds.length === givenIds.length &&
                correctIds.every((id, i) => id === givenIds[i]);
              return sum + (isCorrect ? 1 : 0);
            }, 0);
            const total = test.questions.length;
            const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
            return {
              ...a,
              submittedAt: new Date().toISOString(),
              correctCount,
              totalQuestions: total,
              score,
              passed: score >= test.passingScore,
              status: "submitted",
            };
          }),
        })),
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

export type TestAvailability = "locked" | "available" | "in_progress" | "passed" | "failed";

export function testForLesson(tests: LessonTest[], order: number, publishedOnly = true) {
  return tests.find((t) => t.lessonOrder === order && (!publishedOnly || t.status === "published"));
}

export function attemptsFor(attempts: TestAttempt[], studentId: string, testId: string) {
  return attempts
    .filter((a) => a.studentId === studentId && a.testId === testId)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export function activeAttempt(attempts: TestAttempt[], studentId: string, testId: string) {
  return attemptsFor(attempts, studentId, testId).find(
    (a) => a.status === "in_progress" && new Date(a.expiresAt).getTime() > Date.now(),
  );
}

export function bestAttempt(attempts: TestAttempt[], studentId: string, testId: string) {
  const submitted = attemptsFor(attempts, studentId, testId).filter(
    (a) => a.status === "submitted",
  );
  if (submitted.length === 0) return null;
  return submitted.reduce((best, a) => ((a.score ?? 0) > (best.score ?? 0) ? a : best));
}

export function testAvailability(
  student: Student,
  test: LessonTest,
  attempts: TestAttempt[],
): TestAvailability {
  if (test.status !== "published" || lessonState(student, test.lessonOrder) !== "completed") {
    return "locked";
  }
  if (activeAttempt(attempts, student.id, test.id)) return "in_progress";
  const best = bestAttempt(attempts, student.id, test.id);
  if (!best) return "available";
  return best.passed ? "passed" : "failed";
}

/* ---------- генерация логина / пароля ученика ---------- */

const CYRILLIC_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

/** «Канат» → «kanat»: транслитерация в латиницу, только буквы/цифры. */
export function transliterate(input: string): string {
  return input
    .toLowerCase()
    .split("")
    .map((ch) => CYRILLIC_MAP[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]/g, "");
}

function randomDigits(n: number): string {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("");
}

/**
 * Логин из имени + двух последних цифр телефона («kanat97»). Если такой логин
 * уже занят (или телефона нет) — две случайные цифры, пока не выйдет уникальный.
 */
export function generateLogin(firstName: string, phone: string, taken: Set<string>): string {
  const base = transliterate(firstName) || "user";
  const digits = (phone.match(/\d/g) ?? []).join("");
  const tail = digits.slice(-2);
  if (tail.length === 2 && !taken.has(base + tail)) return base + tail;
  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = base + randomDigits(2);
    if (!taken.has(candidate)) return candidate;
  }
  // крайне маловероятно: все двузначные заняты — расширяем хвост
  let login = "";
  do {
    login = base + randomDigits(4);
  } while (taken.has(login));
  return login;
}

/** Пароль из 5 случайных латинских букв, уникальный по базе. */
export function generatePassword(taken: Set<string>): string {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  let pw = "";
  do {
    pw = Array.from({ length: 5 }, () => letters[Math.floor(Math.random() * letters.length)]).join("");
  } while (taken.has(pw));
  return pw;
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

/* ---------- академия: язык · курс · группа · преподаватель ---------- */

const LESSONS_PER_MONTH = Math.ceil(LESSONS.length / 6);

/** Месяц программы (1–6) для урока. */
export function monthOfLesson(order: number) {
  return Math.min(6, Math.max(1, Math.ceil(order / LESSONS_PER_MONTH)));
}

export function levelForLesson(product: CourseProduct, order: number): CefrLevel {
  const month = monthOfLesson(order);
  return product.levelPlan.find((p) => p.month === month)?.level ?? "A1";
}

export interface GroupStage {
  month: number;
  level: CefrLevel;
  lesson: number;
  topic: string;
}

export function groupStage(group: Group, lessons: Lesson[]): GroupStage {
  const product = courseProduct(group.language, "GROUP");
  const lesson = lessons.find((l) => l.order === group.currentLesson);
  return {
    month: monthOfLesson(group.currentLesson),
    level: levelForLesson(product, group.currentLesson),
    lesson: group.currentLesson,
    topic: lesson?.title ?? "—",
  };
}

export function teacherOf(teachers: Teacher[], id: string | null) {
  return id ? (teachers.find((t) => t.id === id) ?? null) : null;
}

export function groupOf(groups: Group[], student: Student) {
  return student.groupId ? (groups.find((g) => g.id === student.groupId) ?? null) : null;
}

export function studentsInGroup(students: Student[], groupId: string) {
  return students.filter((s) => s.groupId === groupId);
}

export function groupIsFull(students: Student[], group: Group) {
  return studentsInGroup(students, group.id).length >= group.maxStudents;
}

export interface GroupHealth {
  total: number;
  active: number;
  atRisk: number;
  inactive: number;
}

export function groupHealth(students: Student[], groupId: string, today = TODAY): GroupHealth {
  const list = studentsInGroup(students, groupId);
  let active = 0;
  let atRisk = 0;
  let inactive = 0;
  for (const s of list) {
    const idle = -daysLeft(s.lastActivity, today);
    if (idle >= 5) inactive++;
    else if (idle >= 3) atRisk++;
    else active++;
  }
  return { total: list.length, active, atRisk, inactive };
}

/**
 * Конфликт расписания преподавателя: занят ли он в другой активной/набираемой группе
 * в тот же вечерний слот (по времени старта практики).
 */
export function teacherGroupConflict(
  groups: Group[],
  teacherId: string,
  practiceStart: string,
  exceptGroupId?: string,
) {
  return groups.find(
    (g) =>
      g.id !== exceptGroupId &&
      g.teacherId === teacherId &&
      g.practiceStart === practiceStart &&
      (g.status === "active" || g.status === "recruiting"),
  );
}

/**
 * Подбор ближайшей подходящей группы для нового ученика: тот же язык, набор ещё открыт
 * (группа не стартовала или на этапе набора), есть места. Сортировка по дате старта.
 */
export function findMatchingGroup(
  groups: Group[],
  students: Student[],
  language: LanguageCode,
  fromDate = TODAY,
  time?: string,
) {
  return groups
    .filter((g) => g.language === language)
    .filter((g) => g.status === "recruiting")
    .filter((g) => g.startDate >= fromDate)
    .filter((g) => !time || g.practiceStart === time)
    .filter((g) => !groupIsFull(students, g))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
}

export const GROUP_STATUS_LABEL: Record<GroupStatus, string> = {
  recruiting: "Набор",
  active: "Активна",
  finished: "Завершена",
  archived: "Архив",
};

const WEEK_RHYTHM: ("theory" | "practice" | "rest")[] = [
  "theory",
  "practice",
  "theory",
  "practice",
  "theory",
  "practice",
  "rest",
];

export function groupWeekSchedule(group: Group) {
  const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  return days.map((day, i) => ({
    day,
    kind: WEEK_RHYTHM[i]!,
    time: WEEK_RHYTHM[i] === "practice" ? `${group.practiceStart}–${group.practiceEnd}` : "",
  }));
}

/* ---------- «требует внимания» ---------- */

export interface AttentionBuckets {
  idleStudents: Student[];
  groupsNoTeacher: Group[];
  groupsNoLink: Group[];
  notOnboarded: Student[];
  groupsEndingSoon: Group[];
}

export function attentionBuckets(
  students: Student[],
  groups: Group[],
  today = TODAY,
): AttentionBuckets {
  const activeStudents = students.filter((s) => accessStatus(s) === "active");
  return {
    idleStudents: activeStudents.filter((s) => -daysLeft(s.lastActivity, today) >= 3),
    groupsNoTeacher: groups.filter(
      (g) => !g.teacherId && (g.status === "active" || g.status === "recruiting"),
    ),
    groupsNoLink: groups.filter(
      (g) => !g.meetUrl && (g.status === "active" || g.status === "recruiting"),
    ),
    notOnboarded: activeStudents.filter((s) => !s.onboarded),
    groupsEndingSoon: groups.filter(
      (g) => g.status === "active" && daysLeft(g.endDate, today) <= 21 && daysLeft(g.endDate, today) >= 0,
    ),
  };
}

export type StageStatus = "locked" | "current" | "completed";

export function stageForBlock(block: string): CourseStage | undefined {
  return COURSE_STAGES.find((s) => s.block === block);
}

export function stageForLesson(lessons: Lesson[], order: number): CourseStage | undefined {
  const lesson = lessons.find((l) => l.order === order);
  return lesson ? stageForBlock(lesson.block) : undefined;
}

export function stageStatus(student: Student, lessons: Lesson[], stage: CourseStage): StageStatus {
  const stageLessons = lessons.filter((l) => l.block === stage.block);
  if (stageLessons.length === 0) return "locked";
  if (stageLessons.every((l) => student.completed.includes(l.order))) return "completed";
  return stageLessons.some((l) => l.order <= student.openedUpTo) ? "current" : "locked";
}

export function courseLevels(): CefrLevel[] {
  return [...new Set(COURSE_STAGES.map((s) => s.level))];
}

export function levelStatus(student: Student, lessons: Lesson[], level: CefrLevel): StageStatus {
  const statuses = COURSE_STAGES.filter((s) => s.level === level).map((s) =>
    stageStatus(student, lessons, s),
  );
  if (statuses.every((s) => s === "completed")) return "completed";
  if (statuses.some((s) => s === "current" || s === "completed")) return "current";
  return "locked";
}

export function practiceStats(meetings: Meeting[]) {
  const finished = meetings.filter((m) => m.status !== "scheduled");
  const attended = finished.filter((m) => m.status === "completed").length;
  return { total: finished.length, attended };
}

export function testsStats(student: Student, tests: LessonTest[], attempts: TestAttempt[]) {
  const accessible = tests.filter(
    (t) => t.status === "published" && t.lessonOrder <= student.openedUpTo,
  );
  const passed = accessible.filter((t) => bestAttempt(attempts, student.id, t.id)?.passed).length;
  return { total: accessible.length, passed };
}

export type NextStep =
  | { kind: "lesson"; lesson: Lesson }
  | { kind: "test"; lesson: Lesson; test: LessonTest }
  | { kind: "practice"; meeting: Meeting }
  | { kind: "done"; nextMeeting?: Meeting };

export function nextStepFor(
  student: Student,
  lessons: Lesson[],
  tests: LessonTest[],
  attempts: TestAttempt[],
  meetings: Meeting[],
): NextStep {
  for (let order = 1; order <= student.openedUpTo; order++) {
    if (!student.completed.includes(order)) {
      const lesson = lessons.find((l) => l.order === order);
      if (lesson) return { kind: "lesson", lesson };
      break;
    }
  }

  for (const order of [...student.completed].sort((a, b) => a - b)) {
    const test = testForLesson(tests, order);
    if (!test) continue;
    const availability = testAvailability(student, test, attempts);
    if (
      availability === "available" ||
      availability === "failed" ||
      availability === "in_progress"
    ) {
      const lesson = lessons.find((l) => l.order === order);
      if (lesson) return { kind: "test", lesson, test };
    }
  }

  const todayMeeting = meetings.find((m) => m.status === "scheduled" && m.date === TODAY);
  if (todayMeeting) return { kind: "practice", meeting: todayMeeting };

  const nextMeeting = meetings
    .filter((m) => m.status === "scheduled" && m.date >= TODAY)
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))[0];
  return nextMeeting ? { kind: "done", nextMeeting } : { kind: "done" };
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

const WEEKDAYS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function weekdayShort(iso: string) {
  const d = new Date(iso);
  return WEEKDAYS_SHORT[(d.getDay() + 6) % 7];
}

/** Даты понедельника–воскресенья недели, в которую входит anchor. */
export function weekRangeOf(anchor: string): string[] {
  const d = new Date(anchor);
  const mondayOffset = (d.getDay() + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    return dt.toISOString().slice(0, 10);
  });
}

export function shiftWeek(anchor: string, weeks: number) {
  const d = new Date(anchor);
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

export type DayItemKind = "lesson" | "test" | "practice";
export type DayItemStatus = "done" | "missed" | "scheduled" | "cancelled";

export interface DayAgendaItem {
  kind: DayItemKind;
  status: DayItemStatus;
  title: string;
  subtitle: string;
  time?: string;
  meetUrl?: string;
  lessonOrder: number;
}

/** Реальные учебные события конкретного дня: завершённые уроки, сданные тесты, практики. */
export function dayAgenda(
  student: Student,
  lessons: Lesson[],
  tests: LessonTest[],
  attempts: TestAttempt[],
  meetings: Meeting[],
  date: string,
): DayAgendaItem[] {
  const items: DayAgendaItem[] = [];

  for (const [orderStr, completedDate] of Object.entries(student.completedAt ?? {})) {
    if (completedDate !== date) continue;
    const lesson = lessons.find((l) => l.order === Number(orderStr));
    if (lesson) {
      items.push({
        kind: "lesson",
        status: "done",
        title: `Урок ${lesson.order}. ${lesson.title}`,
        subtitle: "Теория пройдена",
        lessonOrder: lesson.order,
      });
    }
  }

  attempts
    .filter(
      (a) =>
        a.studentId === student.id &&
        a.status === "submitted" &&
        a.submittedAt?.slice(0, 10) === date,
    )
    .forEach((a) => {
      const test = tests.find((t) => t.id === a.testId);
      if (!test) return;
      items.push({
        kind: "test",
        status: "done",
        title: test.title,
        subtitle: `${a.score}% · ${a.passed ? "пройден" : "не пройден"}`,
        lessonOrder: test.lessonOrder,
      });
    });

  meetings
    .filter(
      (m) =>
        m.date === date &&
        (student.type === "GROUP" ? m.studentId === "group" : m.studentId === student.id),
    )
    .forEach((m) => {
      items.push({
        kind: "practice",
        status:
          m.status === "completed" ? "done" : m.status === "cancelled" ? "cancelled" : "scheduled",
        title: m.title,
        subtitle: `${m.startTime}–${m.endTime}`,
        time: m.startTime,
        meetUrl: m.meetUrl,
        lessonOrder: m.lessonOrder,
      });
    });

  return items.sort((a, b) => (a.time ?? "00:00").localeCompare(b.time ?? "00:00"));
}

export interface WeekDayAgenda {
  date: string;
  items: DayAgendaItem[];
}

export function weekAgenda(
  student: Student,
  lessons: Lesson[],
  tests: LessonTest[],
  attempts: TestAttempt[],
  meetings: Meeting[],
  week: string[],
): WeekDayAgenda[] {
  return week.map((date) => ({
    date,
    items: dayAgenda(student, lessons, tests, attempts, meetings, date),
  }));
}

const WEEKDAYS_FULL = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];

export function weekdayFull(iso: string) {
  const d = new Date(iso);
  return WEEKDAYS_FULL[(d.getDay() + 6) % 7] ?? "";
}

export type WeekPlanKind = "theory" | "practice" | "rest";
export type WeekPlanStatus = "done" | "past" | "today" | "upcoming" | "locked" | "rest";

export interface WeekPlanDay {
  date: string;
  weekday: string;
  kind: WeekPlanKind;
  status: WeekPlanStatus;
  title: string;
  topic: string;
  meta: string;
  meetUrl?: string;
  lessonOrder?: number;
}

/** Недельный ритм курса: теория и практика чередуются по дням, вс — выходной. */
const PLAN_RHYTHM: { kind: WeekPlanKind; offset: number }[] = [
  { kind: "theory", offset: 0 },
  { kind: "practice", offset: 0 },
  { kind: "theory", offset: 1 },
  { kind: "practice", offset: 1 },
  { kind: "theory", offset: 2 },
  { kind: "practice", offset: 2 },
  { kind: "rest", offset: 0 },
];

const PLAN_LABEL: Record<WeekPlanKind, string> = {
  theory: "Теория",
  practice: "Практика",
  rest: "Выходной",
};

/**
 * План обучения на неделю (7 карточек, пн–вс). Ритм курса накладывается на реальные
 * практики из расписания: где есть встреча — берём её время и ссылку Google Meet.
 */
export function weekPlan(
  student: Student,
  lessons: Lesson[],
  tests: LessonTest[],
  attempts: TestAttempt[],
  meetings: Meeting[],
  week: string[],
  today = TODAY,
): WeekPlanDay[] {
  const currentOrder = currentLessonOrder(student);
  const lessonAt = (offset: number) =>
    lessons.find((l) => l.order === currentOrder + offset) ??
    lessons.find((l) => l.order === currentOrder);
  const groupRoom = meetings.find((m) => m.meetUrl)?.meetUrl;

  return week.map((date, i) => {
    const slot = PLAN_RHYTHM[i % PLAN_RHYTHM.length] ?? PLAN_RHYTHM[0]!;
    const lesson = lessonAt(slot.offset);
    const topic = lesson?.title ?? "английский";
    const meeting = meetings.find((m) => m.date === date);
    const isRest = slot.kind === "rest";

    let status: WeekPlanStatus;
    if (isRest) {
      status = "rest";
    } else if (date < today) {
      status =
        dayAgenda(student, lessons, tests, attempts, meetings, date).length > 0 ? "done" : "past";
    } else if (date === today) {
      status = "today";
    } else {
      status = "locked";
    }

    const meta = isRest
      ? "Отдыхай и возвращайся с новыми силами"
      : slot.kind === "practice"
        ? meeting
          ? `${meeting.startTime}–${meeting.endTime} · групповая`
          : "21:00–22:00 · групповая"
        : `Видео · ${lesson ? parseInt(lesson.duration, 10) : 12} мин`;

    const room = slot.kind === "practice" ? (meeting?.meetUrl ?? groupRoom) : undefined;

    return {
      date,
      weekday: weekdayFull(date),
      kind: slot.kind,
      status,
      title: isRest ? "Выходной" : `${PLAN_LABEL[slot.kind]} · ${topic}`,
      topic,
      meta,
      ...(room ? { meetUrl: room } : {}),
      ...(!isRest && lesson ? { lessonOrder: lesson.order } : {}),
    };
  });
}

/** Даты, в которые ученик сделал хотя бы одно учебное действие. */
export function activityDatesFor(
  student: Student,
  attempts: TestAttempt[],
  meetings: Meeting[],
): Set<string> {
  const dates = new Set<string>();
  Object.values(student.completedAt ?? {}).forEach((d) => dates.add(d));
  attempts
    .filter((a) => a.studentId === student.id && a.status === "submitted" && a.submittedAt)
    .forEach((a) => dates.add(a.submittedAt!.slice(0, 10)));
  meetings
    .filter(
      (m) =>
        m.status === "completed" &&
        (student.type === "GROUP" ? m.studentId === "group" : m.studentId === student.id),
    )
    .forEach((m) => dates.add(m.date));
  return dates;
}

/** Число дней подряд (по TODAY назад) с хотя бы одним учебным действием. */
export function streakDays(dates: Set<string>, today = TODAY): number {
  let count = 0;
  const cursor = new Date(today);
  if (!dates.has(today)) cursor.setDate(cursor.getDate() - 1);
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}
