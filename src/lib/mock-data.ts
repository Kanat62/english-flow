// Тестовые данные платформы (без бэкенда).

export type Role = "student" | "curator";
export type CourseType = "GROUP" | "INDIVIDUAL";
export type AccessStatus = "active" | "expired" | "disabled";
export type LessonState = "locked" | "available" | "completed";
export type ProgressStatus = "not_started" | "in_progress" | "completed";
export type MeetingStatus = "scheduled" | "completed" | "cancelled";

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
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  meetUrl: string;
  type: CourseType;
  status: MeetingStatus;
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
  type: CourseType;
  startDate: string;
  endDate: string;
  status: AccessStatus;
  openedUpTo: number; // максимальный открытый урок (order)
  completed: number[]; // завершённые уроки
  watched: Record<number, number>; // order -> % просмотра видео (0-100)
  lastActivity: string;
  avatarTone: string;
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

export const COURSE = {
  id: "course-en",
  name: "English",
  totalLessons: LESSONS.length,
  variants: [
    { type: "GROUP" as CourseType, duration: "3 месяца", price: "10 000 сом" },
    { type: "INDIVIDUAL" as CourseType, duration: "1 месяц", price: "25 000 сом" },
  ],
};

export const STUDENTS: Student[] = [
  {
    id: "s1",
    login: "kanat",
    password: "test123",
    firstName: "Канат",
    lastName: "Уметов",
    phone: "+996 700 112 233",
    type: "GROUP",
    startDate: "2026-08-18",
    endDate: "2026-11-18",
    status: "active",
    openedUpTo: 1,
    completed: [],
    watched: {},
    lastActivity: "2026-08-18",
    avatarTone: "var(--tone-1)",
  },
  {
    id: "s2",
    login: "alina",
    password: "test123",
    firstName: "Алина",
    lastName: "Ким",
    phone: "+996 555 908 771",
    type: "GROUP",
    startDate: "2026-08-18",
    endDate: "2026-11-18",
    status: "active",
    openedUpTo: 1,
    completed: [],
    watched: {},
    lastActivity: "2026-08-17",
    avatarTone: "var(--tone-2)",
  },
  {
    id: "s3",
    login: "aibek",
    password: "test123",
    firstName: "Айбек",
    lastName: "Сатыбалдиев",
    phone: "+996 707 445 010",
    type: "INDIVIDUAL",
    startDate: "2026-08-05",
    endDate: "2026-09-05",
    status: "active",
    openedUpTo: 1,
    completed: [],
    watched: {},
    lastActivity: "2026-08-18",
    avatarTone: "var(--tone-3)",
  },
  {
    id: "s4",
    login: "nurai",
    password: "test123",
    firstName: "Нурай",
    lastName: "Асанова",
    phone: "+996 559 220 118",
    type: "GROUP",
    startDate: "2026-05-10",
    endDate: "2026-08-10",
    status: "expired",
    openedUpTo: 1,
    completed: [],
    watched: {},
    lastActivity: "2026-08-09",
    avatarTone: "var(--tone-4)",
  },
  {
    id: "s5",
    login: "elmira",
    password: "test123",
    firstName: "Эльмира",
    lastName: "Джолдошева",
    phone: "+996 700 330 447",
    type: "INDIVIDUAL",
    startDate: "2026-08-12",
    endDate: "2026-09-12",
    status: "disabled",
    openedUpTo: 1,
    completed: [],
    watched: {},
    lastActivity: "2026-08-14",
    avatarTone: "var(--tone-5)",
  },
];

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
    lessonOrder: 18,
    studentId: "group",
    title: "Практика: Present Perfect",
    date: "2026-08-19",
    startTime: "21:00",
    endTime: "22:00",
    meetUrl: "https://meet.google.com/abc-defg-hij",
    type: "GROUP",
    status: "scheduled",
  },
  {
    id: "m2",
    lessonOrder: 19,
    studentId: "group",
    title: "Практика: Present Perfect vs Past Simple",
    date: "2026-08-21",
    startTime: "21:00",
    endTime: "22:00",
    meetUrl: "https://meet.google.com/xyz-qwer-tyu",
    type: "GROUP",
    status: "scheduled",
  },
  {
    id: "m3",
    lessonOrder: 17,
    studentId: "group",
    title: "Практика: Past Simple",
    date: "2026-08-17",
    startTime: "21:00",
    endTime: "22:00",
    meetUrl: "https://meet.google.com/old-past-smp",
    type: "GROUP",
    status: "completed",
  },
  {
    id: "m4",
    lessonOrder: 8,
    studentId: "s3",
    title: "Индивидуальная практика: Present Simple",
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

export const TODAY = "2026-08-18";
