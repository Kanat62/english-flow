// Тестовые данные платформы (без бэкенда).

export type Role = "student" | "curator";
export type CourseType = "GROUP" | "INDIVIDUAL";
export type AccessStatus = "active" | "expired" | "disabled";
export type LessonState = "locked" | "available" | "completed";
export type ProgressStatus = "not_started" | "in_progress" | "completed";
export type MeetingStatus = "scheduled" | "completed" | "cancelled";
export type QuestionType = "single" | "multiple";
export type TestStatus = "draft" | "published";
export type AttemptStatus = "in_progress" | "submitted";

/* ---------- академия: язык · курс · группа · преподаватель ---------- */

export type LanguageCode = "en" | "ru";
export type GroupStatus = "recruiting" | "active" | "finished" | "archived";
export type TeacherStatus = "active" | "absent" | "replacement";
export type PaymentStatus = "full" | "partial" | "unpaid";

export interface Language {
  code: LanguageCode;
  name: string;
  nameRu: string;
}

export interface CourseProduct {
  id: string;
  language: LanguageCode;
  format: CourseType;
  title: string;
  durationMonths: number;
  price: number;
  currency: string;
  features: string[];
  /** Шаблон программы: месяц → уровень CEFR. Настройка курса, а не жёсткое условие. */
  levelPlan: { month: number; level: CefrLevel }[];
}

export interface Teacher {
  id: string;
  name: string;
  languages: LanguageCode[];
  status: TeacherStatus;
  phone: string;
  tone: string;
}

export interface Group {
  id: string;
  /** Короткий код потока для различения: EN-01, RU-01, … */
  code: string;
  /** Понятное человеку название, напр. «EN-01 · Английский язык · 07.09.2026 · 20:00». */
  name: string;
  language: LanguageCode;
  startDate: string;
  endDate: string;
  /** Вечерний слот практики хранится в группе, а не в коде. */
  practiceStart: string;
  practiceEnd: string;
  teacherId: string | null;
  maxStudents: number;
  status: GroupStatus;
  /** Общий текущий учебный этап группы (order урока). Прогресс ученика — отдельно. */
  currentLesson: number;
  meetUrl: string;
}

export interface PaymentInfo {
  totalCost: number;
  paid: number;
  purchaseDate: string;
  status: PaymentStatus;
}

export interface Lesson {
  id: string;
  order: number;
  title: string;
  description: string;
  videoUrl: string;
  duration: string;
  block: string;
}

export interface Meeting {
  id: string;
  lessonOrder: number;
  studentId: string | "group";
  /** Практика группового курса привязана к конкретной группе. */
  groupId: string | null;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  meetUrl: string;
  type: CourseType;
  status: MeetingStatus;
  /** Отмеченные преподавателем/куратором id учеников (attendance). */
  attended?: string[];
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface TestQuestion {
  id: string;
  text: string;
  type: QuestionType;
  order: number;
  options: QuestionOption[];
}

export interface LessonTest {
  id: string;
  lessonOrder: number;
  title: string;
  timeLimitSec: number;
  passingScore: number; // 0-100
  status: TestStatus;
  questions: TestQuestion[];
}

export interface TestAttempt {
  id: string;
  testId: string;
  lessonOrder: number;
  studentId: string;
  startedAt: string; // ISO datetime
  expiresAt: string; // ISO datetime
  submittedAt: string | null;
  answers: Record<string, string[]>; // questionId -> selected optionIds
  correctCount: number | null;
  totalQuestions: number;
  score: number | null; // 0-100
  passed: boolean | null;
  status: AttemptStatus;
}

export interface Note {
  id: string;
  studentId: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface Student {
  id: string;
  login: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  language: LanguageCode;
  type: CourseType;
  age: number | null;
  city: string;
  /** Группа (только для группового курса). Индивидуальный — null. */
  groupId: string | null;
  /** Преподаватель. У Individual назначается напрямую; у Group берётся из группы. */
  teacherId: string | null;
  startDate: string;
  endDate: string;
  status: AccessStatus;
  openedUpTo: number; // максимальный открытый урок (order)
  completed: number[]; // завершённые уроки
  completedAt: Record<number, string>; // order -> дата завершения (YYYY-MM-DD)
  watched: Record<number, number>; // order -> % просмотра видео (0-100)
  lastActivity: string;
  avatarTone: string;
  onboarded: boolean;
  managerName: string;
  payment: PaymentInfo;
}

const titles: [string, string, string][] = [
  ["Знакомство и алфавит", "Greetings, the alphabet and first phrases", "Foundation"],
  ["Verb to be", "Am / is / are в утверждении и отрицании", "Foundation"],
  ["Личные местоимения", "I, you, he, she, it, we, they", "Foundation"],
  ["Артикли a / an / the", "Когда нужен артикль и когда его нет", "Foundation"],
  ["Множественное число", "Regular and irregular plurals", "Foundation"],
  ["This / that / these / those", "Указательные местоимения в речи", "Foundation"],
  ["Числа и время", "Numbers, dates and telling the time", "Foundation"],
  ["Present Simple", "Ежедневные действия и расписание", "Grammar Core"],
  ["Present Simple: вопросы", "Do / does и порядок слов", "Grammar Core"],
  ["Наречия частотности", "Always, usually, sometimes, never", "Grammar Core"],
  ["Present Continuous", "Действия в момент речи", "Grammar Core"],
  ["Simple vs Continuous", "Разница между двумя временами", "Grammar Core"],
  ["Предлоги места", "In, on, at, under, between", "Grammar Core"],
  ["There is / there are", "Описание комнаты и города", "Grammar Core"],
  ["Модальный глагол can", "Способности и просьбы", "Grammar Core"],
  ["Past Simple: to be", "Was / were в рассказе о прошлом", "Past & Future"],
  ["Past Simple: правильные глаголы", "Окончание -ed и произношение", "Past & Future"],
  ["Present Perfect", "Опыт и результат в настоящем", "Past & Future"],
  ["Present Perfect vs Past Simple", "Когда какое время выбрать", "Past & Future"],
  ["Неправильные глаголы", "Топ-50 форм для разговора", "Past & Future"],
  ["Past Continuous", "Фон и длительное действие в прошлом", "Past & Future"],
  ["Future: will", "Решения, прогнозы и обещания", "Past & Future"],
  ["Future: going to", "Планы и намерения", "Past & Future"],
  ["Present для будущего", "Расписания и договорённости", "Past & Future"],
  ["Степени сравнения", "Comparatives and superlatives", "Vocabulary"],
  ["Countable / uncountable", "Some, any, much, many", "Vocabulary"],
  ["Еда и заказ в кафе", "Ordering food like a local", "Vocabulary"],
  ["Путешествия", "Airport, hotel, directions", "Vocabulary"],
  ["Работа и профессии", "Talking about your job", "Vocabulary"],
  ["Семья и отношения", "Describing people you love", "Vocabulary"],
  ["Внешность и характер", "Adjectives for people", "Vocabulary"],
  ["Дом и быт", "Household vocabulary", "Vocabulary"],
  ["Погода и природа", "Small talk about weather", "Vocabulary"],
  ["Шопинг", "Prices, sizes, returns", "Vocabulary"],
  ["Здоровье", "At the doctor's", "Vocabulary"],
  ["Модальные глаголы", "Must, should, have to", "Advanced Grammar"],
  ["Условные предложения 0 и 1", "Real conditionals", "Advanced Grammar"],
  ["Условные предложения 2", "Unreal present", "Advanced Grammar"],
  ["Пассивный залог", "Passive voice basics", "Advanced Grammar"],
  ["Косвенная речь", "Reported speech", "Advanced Grammar"],
  ["Герундий и инфинитив", "-ing or to do", "Advanced Grammar"],
  ["Фразовые глаголы", "Top 30 phrasal verbs", "Advanced Grammar"],
  ["Артикли: сложные случаи", "Geographical names and idioms", "Advanced Grammar"],
  ["Связки в речи", "Linking words for fluency", "Speaking"],
  ["Small talk", "Как начать и держать разговор", "Speaking"],
  ["Телефонный разговор", "Phone English", "Speaking"],
  ["Деловая переписка", "Emails that work", "Speaking"],
  ["Собеседование", "Job interview practice", "Speaking"],
  ["Презентация", "Presenting your idea", "Speaking"],
  ["Спор и аргументация", "Agreeing and disagreeing", "Speaking"],
  ["Идиомы", "Natural everyday idioms", "Speaking"],
  ["Произношение", "Sounds English learners miss", "Speaking"],
  ["Аудирование", "Understanding fast speech", "Speaking"],
  ["Финальный разбор", "Итоговая практика курса", "Speaking"],
];

export const LESSONS: Lesson[] = titles.map(([title, description, block], i) => ({
  id: `lesson-${i + 1}`,
  order: i + 1,
  title,
  description,
  block,
  videoUrl: "/Video%20Project%201.mp4",
  duration: `${10 + ((i * 7) % 12)}:${String((i * 13) % 60).padStart(2, "0")}`,
}));

export type CefrLevel = "A1" | "A2" | "B1" | "B2";

export interface CourseStage {
  block: string; // соответствует Lesson.block
  level: CefrLevel;
  month: number;
  title: string;
}

// Текущий блок программы отображается как этап роадмапа — это шаблон
// программы месяц-к-уровню, а не автоматическое определение уровня.
export const COURSE_STAGES: CourseStage[] = [
  { block: "Foundation", level: "A1", month: 1, title: "Foundation" },
  { block: "Grammar Core", level: "A2", month: 2, title: "Everyday Grammar" },
  { block: "Past & Future", level: "B1", month: 3, title: "Past & Future" },
  { block: "Vocabulary", level: "B1", month: 4, title: "Vocabulary & Life" },
  { block: "Advanced Grammar", level: "B2", month: 5, title: "Advanced Grammar" },
  { block: "Speaking", level: "B2", month: 6, title: "Speaking & Fluency" },
];

export const COURSE = {
  id: "course-en",
  name: "English",
  totalLessons: LESSONS.length,
  variants: [
    { type: "GROUP" as CourseType, duration: "6 месяцев", price: "15 000 сом" },
    { type: "INDIVIDUAL" as CourseType, duration: "1 месяц", price: "20 000 сом" },
  ],
};

/* ---------- языки ---------- */

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", nameRu: "Английский язык" },
  { code: "ru", name: "Russian", nameRu: "Русский язык" },
];

export function languageName(code: LanguageCode) {
  return LANGUAGES.find((l) => l.code === code)?.name ?? code;
}
export function languageNameRu(code: LanguageCode) {
  return LANGUAGES.find((l) => l.code === code)?.nameRu ?? code;
}

/* ---------- курсы (продукты) ---------- */

const DEFAULT_LEVEL_PLAN: { month: number; level: CefrLevel }[] = [
  { month: 1, level: "A1" },
  { month: 2, level: "A2" },
  { month: 3, level: "B1" },
  { month: 4, level: "B1" },
  { month: 5, level: "B2" },
  { month: 6, level: "B2" },
];

export const COURSE_PRODUCTS: CourseProduct[] = [
  {
    id: "en-group",
    language: "en",
    format: "GROUP",
    title: "English Group",
    durationMonths: 6,
    price: 15000,
    currency: "сом",
    features: ["Теория", "Тесты", "Повторение", "Групповая практика", "Преподаватель", "Google Meet"],
    levelPlan: DEFAULT_LEVEL_PLAN,
  },
  {
    id: "ru-group",
    language: "ru",
    format: "GROUP",
    title: "Russian Group",
    durationMonths: 6,
    price: 12000,
    currency: "сом",
    features: ["Теория", "Тесты", "Повторение", "Групповая практика", "Преподаватель", "Google Meet"],
    levelPlan: DEFAULT_LEVEL_PLAN,
  },
  {
    id: "en-individual",
    language: "en",
    format: "INDIVIDUAL",
    title: "English Individual",
    durationMonths: 1,
    price: 20000,
    currency: "сом",
    features: ["Индивидуальная практика с преподавателем", "Та же теория, что в English Group"],
    levelPlan: DEFAULT_LEVEL_PLAN,
  },
  {
    id: "ru-individual",
    language: "ru",
    format: "INDIVIDUAL",
    title: "Russian Individual",
    durationMonths: 1,
    price: 20000,
    currency: "сом",
    features: ["Индивидуальная практика с преподавателем", "Та же теория, что в Russian Group"],
    levelPlan: DEFAULT_LEVEL_PLAN,
  },
];

export function courseProduct(language: LanguageCode, format: CourseType) {
  return (
    COURSE_PRODUCTS.find((c) => c.language === language && c.format === format) ?? COURSE_PRODUCTS[0]!
  );
}

/* ---------- преподаватели ---------- */

export const TEACHERS: Teacher[] = [
  { id: "t1", name: "Айжан Осмонова", languages: ["en"], status: "active", phone: "+996 700 010 011", tone: "var(--tone-1)" },
  { id: "t2", name: "Бек Турдубеков", languages: ["en"], status: "active", phone: "+996 700 010 022", tone: "var(--tone-2)" },
  { id: "t3", name: "Азамат Кылычбеков", languages: ["en", "ru"], status: "replacement", phone: "+996 700 010 033", tone: "var(--tone-3)" },
  { id: "t4", name: "Динара Асанова", languages: ["ru"], status: "active", phone: "+996 700 010 044", tone: "var(--tone-4)" },
  { id: "t5", name: "Гульнара Садыкова", languages: ["ru"], status: "absent", phone: "+996 700 010 055", tone: "var(--tone-5)" },
  { id: "t6", name: "Мээрим Абдыраева", languages: ["en", "ru"], status: "active", phone: "+996 700 010 066", tone: "var(--tone-2)" },
];

/* ---------- группы ---------- */

export function groupCodePrefix(language: LanguageCode) {
  return language === "en" ? "EN" : "RU";
}

/** Следующий свободный код потока для языка: EN-01, EN-02, … */
export function nextGroupCode(groups: Group[], language: LanguageCode) {
  const prefix = groupCodePrefix(language);
  const used = groups
    .filter((g) => g.language === language)
    .map((g) => Number(g.code.split("-")[1]) || 0);
  const n = (used.length ? Math.max(...used) : 0) + 1;
  return `${prefix}-${String(n).padStart(2, "0")}`;
}

export function groupName(code: string, language: LanguageCode, startDate: string, time: string) {
  const d = new Date(startDate);
  const label = `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  return `${code} · ${languageNameRu(language)} · ${label} · ${time}`;
}

function endAfterMonths(startDate: string, months: number) {
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function makeGroup(
  id: string,
  language: LanguageCode,
  startDate: string,
  practiceStart: string,
  practiceEnd: string,
  teacherId: string | null,
  status: GroupStatus,
  currentLesson: number,
  meetUrl: string,
  maxStudents = 50,
): Omit<Group, "code" | "name"> {
  return {
    id,
    language,
    startDate,
    endDate: endAfterMonths(startDate, 6),
    practiceStart,
    practiceEnd,
    teacherId,
    maxStudents,
    status,
    currentLesson,
    meetUrl,
  };
}

/** Нумерует потоки по языку в порядке даты старта: EN-01, EN-02, … / RU-01, … */
function assignGroupCodes(rows: Omit<Group, "code" | "name">[]): Group[] {
  const counters: Record<string, number> = {};
  const codeById: Record<string, string> = {};
  for (const g of [...rows].sort((a, b) => a.startDate.localeCompare(b.startDate))) {
    const prefix = groupCodePrefix(g.language);
    counters[prefix] = (counters[prefix] ?? 0) + 1;
    codeById[g.id] = `${prefix}-${String(counters[prefix]).padStart(2, "0")}`;
  }
  return rows.map((g) => {
    const code = codeById[g.id]!;
    return { ...g, code, name: groupName(code, g.language, g.startDate, g.practiceStart) };
  });
}

export const GROUPS: Group[] = assignGroupCodes([
  makeGroup("g-en-0824", "en", "2026-08-18", "20:00", "21:00", "t1", "active", 4, "https://meet.google.com/eng-0818-grp"),
  makeGroup("g-en-0907", "en", "2026-09-07", "20:00", "21:00", "t2", "recruiting", 1, "https://meet.google.com/eng-0907-grp"),
  makeGroup("g-en-0914", "en", "2026-09-14", "21:00", "22:00", null, "recruiting", 1, ""),
  makeGroup("g-en-0921", "en", "2026-09-21", "21:00", "22:00", null, "recruiting", 1, "https://meet.google.com/eng-0921-grp"),
  makeGroup("g-ru-0824", "ru", "2026-08-18", "20:00", "21:00", "t4", "active", 4, "https://meet.google.com/rus-0818-grp"),
  makeGroup("g-ru-0907", "ru", "2026-09-07", "20:00", "21:00", "t5", "recruiting", 1, ""),
  makeGroup("g-ru-0914", "ru", "2026-09-14", "21:00", "22:00", null, "recruiting", 1, "https://meet.google.com/rus-0914-grp"),
  makeGroup("g-en-0518", "en", "2026-05-10", "21:00", "22:00", "t1", "finished", 54, "https://meet.google.com/eng-old-grp"),
]);

/* ---------- ученики ---------- */

function payment(total: number, paid: number, purchaseDate: string): PaymentInfo {
  return {
    totalCost: total,
    paid,
    purchaseDate,
    status: paid >= total ? "full" : paid > 0 ? "partial" : "unpaid",
  };
}

const CITIES = ["Бишкек", "Ош", "Джалал-Абад", "Каракол", "Токмок", "Нарын", "Талас", "Баткен"];
const FIRST_NAMES = ["Айгерим", "Нурбек", "Азиз", "Салтанат", "Тимур", "Жамиля", "Эрлан", "Гулназ", "Максат", "Асель", "Бакыт", "Динара", "Руслан", "Чолпон", "Данияр", "Айпери", "Кубат", "Мээрим", "Улан", "Назгуль"];
const LAST_NAMES = ["Абдиев", "Токтосунова", "Мамытов", "Исакова", "Орозов", "Бекова", "Сыдыков", "Алиева", "Жумабаев", "Турсунова", "Касымов", "Эргешова", "Досов", "Бейшеналиева", "Уметалиев", "Кадырова"];

const HAND_STUDENTS: Student[] = [
  {
    id: "s1", login: "kanat", password: "test123", firstName: "Канат", lastName: "Уметов",
    phone: "+996 700 112 233", language: "en", type: "GROUP", age: 27, city: "Бишкек",
    groupId: "g-en-0824", teacherId: "t1", startDate: "2026-08-18", endDate: "2027-02-18",
    status: "active", openedUpTo: 4, completed: [1, 2], completedAt: { 1: "2026-08-18", 2: "2026-08-20" },
    watched: { 3: 40 }, lastActivity: "2026-08-18", avatarTone: "var(--tone-1)", onboarded: true,
    managerName: "Нурбол", payment: payment(15000, 15000, "2026-08-10"),
  },
  {
    id: "s2", login: "alina", password: "test123", firstName: "Алина", lastName: "Ким",
    phone: "+996 555 908 771", language: "en", type: "GROUP", age: 24, city: "Бишкек",
    groupId: "g-en-0824", teacherId: "t1", startDate: "2026-08-18", endDate: "2027-02-18",
    status: "active", openedUpTo: 4, completed: [1, 2, 3], completedAt: { 1: "2026-08-18", 2: "2026-08-19", 3: "2026-08-21" },
    watched: {}, lastActivity: "2026-08-17", avatarTone: "var(--tone-2)", onboarded: true,
    managerName: "Нурбол", payment: payment(15000, 7500, "2026-08-11"),
  },
  {
    id: "s3", login: "aibek", password: "test123", firstName: "Айбек", lastName: "Сатыбалдиев",
    phone: "+996 707 445 010", language: "en", type: "INDIVIDUAL", age: 31, city: "Ош",
    groupId: null, teacherId: "t2", startDate: "2026-08-05", endDate: "2026-09-05",
    status: "active", openedUpTo: 7, completed: [1, 2, 3, 4, 5, 6], completedAt: { 1: "2026-08-05" },
    watched: { 7: 60 }, lastActivity: "2026-08-18", avatarTone: "var(--tone-3)", onboarded: true,
    managerName: "Нурбол", payment: payment(20000, 20000, "2026-08-01"),
  },
  {
    id: "s4", login: "nurai", password: "test123", firstName: "Нурай", lastName: "Асанова",
    phone: "+996 559 220 118", language: "en", type: "GROUP", age: 29, city: "Каракол",
    groupId: "g-en-0518", teacherId: "t1", startDate: "2026-05-10", endDate: "2026-11-10",
    status: "expired", openedUpTo: 54, completed: Array.from({ length: 40 }, (_, i) => i + 1),
    completedAt: {}, watched: {}, lastActivity: "2026-08-09", avatarTone: "var(--tone-4)", onboarded: true,
    managerName: "Азамат", payment: payment(15000, 15000, "2026-05-02"),
  },
  {
    id: "s5", login: "elmira", password: "test123", firstName: "Эльмира", lastName: "Джолдошева",
    phone: "+996 700 330 447", language: "ru", type: "INDIVIDUAL", age: 22, city: "Джалал-Абад",
    groupId: null, teacherId: "t4", startDate: "2026-08-12", endDate: "2026-09-12",
    status: "disabled", openedUpTo: 1, completed: [], completedAt: {}, watched: {},
    lastActivity: "2026-08-14", avatarTone: "var(--tone-5)", onboarded: false,
    managerName: "Нурбол", payment: payment(20000, 5000, "2026-08-12"),
  },
];

const TONES = ["var(--tone-1)", "var(--tone-2)", "var(--tone-3)", "var(--tone-4)", "var(--tone-5)"];

function generateStudents(count: number): Student[] {
  const recruitingGroups = GROUPS.filter((g) => g.status === "recruiting" || g.status === "active");
  const out: Student[] = [];
  for (let i = 0; i < count; i++) {
    const n = i + 6;
    const language: LanguageCode = i % 3 === 0 ? "ru" : "en";
    const isIndividual = i % 7 === 0;
    const type: CourseType = isIndividual ? "INDIVIDUAL" : "GROUP";
    const product = courseProduct(language, type);
    const pool = recruitingGroups.filter((g) => g.language === language);
    const group = !isIndividual && pool.length ? pool[i % pool.length]! : null;
    const startDate = group ? group.startDate : "2026-08-20";
    const openedUpTo = group ? group.currentLesson : 1 + (i % 6);
    const completedCount = Math.max(0, Math.min(openedUpTo - 1, (i * 3) % (openedUpTo + 1)));
    const status: AccessStatus = i % 13 === 0 ? "expired" : i % 17 === 0 ? "disabled" : "active";
    const lastActivity =
      i % 5 === 0 ? "2026-08-12" : i % 3 === 0 ? "2026-08-16" : i % 2 === 0 ? "2026-08-17" : "2026-08-18";
    const teacherId = isIndividual
      ? (TEACHERS.filter((t) => t.languages.includes(language))[i % 2]?.id ?? null)
      : (group?.teacherId ?? null);
    const paid = i % 4 === 0 ? Math.round(product.price * 0.3) : product.price;
    out.push({
      id: `s${n}`,
      login: `student${n}`,
      password: "test123",
      firstName: FIRST_NAMES[i % FIRST_NAMES.length]!,
      lastName: LAST_NAMES[i % LAST_NAMES.length]!,
      phone: `+996 ${500 + (i % 99)} ${100 + (i % 800)} ${100 + (i % 800)}`,
      language,
      type,
      age: 18 + (i % 30),
      city: CITIES[i % CITIES.length]!,
      groupId: group?.id ?? null,
      teacherId,
      startDate,
      endDate: endAfterMonths(startDate, product.durationMonths),
      status,
      openedUpTo,
      completed: Array.from({ length: completedCount }, (_, k) => k + 1),
      completedAt: {},
      watched: completedCount < openedUpTo ? { [openedUpTo]: (i * 17) % 100 } : {},
      lastActivity,
      avatarTone: TONES[i % TONES.length]!,
      onboarded: i % 6 !== 0,
      managerName: ["Нурбол", "Азамат", "Салима"][i % 3]!,
      payment: payment(product.price, paid, startDate),
    });
  }
  return out;
}

export const STUDENTS: Student[] = [...HAND_STUDENTS, ...generateStudents(46)];

export const CURATOR = {
  id: "c1",
  login: "curator",
  password: "test123",
  name: "Мээрим Абдыраева",
  role: "curator" as Role,
};

export const MEETINGS: Meeting[] = [
  {
    id: "m1",
    lessonOrder: 4,
    studentId: "group",
    groupId: "g-en-0824",
    title: "Практика: Артикли a / an / the",
    date: "2026-08-19",
    startTime: "20:00",
    endTime: "21:00",
    meetUrl: "https://meet.google.com/eng-0818-grp",
    type: "GROUP",
    status: "scheduled",
  },
  {
    id: "m2",
    lessonOrder: 5,
    studentId: "group",
    groupId: "g-en-0824",
    title: "Практика: Множественное число",
    date: "2026-08-21",
    startTime: "20:00",
    endTime: "21:00",
    meetUrl: "https://meet.google.com/eng-0818-grp",
    type: "GROUP",
    status: "scheduled",
  },
  {
    id: "m3",
    lessonOrder: 3,
    studentId: "group",
    groupId: "g-en-0824",
    title: "Практика: Личные местоимения",
    date: "2026-08-17",
    startTime: "20:00",
    endTime: "21:00",
    meetUrl: "https://meet.google.com/eng-0818-grp",
    type: "GROUP",
    status: "completed",
    attended: ["s1", "s2"],
  },
  {
    id: "m4",
    lessonOrder: 4,
    studentId: "group",
    groupId: "g-ru-0824",
    title: "Практика: Русский · Lesson 4",
    date: "2026-08-19",
    startTime: "20:00",
    endTime: "21:00",
    meetUrl: "https://meet.google.com/rus-0818-grp",
    type: "GROUP",
    status: "scheduled",
  },
  {
    id: "m5",
    lessonOrder: 7,
    studentId: "s3",
    groupId: null,
    title: "Индивидуальная практика: Числа и время",
    date: "2026-08-19",
    startTime: "19:00",
    endTime: "20:00",
    meetUrl: "https://meet.google.com/ind-aibek-01",
    type: "INDIVIDUAL",
    status: "scheduled",
  },
];

export const NOTES: Note[] = [
  {
    id: "n1",
    studentId: "s1",
    author: "Мээрим Абдыраева",
    content:
      "Ученик хорошо понимает теорию, но испытывает сложности с разговорной речью. Обратить внимание на Past Simple, vocabulary и уверенность в speaking.",
    createdAt: "2026-08-16",
  },
  {
    id: "n2",
    studentId: "s3",
    author: "Мээрим Абдыраева",
    content: "Очень мотивирован, просит больше домашней практики. Можно ускорить темп.",
    createdAt: "2026-08-14",
  },
];

function makeQuestion(
  order: number,
  text: string,
  correctIndex: number,
  options: string[],
): TestQuestion {
  return {
    id: `l1q${order}`,
    text,
    type: "single",
    order,
    options: options.map((o, i) => ({
      id: `l1q${order}o${i + 1}`,
      text: o,
      isCorrect: i === correctIndex,
    })),
  };
}

export const TESTS: LessonTest[] = [
  {
    id: "test-1",
    lessonOrder: 1,
    title: "Тест к уроку 1",
    timeLimitSec: 300,
    passingScore: 70,
    status: "published",
    questions: [
      makeQuestion(1, "What is your name?", 0, [
        "My name is Anna.",
        "I name Anna.",
        "Me is Anna.",
        "My names Anna.",
      ]),
      makeQuestion(2, "How are you?", 0, [
        "Fine, thank you.",
        "I'm 20 years.",
        "I am from Bishkek.",
        "My name is Kanat.",
      ]),
      makeQuestion(3, "Choose the correct greeting for the morning.", 1, [
        "Good night",
        "Good morning",
        "Good evening",
        "Goodbye",
      ]),
      makeQuestion(4, 'Which letter comes after "D" in the English alphabet?', 2, [
        "C",
        "F",
        "E",
        "B",
      ]),
      makeQuestion(5, '"___ you later" — choose the correct word.', 3, [
        "Hello",
        "Please",
        "Sorry",
        "See",
      ]),
      makeQuestion(6, 'Choose the correct response to "Nice to meet you".', 0, [
        "Nice to meet you too.",
        "You are welcome.",
        "I'm sorry.",
        "Good luck.",
      ]),
      makeQuestion(7, "Which word is a polite way to say goodbye?", 1, [
        "Hi",
        "Bye",
        "What",
        "Yes",
      ]),
      makeQuestion(8, 'Complete: "Thank you very ___."', 2, ["good", "well", "much", "nice"]),
    ],
  },
];

export const TEST_ATTEMPTS: TestAttempt[] = [];

export const TODAY = "2026-08-18";
