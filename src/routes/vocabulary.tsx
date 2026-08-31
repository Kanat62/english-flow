import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, CheckCircle2, RotateCcw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { currentLessonOrder, dueVocab, useApp, vocabStats } from "@/lib/store";
import type { VocabWord } from "@/lib/mock-data";
import { StudentShell } from "@/components/StudentShell";
import { EmptyState } from "@/components/shared";

export const Route = createFileRoute("/vocabulary")({
  head: () => ({
    meta: [
      { title: "Слова — Sozmor" },
      { name: "description", content: "Карточки для повторения слов из пройденных уроков." },
    ],
  }),
  component: () => (
    <StudentShell>
      <VocabularyPage />
    </StudentShell>
  ),
});

function VocabularyPage() {
  const { currentStudent, setWordKnown } = useApp();
  const student = currentStudent!;
  const stats = vocabStats(student);
  const current = currentLessonOrder(student);

  // Frozen at session start so answering a card doesn't reshuffle/shrink the
  // queue out from under the current index — only "Пройти ещё раз" rebuilds it.
  const [session, setSession] = useState(0);
  const queue = useMemo(() => {
    const due = dueVocab(student);
    return [...due].sort((a, b) => {
      if (a.lessonOrder === current && b.lessonOrder !== current) return -1;
      if (b.lessonOrder === current && a.lessonOrder !== current) return 1;
      return a.lessonOrder - b.lessonOrder;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.id, student.openedUpTo, session]);

  const [index, setIndex] = useState(0);
  const [reviewed, setReviewed] = useState(0);

  const answer = (word: VocabWord, known: boolean) => {
    setWordKnown(student.id, word.id, known);
    setReviewed((r) => r + 1);
    setIndex((i) => i + 1);
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 rise-in">
      <Link
        to="/course"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> К курсу
      </Link>

      <header>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Слова</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Слова из пройденных уроков — коротко и по делу.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "Сегодня", value: stats.today },
          { label: "Нужно повторить", value: stats.review },
          { label: "Освоено", value: stats.mastered },
        ].map((s) => (
          <div key={s.label} className="surface-card p-3.5 text-center">
            <p className="text-xl font-extrabold">{s.value}</p>
            <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {queue.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Все слова повторены"
          description="Новые слова появятся здесь после следующего урока."
        />
      ) : index >= queue.length ? (
        <div className="surface-card p-8 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-success-soft text-success">
            <Sparkles className="size-7" />
          </div>
          <h2 className="mt-3 text-xl font-extrabold">Отлично!</h2>
          <p className="mt-1 text-sm text-muted-foreground">Вы повторили {reviewed} слов.</p>
          <button
            onClick={() => {
              setIndex(0);
              setReviewed(0);
              setSession((s) => s + 1);
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-bold transition hover:bg-muted"
          >
            <RotateCcw className="size-4" /> Пройти ещё раз
          </button>
        </div>
      ) : (
        <FlashCard
          word={queue[index]!}
          progress={`${index + 1} / ${queue.length}`}
          onAnswer={answer}
        />
      )}
    </div>
  );
}

function FlashCard({
  word,
  progress,
  onAnswer,
}: {
  word: VocabWord;
  progress: string;
  onAnswer: (word: VocabWord, known: boolean) => void;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
        <BookOpen className="size-3.5" /> {progress}
      </p>
      <div className="surface-card flex min-h-[220px] flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-3xl font-extrabold">{word.term}</p>
        {revealed ? (
          <>
            <p className="text-lg font-bold text-primary">{word.translation}</p>
            <p className="text-sm italic text-muted-foreground">{word.example}</p>
          </>
        ) : (
          <button
            onClick={() => setRevealed(true)}
            className="mt-2 rounded-xl border border-dashed border-border px-4 py-2 text-xs font-bold text-muted-foreground transition hover:bg-muted"
          >
            Показать перевод
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={() => {
            onAnswer(word, false);
            setRevealed(false);
          }}
          className="rounded-xl border border-border bg-surface py-3 text-sm font-bold text-muted-foreground transition hover:bg-muted"
        >
          Нужно повторить
        </button>
        <button
          onClick={() => {
            onAnswer(word, true);
            setRevealed(false);
          }}
          className="rounded-xl gradient-primary py-3 text-sm font-bold text-primary-foreground shadow-glow"
        >
          Знаю
        </button>
      </div>
    </div>
  );
}
