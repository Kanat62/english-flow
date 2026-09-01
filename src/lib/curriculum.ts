// Content architecture:
// Language -> Course -> Level -> Chapter -> Topic -> Activity
// Строится поверх плоского списка уроков (mock backend), но не зависит от него жёстко.

import { LESSONS, type Lesson } from "./mock-data";

export type ActivityKind =
  | "video"
  | "quiz"
  | "flashcards"
  | "reading"
  | "listening"
  | "speaking"
  | "practice";

export type LevelCode = "A1" | "A2" | "B1" | "B2";

export interface VocabWord {
  id: string;
  term: string;
  translation: string;
  example: string;
}

export interface Activity {
  id: string;
  kind: ActivityKind;
  titleKey: string;
  /** ссылка на сущность mock-бэкенда */
  lessonOrder: number;
}

export interface Topic {
  id: string;
  slug: string;
  order: number;
  title: string;
  subtitle: string;
  lessonOrder: number;
  chapterId: string;
  levelCode: LevelCode;
  duration: string;
  activities: Activity[];
  words: VocabWord[];
  outcomes: string[];
}

export interface Chapter {
  id: string;
  order: number;
  title: string;
  levelCode: LevelCode;
  topics: Topic[];
}

export interface Level {
  code: LevelCode;
  title: string;
  tagline: string;
  chapters: Chapter[];
  topics: Topic[];
}

export interface Course {
  id: string;
  languageCode: string;
  language: string;
  title: string;
  goal: string;
  targetLevel: string;
  levels: Level[];
}

const LEVEL_PLAN: {
  code: LevelCode;
  title: string;
  tagline: string;
  from: number;
  to: number;
  chapters: string[];
}[] = [
  {
    code: "A1",
    title: "Foundations",
    tagline: "Первые фразы и уверенный старт",
    from: 1,
    to: 15,
    chapters: ["Первые шаги", "Люди и вещи", "Настоящее время", "Мир вокруг"],
  },
  {
    code: "A2",
    title: "Everyday English",
    tagline: "Прошлое, будущее и бытовые ситуации",
    from: 16,
    to: 24,
    chapters: ["Рассказ о прошлом", "Опыт и результат", "Планы и будущее"],
  },
  {
    code: "B1",
    title: "Confident Communication",
    tagline: "Свободные разговоры на любые темы",
    from: 25,
    to: 35,
    chapters: ["Сравнения и количество", "Жизнь и путешествия", "Люди и здоровье"],
  },
  {
    code: "B2",
    title: "Fluent Communication",
    tagline: "Точность, нюансы и живая речь",
    from: 36,
    to: 54,
    chapters: ["Сложная грамматика", "Естественная речь", "Работа и презентации", "Финальный этап"],
  },
];

const WORD_BANK: [string, string, string][] = [
  ["usually", "обычно", "I usually wake up at 7."],
  ["weekend", "выходные", "We meet every weekend."],
  ["morning", "утро", "Good morning, everyone."],
  ["travel", "путешествовать", "I travel twice a year."],
  ["improve", "улучшать", "I want to improve my speaking."],
  ["decide", "решать", "We decided to start today."],
  ["remember", "помнить", "I remember this word now."],
  ["explain", "объяснять", "Can you explain it again?"],
  ["choose", "выбирать", "Choose the correct answer."],
  ["arrive", "прибывать", "The train arrives at six."],
  ["enough", "достаточно", "I have enough time."],
  ["although", "хотя", "Although it's hard, I like it."],
  ["nearly", "почти", "It's nearly finished."],
  ["suggest", "предлагать", "I suggest we practice more."],
  ["available", "доступный", "The lesson is available now."],
  ["confident", "уверенный", "I feel confident speaking."],
  ["describe", "описывать", "Describe your daily routine."],
  ["prepare", "готовиться", "Prepare three questions."],
];

const OUTCOME_BANK = [
  "Понимать тему на слух",
  "Использовать конструкцию в речи",
  "Составлять свои примеры",
  "Задавать вопросы по теме",
  "Рассказывать о себе",
];

function slugify(order: number, title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/gi, "-")
    .replace(/^-|-$/g, "");
  return `${order}-${base || "topic"}`;
}

function wordsFor(order: number): VocabWord[] {
  return Array.from({ length: 6 }, (_, i) => {
    const [term, translation, example] = WORD_BANK[(order * 5 + i * 3) % WORD_BANK.length];
    return { id: `w-${order}-${i}`, term, translation, example };
  });
}

function activitiesFor(order: number): Activity[] {
  return [
    { id: `a-${order}-video`, kind: "video", titleKey: "activity.video", lessonOrder: order },
    { id: `a-${order}-quiz`, kind: "quiz", titleKey: "activity.quiz", lessonOrder: order },
    {
      id: `a-${order}-words`,
      kind: "flashcards",
      titleKey: "activity.flashcards",
      lessonOrder: order,
    },
    {
      id: `a-${order}-practice`,
      kind: "practice",
      titleKey: "activity.practice",
      lessonOrder: order,
    },
  ];
}

function buildTopic(lesson: Lesson, chapterId: string, levelCode: LevelCode, order: number): Topic {
  return {
    id: `topic-${lesson.order}`,
    slug: slugify(lesson.order, lesson.title),
    order,
    title: lesson.title,
    subtitle: lesson.description,
    lessonOrder: lesson.order,
    chapterId,
    levelCode,
    duration: lesson.duration,
    activities: activitiesFor(lesson.order),
    words: wordsFor(lesson.order),
    outcomes: OUTCOME_BANK.slice(0, 3 + (lesson.order % 2)),
  };
}

function buildCourse(lessons: Lesson[]): Course {
  const levels: Level[] = LEVEL_PLAN.map((plan) => {
    const inLevel = lessons.filter((l) => l.order >= plan.from && l.order <= plan.to);
    const perChapter = Math.ceil(inLevel.length / plan.chapters.length);
    const chapters: Chapter[] = plan.chapters.map((title, ci) => {
      const id = `${plan.code}-c${ci + 1}`;
      const slice = inLevel.slice(ci * perChapter, (ci + 1) * perChapter);
      return {
        id,
        order: ci + 1,
        title,
        levelCode: plan.code,
        topics: slice.map((l, i) => buildTopic(l, id, plan.code, i + 1)),
      };
    });
    return {
      code: plan.code,
      title: plan.title,
      tagline: plan.tagline,
      chapters,
      topics: chapters.flatMap((c) => c.topics),
    };
  });

  return {
    id: "course-en",
    languageCode: "en",
    language: "English",
    title: "English Journey",
    goal: "Speak English confidently",
    targetLevel: "B1 / B2",
    levels,
  };
}

export const COURSE_TREE: Course = buildCourse(LESSONS);

export const ALL_TOPICS: Topic[] = COURSE_TREE.levels.flatMap((l) => l.topics);

export function topicByLesson(order: number): Topic | undefined {
  return ALL_TOPICS.find((t) => t.lessonOrder === order);
}

export function topicBySlug(slug: string): Topic | undefined {
  return ALL_TOPICS.find((t) => t.slug === slug);
}

export function chapterOf(topic: Topic): Chapter | undefined {
  return COURSE_TREE.levels.flatMap((l) => l.chapters).find((c) => c.id === topic.chapterId);
}

export function levelOf(code: LevelCode): Level {
  return COURSE_TREE.levels.find((l) => l.code === code)!;
}

export const LEVEL_CODES: LevelCode[] = ["A1", "A2", "B1", "B2"];
