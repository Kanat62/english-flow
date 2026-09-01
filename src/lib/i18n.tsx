// Translation layer. Все UI-строки живут здесь, а не в компонентах.
// Interface language отделён от learning language.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type UiLocale = "ru" | "en" | "ky";

export const UI_LOCALES: { code: UiLocale; label: string }[] = [
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
  { code: "ky", label: "Кыргызча" },
];

type Dict = Record<string, string>;

const ru: Dict = {
  "nav.home": "Главная",
  "nav.learn": "Учиться",
  "nav.practice": "Практика",
  "nav.journey": "Мой путь",
  "nav.profile": "Профиль",
  "nav.logout": "Выйти",

  "common.continue": "Продолжить",
  "common.back": "Назад",
  "common.start": "Начать",
  "common.open": "Открыть",
  "common.completed": "Завершено",
  "common.current": "Сейчас",
  "common.locked": "Закрыто",
  "common.today": "Сегодня",
  "common.tomorrow": "Завтра",
  "common.min": "мин",
  "common.of": "из",
  "common.tryAgain": "Попробовать снова",
  "common.loading": "Загружаем вашу среду обучения…",
  "common.error": "Что-то пошло не так.",
  "common.lockedHint": "Этот урок пока недоступен.",
  "common.words": "слов",
  "common.language": "Язык интерфейса",

  "home.greeting.morning": "Доброе утро",
  "home.greeting.day": "Добрый день",
  "home.greeting.evening": "Добрый вечер",
  "home.journey": "Ваш путь",
  "home.youAreHere": "вы здесь",
  "home.continue": "Продолжить",
  "home.today": "Сегодня",
  "home.upNext": "Дальше",
  "home.nextPractice": "Ближайшая практика",
  "home.viewPractice": "К практике",
  "home.doneForToday": "На сегодня всё.",
  "home.doneHint": "Следующий урок появится, когда куратор его откроет.",
  "home.reviewWords": "слов готовы к повторению",
  "home.action.continueLesson": "Продолжить урок",
  "home.action.takeQuiz": "Пройдите быструю проверку",
  "home.action.reviewWords": "Повторите слова",
  "home.action.preparePractice": "Практика скоро начнётся",
  "home.action.wait": "Вы всё выполнили",

  "learn.title": "Ваш путь",
  "learn.levels": "Уровни",
  "learn.currentChapter": "Текущая глава",
  "learn.fullMap": "Полная карта",
  "learn.hideMap": "Свернуть карту",
  "learn.topics": "тем",
  "learn.chapter": "Глава",
  "learn.level": "Уровень",

  "topic.lessons": "Активности",
  "topic.keyWords": "Ключевые слова",
  "topic.practiceWords": "Тренировать слова",
  "topic.whatYouLearn": "Чему вы научитесь",
  "topic.afterLesson": "После урока",

  "activity.video": "Видео",
  "activity.quiz": "Быстрая проверка",
  "activity.flashcards": "Слова",
  "activity.practice": "Практика",
  "activity.reading": "Чтение",
  "activity.listening": "Аудирование",
  "activity.speaking": "Говорение",

  "lesson.markComplete": "Отметить пройденным",
  "lesson.next": "Дальше",
  "lesson.nextQuiz": "Пройти быструю проверку",
  "lesson.nextWords": "Тренировать слова",
  "lesson.nextTopic": "Следующая тема",
  "lesson.theory": "Теория",

  "quiz.title": "Быстрая проверка",
  "quiz.questions": "вопросов",
  "quiz.minutes": "минут",
  "quiz.great": "Отличная работа.",
  "quiz.understood": "Вы поняли большую часть темы.",

  "words.title": "Тренировка слов",
  "words.remember": "Помните это слово?",
  "words.yes": "Да",
  "words.again": "Повторить",
  "words.done": "Готово на сегодня",
  "words.progress": "Слово",

  "practice.title": "Практика",
  "practice.next": "Ваша ближайшая практика",
  "practice.join": "Подключиться",
  "practice.joinAt": "Подключиться в",
  "practice.startsSoon": "Практика скоро начнётся",
  "practice.prepare": "Подготовьтесь",
  "practice.prepare1": "Повторите слова темы",
  "practice.prepare2": "Придумайте 3 примера из своей жизни",
  "practice.topic": "Тема",
  "practice.teacher": "Преподаватель",
  "practice.group": "Групповая практика",
  "practice.individual": "Индивидуальная сессия",
  "practice.history": "История практик",
  "practice.attended": "Посещено",
  "practice.missed": "Пропущено",
  "practice.empty": "Практика пока не назначена.",
  "practice.completed": "Практика завершена",
  "practice.youPracticed": "Вы практиковали",
  "practice.reviewTopic": "Повторить тему",
  "practice.schedule": "Расписание",

  "journey.title": "Мой путь",
  "journey.goal": "Ваша цель",
  "journey.target": "Цель",
  "journey.currentLevel": "Текущий уровень",
  "journey.youAreHere": "Вы находитесь здесь.",
  "journey.learning": "Обучение",
  "journey.lessons": "Уроки",
  "journey.tests": "Тесты",
  "journey.vocabulary": "Словарь",
  "journey.practice": "Практики",
  "journey.sessions": "сессий",

  "profile.account": "Аккаунт",
  "profile.security": "Безопасность",
  "profile.access": "Доступ",
  "profile.courseGroup": "Группа",
  "profile.courseIndividual": "Индивидуально",
  "profile.interfaceLanguage": "Язык интерфейса",
  "profile.learningLanguage": "Язык обучения",
};

const en: Dict = {
  "nav.home": "Home",
  "nav.learn": "Learn",
  "nav.practice": "Practice",
  "nav.journey": "My Journey",
  "nav.profile": "Profile",
  "nav.logout": "Log out",

  "common.continue": "Continue",
  "common.back": "Back",
  "common.start": "Start",
  "common.open": "Open",
  "common.completed": "Completed",
  "common.current": "Current",
  "common.locked": "Locked",
  "common.today": "Today",
  "common.tomorrow": "Tomorrow",
  "common.min": "min",
  "common.of": "of",
  "common.tryAgain": "Try again",
  "common.loading": "Loading your learning space…",
  "common.error": "Something went wrong.",
  "common.lockedHint": "This lesson isn't available yet.",
  "common.words": "words",
  "common.language": "Interface language",

  "home.greeting.morning": "Good morning",
  "home.greeting.day": "Good afternoon",
  "home.greeting.evening": "Good evening",
  "home.journey": "Your journey",
  "home.youAreHere": "you are here",
  "home.continue": "Continue",
  "home.today": "Today",
  "home.upNext": "Up next",
  "home.nextPractice": "Next practice",
  "home.viewPractice": "View practice",
  "home.doneForToday": "You're done for today.",
  "home.doneHint": "The next lesson appears when your curator opens it.",
  "home.reviewWords": "words are ready for review",
  "home.action.continueLesson": "Continue your lesson",
  "home.action.takeQuiz": "Complete your quick check",
  "home.action.reviewWords": "Review your words",
  "home.action.preparePractice": "Your practice starts soon",
  "home.action.wait": "Everything is done",

  "learn.title": "Your journey",
  "learn.levels": "Levels",
  "learn.currentChapter": "Current chapter",
  "learn.fullMap": "Full map",
  "learn.hideMap": "Hide map",
  "learn.topics": "topics",
  "learn.chapter": "Chapter",
  "learn.level": "Level",

  "topic.lessons": "Activities",
  "topic.keyWords": "Key words",
  "topic.practiceWords": "Practice words",
  "topic.whatYouLearn": "What you'll learn",
  "topic.afterLesson": "After this lesson",

  "activity.video": "Video",
  "activity.quiz": "Quick check",
  "activity.flashcards": "Vocabulary",
  "activity.practice": "Practice",
  "activity.reading": "Reading",
  "activity.listening": "Listening",
  "activity.speaking": "Speaking",

  "lesson.markComplete": "Mark as complete",
  "lesson.next": "Next",
  "lesson.nextQuiz": "Take the quick check",
  "lesson.nextWords": "Practice the words",
  "lesson.nextTopic": "Next topic",
  "lesson.theory": "Theory",

  "quiz.title": "Quick check",
  "quiz.questions": "questions",
  "quiz.minutes": "minutes",
  "quiz.great": "Great work.",
  "quiz.understood": "You understood most of the topic.",

  "words.title": "Vocabulary practice",
  "words.remember": "Do you remember this word?",
  "words.yes": "Yes",
  "words.again": "Review again",
  "words.done": "Done for today",
  "words.progress": "Word",

  "practice.title": "Practice",
  "practice.next": "Your next session",
  "practice.join": "Join practice",
  "practice.joinAt": "Join at",
  "practice.startsSoon": "Your practice starts soon",
  "practice.prepare": "Prepare",
  "practice.prepare1": "Review the topic words",
  "practice.prepare2": "Think about 3 things from your life",
  "practice.topic": "Topic",
  "practice.teacher": "Teacher",
  "practice.group": "Group practice",
  "practice.individual": "Individual session",
  "practice.history": "Practice history",
  "practice.attended": "Attended",
  "practice.missed": "Missed",
  "practice.empty": "No practice scheduled yet.",
  "practice.completed": "Practice completed",
  "practice.youPracticed": "You practiced",
  "practice.reviewTopic": "Review today's topic",
  "practice.schedule": "Schedule",

  "journey.title": "My Journey",
  "journey.goal": "Your goal",
  "journey.target": "Target",
  "journey.currentLevel": "Current level",
  "journey.youAreHere": "You're currently here.",
  "journey.learning": "Learning",
  "journey.lessons": "Lessons",
  "journey.tests": "Tests",
  "journey.vocabulary": "Vocabulary",
  "journey.practice": "Practice",
  "journey.sessions": "sessions",

  "profile.account": "Account",
  "profile.security": "Security",
  "profile.access": "Access",
  "profile.courseGroup": "Group",
  "profile.courseIndividual": "Individual",
  "profile.interfaceLanguage": "Interface language",
  "profile.learningLanguage": "Learning language",
};

const ky: Dict = {
  ...en,
  "nav.home": "Башкы",
  "nav.learn": "Үйрөнүү",
  "nav.practice": "Практика",
  "nav.journey": "Менин жолум",
  "nav.profile": "Профиль",
  "nav.logout": "Чыгуу",
  "common.continue": "Улантуу",
  "home.greeting.morning": "Кайырлуу таң",
  "home.greeting.day": "Кайырлуу күн",
  "home.greeting.evening": "Кайырлуу кеч",
};

const DICTS: Record<UiLocale, Dict> = { ru, en, ky };

interface I18nCtx {
  locale: UiLocale;
  setLocale: (l: UiLocale) => void;
  t: (key: string) => string;
}

const Ctx = createContext<I18nCtx | null>(null);
const KEY = "sozmor-ui-locale";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<UiLocale>("ru");

  useEffect(() => {
    const saved = localStorage.getItem(KEY) as UiLocale | null;
    if (saved && DICTS[saved]) setLocaleState(saved);
  }, []);

  const setLocale = useCallback((l: UiLocale) => {
    setLocaleState(l);
    localStorage.setItem(KEY, l);
  }, []);

  const t = useCallback((key: string) => DICTS[locale][key] ?? DICTS.en[key] ?? key, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export function useT() {
  return useI18n().t;
}
