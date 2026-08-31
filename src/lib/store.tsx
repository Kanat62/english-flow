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
  LESSONS,
  MEETINGS,
  NOTES,
  STUDENTS,
  TESTS,
  TEST_ATTEMPTS,
  TODAY,
  VOCAB_WORDS,
  type AccessStatus,
  type CefrLevel,
  type CourseStage,
  type CourseType,
  type Lesson,
  type LessonState,
  type LessonTest,
  type Meeting,
  type Note,
  type QuestionType,
  type Role,
  type Student,
  type TestAttempt,
  type VocabWord,
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
  tests: LessonTest[];
  attempts: TestAttempt[];
}

const STORAGE_KEY = "elp-state-v4";

const initialState: AppState = {
  students: STUDENTS,
  meetings: MEETINGS,
  notes: NOTES,
  session: null,
  lessons: LESSONS,
  tests: TESTS,
  attempts: TEST_ATTEMPTS,
};

function normalizeStudent(s: Student): Student {
  return {
    ...s,
    completed: s.completed ?? [],
    watched: s.watched ?? {},
    knownWords: s.knownWords ?? [],
  };
}

function normalizeState(raw: Partial<AppState>): AppState {
  return {
    ...initialState,
    ...raw,
    students: (raw.students ?? initialState.students).map(normalizeStudent),
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
  setWordKnown: (studentId: string, wordId: string, known: boolean) => void;
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
            student.type === "GROUP" ? m.studentId === "group" : m.studentId === student.id,
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
      setWordKnown: (studentId, wordId, known) =>
        setState((p) => ({
          ...p,
          students: p.students.map((st) => {
            if (st.id !== studentId) return st;
            const set = new Set(st.knownWords);
            if (known) set.add(wordId);
            else set.delete(wordId);
            return { ...st, knownWords: [...set] };
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

export function vocabForLesson(order: number): VocabWord[] {
  return VOCAB_WORDS.filter((w) => w.lessonOrder === order);
}

export function accessibleVocab(student: Student): VocabWord[] {
  return VOCAB_WORDS.filter((w) => w.lessonOrder <= student.openedUpTo);
}

export function dueVocab(student: Student): VocabWord[] {
  return accessibleVocab(student).filter((w) => !student.knownWords.includes(w.id));
}

export function vocabStats(student: Student) {
  const today = vocabForLesson(currentLessonOrder(student)).filter(
    (w) => !student.knownWords.includes(w.id),
  );
  return {
    today: today.length,
    review: dueVocab(student).length,
    mastered: student.knownWords.length,
    total: accessibleVocab(student).length,
  };
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
  | { kind: "vocab"; count: number }
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

  const due = dueVocab(student);
  if (due.length > 0) return { kind: "vocab", count: due.length };

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
