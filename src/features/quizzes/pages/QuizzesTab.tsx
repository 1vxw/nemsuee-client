import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Attempt, Course, User } from "../../../shared/types/lms";

type QuizzesTabProps = {
  selectedCourse: Course;
  attempts: Attempt[];
  user: User;
  api: any;
  headers: any;
  refreshCore: () => Promise<void>;
  setMessage: (m: string) => void;
  updateQuiz: (
    quizId: number,
    questions: any[],
    quizType?: "MULTIPLE_CHOICE" | "TRUE_FALSE",
  ) => Promise<void>;
  deleteQuiz: (quizId: number) => Promise<void>;
};

type QuizType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "IDENTIFICATION";
type DraftQuestion = {
  prompt: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
};

export function QuizzesTab({
  selectedCourse,
  attempts,
  user,
  api,
  headers,
  refreshCore,
  setMessage,
}: QuizzesTabProps) {
  const navigate = useNavigate();
  const [courseQuizzes, setCourseQuizzes] = useState<any[]>([]);
  const [createLessonId, setCreateLessonId] = useState<number | null>(null);
  const [quizMode, setQuizMode] = useState<"MANUAL" | "URL">("MANUAL");
  const [quizType, setQuizType] = useState<QuizType>("MULTIPLE_CHOICE");
  const [quizTitle, setQuizTitle] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([
    {
      prompt: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctOption: "A",
    },
  ]);
  const isTrueFalse = quizType === "TRUE_FALSE";
  const [takeQuiz, setTakeQuiz] = useState<any | null>(null);
  const [takeAnswers, setTakeAnswers] = useState<Record<number, string>>({});
  const [takeRemainingSeconds, setTakeRemainingSeconds] = useState<
    number | null
  >(null);
  const [takeExpiresAt, setTakeExpiresAt] = useState<number | null>(null);
  const [submittingTakeQuiz, setSubmittingTakeQuiz] = useState(false);
  const [settingsQuiz, setSettingsQuiz] = useState<any | null>(null);
  const [studentResultOpen, setStudentResultOpen] = useState(false);
  const [studentResultLoading, setStudentResultLoading] = useState(false);
  const [studentResultData, setStudentResultData] = useState<any | null>(null);
  const [showActivityHistory, setShowActivityHistory] = useState(false);
  const recentStudentAttempts =
    user.role === "STUDENT"
      ? [...attempts]
          .filter((a: any) => a?.quiz?.lesson?.course?.id === selectedCourse.id)
          .sort(
            (a: any, b: any) =>
              new Date((b as any)?.createdAt || 0).getTime() -
              new Date((a as any)?.createdAt || 0).getTime(),
          )
          .slice(0, 8)
      : [];

  useEffect(() => {
    (async () => {
      try {
        const rows = await api(`/quizzes/course/${selectedCourse.id}`, {
          headers,
        });
        setCourseQuizzes(rows || []);
      } catch {}
    })();
  }, [selectedCourse.id]);

  function resetComposer() {
    setCreateLessonId(null);
    setQuizMode("MANUAL");
    setQuizType("MULTIPLE_CHOICE");
    setQuizTitle("");
    setExternalUrl("");
    setDraftQuestions([
      {
        prompt: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctOption: "A",
      },
    ]);
  }

  function getTakeQuizStorageKey(quizId: number) {
    return `quiz-progress:${user.id}:${quizId}`;
  }

  function formatSeconds(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(totalSeconds % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function getStudentQuizAttemptsCount(quizId: number) {
    return attempts.filter((a: any) => {
      const directId = Number(a?.quiz?.id || 0);
      const nestedId = Number((a as any)?.quizId || 0);
      return directId === Number(quizId) || nestedId === Number(quizId);
    }).length;
  }

  function getQuizAccessBlockReason(quiz: any): string | null {
    if (user.role !== "STUDENT") return null;
    if (!quiz?.isOpen) return "Quiz is closed";
    if (
      quiz.mode === "MANUAL" &&
      (!Array.isArray(quiz.questions) || quiz.questions.length === 0)
    ) {
      return "Quiz has no questions yet";
    }
    if (quiz.mode === "URL" && !quiz.externalUrl) {
      return "Quiz link is unavailable";
    }
    const attemptsCount = getStudentQuizAttemptsCount(quiz.id);
    if (quiz.maxAttempts && attemptsCount >= Number(quiz.maxAttempts)) {
      return "Max attempts reached";
    }
    if (quiz.timeLimitMinutes) {
      try {
        const raw = localStorage.getItem(
          getTakeQuizStorageKey(Number(quiz.id)),
        );
        if (raw) {
          const parsed = JSON.parse(raw);
          const savedExpiry = Number(parsed?.expiresAt || 0);
          if (savedExpiry && savedExpiry <= Date.now()) {
            return "Time limit exceeded";
          }
        }
      } catch {}
    }
    return null;
  }

  async function submitTakeQuiz(isAuto = false) {
    if (!takeQuiz || submittingTakeQuiz) return;
    try {
      setSubmittingTakeQuiz(true);
      const answers = (takeQuiz.questions || []).map((q: any) => ({
        questionId: q.id,
        answer: takeAnswers[q.id] || "",
      }));
      const result = await api(`/quizzes/${takeQuiz.id}/submit-v2`, {
        method: "POST",
        headers,
        body: JSON.stringify({ answers }),
      });
      localStorage.removeItem(getTakeQuizStorageKey(Number(takeQuiz.id)));
      await refreshCore();
      setTakeQuiz(null);
      setTakeAnswers({});
      setTakeRemainingSeconds(null);
      setTakeExpiresAt(null);
      setMessage(
        result?.score !== undefined
          ? `${isAuto ? "Time is up. " : ""}Submitted. Score: ${result.score}/${result.total}`
          : `${isAuto ? "Time is up. " : ""}Submitted.`,
      );
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setSubmittingTakeQuiz(false);
    }
  }

  useEffect(() => {
    if (!takeQuiz) return;
    const quizId = Number(takeQuiz.id);
    const key = getTakeQuizStorageKey(quizId);
    let savedAnswers: Record<number, string> = {};
    let savedExpiresAt: number | null = null;

    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.answers && typeof parsed.answers === "object") {
          savedAnswers = parsed.answers;
        }
        if (typeof parsed?.expiresAt === "number") {
          savedExpiresAt = parsed.expiresAt;
        }
      }
    } catch {}

    setTakeAnswers(savedAnswers);

    if (takeQuiz.timeLimitMinutes) {
      const durationMs = Number(takeQuiz.timeLimitMinutes) * 60 * 1000;
      const expiresAt =
        savedExpiresAt && savedExpiresAt > Date.now()
          ? savedExpiresAt
          : Date.now() + durationMs;
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setTakeExpiresAt(expiresAt);
      setTakeRemainingSeconds(remaining);
    } else {
      setTakeExpiresAt(null);
      setTakeRemainingSeconds(null);
    }
  }, [takeQuiz]);

  useEffect(() => {
    if (!takeQuiz || takeRemainingSeconds === null || takeRemainingSeconds <= 0)
      return;
    const timer = window.setInterval(() => {
      setTakeRemainingSeconds((prev) => {
        if (prev === null) return null;
        return prev > 0 ? prev - 1 : 0;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [takeQuiz, takeRemainingSeconds]);

  useEffect(() => {
    if (!takeQuiz) return;
    const key = getTakeQuizStorageKey(Number(takeQuiz.id));
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          answers: takeAnswers,
          expiresAt: takeExpiresAt,
          updatedAt: Date.now(),
        }),
      );
    } catch {}
  }, [takeQuiz, takeAnswers, takeExpiresAt]);

  useEffect(() => {
    if (!takeQuiz || takeRemainingSeconds !== 0) return;
    submitTakeQuiz(true);
  }, [takeQuiz, takeRemainingSeconds]);

  async function submitManualQuiz(lessonId: number) {
    if (quizMode === "URL" && !externalUrl.trim()) {
      setMessage("Please provide the Google Form URL.");
      return;
    }
    const normalized = draftQuestions.map((q) => ({
      prompt: q.prompt.trim(),
      optionA:
        quizType === "IDENTIFICATION"
          ? q.optionA.trim()
          : isTrueFalse
            ? "True"
            : q.optionA.trim(),
      optionB: isTrueFalse ? "False" : q.optionB.trim(),
      optionC:
        isTrueFalse || quizType === "IDENTIFICATION" ? "" : q.optionC.trim(),
      optionD:
        isTrueFalse || quizType === "IDENTIFICATION" ? "" : q.optionD.trim(),
      correctAnswer:
        quizType === "IDENTIFICATION"
          ? q.optionA.trim()
          : isTrueFalse
            ? q.correctOption === "B"
              ? "B"
              : "A"
            : q.correctOption,
    }));

    if (
      quizMode === "MANUAL" &&
      !normalized.every((q) => q.prompt.length >= 2)
    ) {
      setMessage("Every question must include a prompt.");
      return;
    }
    if (
      quizMode === "MANUAL" &&
      !isTrueFalse &&
      quizType !== "IDENTIFICATION" &&
      !normalized.every(
        (q) =>
          q.optionA.length > 0 &&
          q.optionB.length > 0 &&
          q.optionC.length > 0 &&
          q.optionD.length > 0,
      )
    ) {
      setMessage("Please fill all options for multiple-choice questions.");
      return;
    }

    try {
      await api(`/quizzes/lessons/${lessonId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: quizTitle || "Quiz",
          mode: quizMode,
          quizType: quizMode === "MANUAL" ? quizType : undefined,
          externalUrl: quizMode === "URL" ? externalUrl : undefined,
          questions: quizMode === "MANUAL" ? normalized : [],
        }),
      });
      await refreshCore();
      setMessage("Quiz created.");
      resetComposer();
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  return (
    <div className="min-w-0 space-y-4 md:space-y-6">
      {user.role === "STUDENT" && (
        <section className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-3 sm:p-4 md:p-5">
          <button
            data-keep-action-text="true"
            className="mb-3 flex w-full items-center justify-between text-left sm:mb-4"
            onClick={() => setShowActivityHistory((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[1.25rem] sm:text-xl">history_edu</span>
              <p className="font-headline text-sm font-bold text-primary sm:text-base md:text-lg">
                My Quiz Activity
              </p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-[1.25rem]">
              {showActivityHistory ? "expand_less" : "expand_more"}
            </span>
          </button>
          {showActivityHistory && recentStudentAttempts.length ? (
            <div className="overflow-x-auto rounded-lg border border-outline-variant/20">
              <table className="min-w-full text-sm font-body">
                <thead className="bg-surface-container text-on-surface-variant font-label">
                  <tr>
                    <th className="px-4 py-3 text-left">Lesson</th>
                    <th className="px-4 py-3 text-left">Result</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {recentStudentAttempts.map((a: any) => {
                    const pct =
                      Number(a?.total) > 0
                        ? (Number(a?.score || 0) * 100) / Number(a?.total || 1)
                        : 0;
                    const passing = Number(a?.quiz?.passingPercentage || 60);
                    const passed = pct >= passing;
                    return (
                      <tr key={a.id} className="border-t border-outline-variant/20">
                        <td className="px-4 py-3 text-on-surface font-medium">{a?.quiz?.lesson?.title || "-"}</td>
                        <td className="px-4 py-3 text-on-surface-variant">{a?.score}/{a?.total} ({Math.round(pct)}%)</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${passed ? "bg-emerald-100 text-emerald-700" : "bg-error-container text-error"}`}
                          >
                            {passed ? "Passed" : "Failed"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant text-xs">{new Date(a?.createdAt || Date.now()).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : showActivityHistory ? (
            <p className="rounded-lg bg-surface-container px-4 py-6 text-center text-sm text-on-surface-variant">No quiz attempts yet.</p>
          ) : null}
        </section>
      )}
      {selectedCourse.sections.map((section) => (
        <section
          key={section.id}
          className="overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm"
        >
          <div className="border-b border-outline-variant/20 bg-surface-container px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="material-symbols-outlined text-secondary text-base sm:text-xl">folder</span>
              <p className="font-headline text-sm font-bold text-primary sm:text-base md:text-lg">
                {section.name}
              </p>
            </div>
          </div>
          <div className="divide-y divide-outline-variant/20">
            {section.lessons.map((lesson) => {
              const lessonQuizzes = courseQuizzes.filter(
                (q: any) => Number(q.lessonId) === lesson.id,
              );
              const attemptsForLesson = attempts.filter(
                (a) => a.quiz.lesson.title === lesson.title,
              );
              const hasQuiz = lessonQuizzes.length > 0;
              const hasFileQuiz = Boolean(lesson.fileUrl);
              const studentFileLockedByOpenQuiz =
                user.role === "STUDENT" &&
                lessonQuizzes.some((q: any) => Boolean(q.isOpen));
              const statusLabel = hasQuiz
                ? "Quiz Ready"
                : hasFileQuiz
                  ? "File Quiz Available"
                  : user.role === "STUDENT"
                    ? "Quiz Not Available"
                    : "No Quiz Yet";

              return (
                <article
                  key={lesson.id}
                  className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-2 sm:px-4 sm:py-4"
                >
                  <div className="min-w-0 flex-1 sm:flex-initial">
                    <p className="font-headline text-sm font-bold text-primary truncate sm:text-base">
                      {lesson.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-label">
                      <span
                        className={`font-bold ${statusLabel === "Quiz Ready" ? "text-emerald-700" : statusLabel === "File Quiz Available" ? "text-on-primary-fixed-variant" : "text-on-surface-variant"}`}
                      >
                        {statusLabel}
                      </span>
                      {hasQuiz && (
                        <span className="text-on-surface-variant">
                          {lessonQuizzes.reduce(
                            (n: number, q: any) =>
                              n + (q.questions?.length || 0),
                            0,
                          )}{" "}
                          questions
                        </span>
                      )}
                      {user.role === "INSTRUCTOR" && hasQuiz && (
                        <span className="text-on-surface-variant">
                          {attemptsForLesson.length} submissions
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                    {user.role === "INSTRUCTOR" && !hasQuiz && (
                      <>
                        <button
                          onClick={() => {
                            setCreateLessonId(lesson.id);
                            setQuizMode("MANUAL");
                            setQuizType("MULTIPLE_CHOICE");
                            setDraftQuestions([
                              {
                                prompt: "",
                                optionA: "",
                                optionB: "",
                                optionC: "",
                                optionD: "",
                                correctOption: "A",
                              },
                            ]);
                          }}
                          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-label font-bold text-on-primary hover:opacity-90 transition-opacity sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
                          title="Create quiz"
                          aria-label="Create quiz"
                        >
                          <span className="material-symbols-outlined text-[1.125rem]">add</span>
                          <span>Create Quiz</span>
                        </button>
                        <button
                          onClick={() =>
                            setMessage(
                              "Upload Quiz File: use Add Lesson and provide a file URL.",
                            )
                          }
                          className="rounded-lg border border-outline-variant/40 p-2 hover:bg-surface-container transition-colors"
                          title="Upload quiz file"
                          aria-label="Upload quiz file"
                        >
                          <span className="material-symbols-outlined text-[1.125rem]">upload_file</span>
                        </button>
                      </>
                    )}
                    {hasFileQuiz &&
                      (studentFileLockedByOpenQuiz ? (
                        <button
                          className="cursor-not-allowed rounded-lg border border-outline-variant/20 bg-surface-container p-2 text-on-surface-variant"
                          title="Resource file is locked while quiz is open"
                          aria-label="Resource file locked while quiz is open"
                          disabled
                        >
                          <span className="material-symbols-outlined text-[1.125rem]">link_off</span>
                        </button>
                      ) : (
                        <a
                          className="rounded-lg border border-outline-variant/40 p-2 hover:bg-surface-container transition-colors"
                          href={lesson.fileUrl || "#"}
                          target="_blank"
                          rel="noreferrer"
                          title="Open quiz file"
                          aria-label="Open quiz file"
                        >
                          <span className="material-symbols-outlined text-[1.125rem]">open_in_new</span>
                        </a>
                      ))}
                  </div>
                  {hasQuiz && (
                    <div className="w-full space-y-2 sm:mt-0 sm:basis-full sm:space-y-3">
                      {lessonQuizzes.map((quiz: any) => {
                        const myAttempt = attempts.find(
                          (a: any) => Number(a.quiz?.id) === Number(quiz.id),
                        );
                        const latestAttempt = [...attempts]
                          .filter(
                            (a: any) =>
                              Number(
                                (a as any)?.quiz?.id || (a as any)?.quizId || 0,
                              ) === Number(quiz.id),
                          )
                          .sort(
                            (a: any, b: any) =>
                              new Date((b as any)?.createdAt || 0).getTime() -
                              new Date((a as any)?.createdAt || 0).getTime(),
                          )[0];
                        const latestPct =
                          latestAttempt && Number(latestAttempt.total) > 0
                            ? (Number(latestAttempt.score) * 100) /
                              Number(latestAttempt.total)
                            : null;
                        const passThreshold = Number(
                          quiz.passingPercentage || 60,
                        );
                        const attemptToneClass =
                          user.role === "STUDENT" && latestPct !== null
                            ? latestPct >= passThreshold
                              ? "border-emerald-200 bg-emerald-50"
                              : "border-error-container bg-error-container/50"
                            : "border-outline-variant/20 bg-surface-container";
                        const blockReason = getQuizAccessBlockReason(quiz);
                        const maxAttemptsReached = Boolean(
                          quiz.maxAttempts &&
                          getStudentQuizAttemptsCount(quiz.id) >=
                            Number(quiz.maxAttempts),
                        );
                        const isClosedByInstructor = !Boolean(quiz.isOpen);
                        const isBlocked =
                          user.role === "STUDENT" &&
                          (isClosedByInstructor ||
                            maxAttemptsReached ||
                            Boolean(blockReason));
                        const canStudentViewResult = Boolean(
                          quiz?.showScoreInStudentScores ?? true,
                        );
                        return (
                          <div
                            key={quiz.id}
                            className={`flex flex-col gap-2 rounded-lg border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4 sm:py-3 ${attemptToneClass}`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-headline text-sm font-bold text-primary truncate sm:text-base">
                                {quiz.title || "Quiz"}
                              </p>
                              <p className="text-[11px] text-on-surface-variant font-label mt-0.5 sm:text-xs">
                                {section.name} · {lesson.title}
                              </p>
                              <p className="text-[11px] text-on-surface-variant font-label sm:text-xs">
                                {(quiz.questions || []).length} questions
                                {quiz.timeLimitMinutes
                                  ? ` · ${quiz.timeLimitMinutes} min`
                                  : ""}
                                {quiz.maxAttempts
                                  ? ` · max ${quiz.maxAttempts} attempts`
                                  : ""}
                                {user.role === "STUDENT" && blockReason
                                  ? ` · ${blockReason}`
                                  : ""}
                              </p>
                            </div>
                            <div className="flex items-center justify-end gap-1.5 flex-shrink-0 sm:justify-start">
                              {user.role === "INSTRUCTOR" ? (
                                <>
                                  <button
                                    onClick={async () => {
                                      if (
                                        !confirm(
                                          `Delete quiz "${quiz.title || "Quiz"}"?`,
                                        )
                                      )
                                        return;
                                      await api(`/quizzes/${quiz.id}`, {
                                        method: "DELETE",
                                        headers,
                                      });
                                      const rows = await api(
                                        `/quizzes/course/${selectedCourse.id}`,
                                        { headers },
                                      );
                                      setCourseQuizzes(rows || []);
                                    }}
                                    className="rounded-lg border border-error-container p-2 text-error hover:bg-error-container/50 transition-colors"
                                    title="Delete quiz"
                                  >
                                    <span className="material-symbols-outlined text-[1.125rem]">delete</span>
                                  </button>
                                  <button
                                    onClick={() => navigate("/scores")}
                                    className="rounded-lg border border-outline-variant/40 p-2 hover:bg-surface-container transition-colors"
                                    title="View results"
                                  >
                                    <span className="material-symbols-outlined text-[1.125rem]">bar_chart</span>
                                  </button>
                                  <button
                                    onClick={async () => {
                                      await api(
                                        `/quizzes/${quiz.id}/settings`,
                                        {
                                          method: "PATCH",
                                          headers,
                                          body: JSON.stringify({
                                            isOpen: !Boolean(quiz.isOpen),
                                          }),
                                        },
                                      );
                                      const rows = await api(
                                        `/quizzes/course/${selectedCourse.id}`,
                                        { headers },
                                      );
                                      setCourseQuizzes(rows || []);
                                    }}
                                    className="rounded-lg border border-outline-variant/40 p-2 hover:bg-surface-container transition-colors"
                                    title={
                                      quiz.isOpen ? "Close quiz" : "Open quiz"
                                    }
                                  >
                                    <span className="material-symbols-outlined text-[1.125rem]">{quiz.isOpen ? "visibility" : "visibility_off"}</span>
                                  </button>
                                  <button
                                    onClick={() => setSettingsQuiz(quiz)}
                                    className="rounded-lg border border-outline-variant/40 p-2 hover:bg-surface-container transition-colors"
                                    title="Quiz settings"
                                  >
                                    <span className="material-symbols-outlined text-[1.125rem]">settings</span>
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    data-keep-action-text="true"
                                    onClick={async () => {
                                      if (isClosedByInstructor) {
                                        setMessage(
                                          "Quiz is closed by instructor.",
                                        );
                                        return;
                                      }
                                      if (maxAttemptsReached) {
                                        setMessage("Max attempts reached.");
                                        return;
                                      }
                                      if (isBlocked) {
                                        setMessage(
                                          blockReason || "Quiz is not available.",
                                        );
                                        return;
                                      }
                                      try {
                                        if (
                                          quiz.mode === "URL" &&
                                          quiz.externalUrl
                                        ) {
                                          window.open(
                                            quiz.externalUrl,
                                            "_blank",
                                            "noopener,noreferrer",
                                          );
                                          return;
                                        }
                                        setTakeQuiz(quiz);
                                        await refreshCore();
                                      } catch (e) {
                                        setMessage((e as Error).message);
                                      }
                                    }}
                                    className={`rounded-lg p-2 transition-colors ${isBlocked ? "cursor-not-allowed text-on-surface-variant" : "text-primary hover:bg-surface-container"}`}
                                    title={
                                      isBlocked
                                        ? blockReason || "Unavailable"
                                        : myAttempt
                                          ? "Retake quiz"
                                          : "Start quiz"
                                    }
                                    aria-label={
                                      myAttempt
                                        ? "Retake quiz"
                                        : quiz.mode === "URL"
                                          ? "Open quiz link"
                                          : "Start quiz"
                                    }
                                    disabled={isBlocked}
                                    aria-disabled={isBlocked}
                                  >
                                    <span className="material-symbols-outlined text-[1.125rem]">
                                      {myAttempt ? "replay" : quiz.mode === "URL" ? "open_in_new" : "play_circle"}
                                    </span>
                                  </button>
                                  <button
                                    data-keep-action-text="true"
                                    className={`rounded-lg p-2 transition-colors disabled:opacity-50 ${latestAttempt && canStudentViewResult ? "text-primary hover:bg-surface-container" : "text-on-surface-variant"}`}
                                    disabled={!latestAttempt || !canStudentViewResult}
                                    onClick={async () => {
                                      if (!latestAttempt) return;
                                      if (!canStudentViewResult) {
                                        setMessage(
                                          "Quiz results are hidden by instructor.",
                                        );
                                        return;
                                      }
                                      try {
                                        setStudentResultOpen(true);
                                        setStudentResultLoading(true);
                                        const result = await api(
                                          `/quizzes/${quiz.id}/results/me`,
                                          { headers },
                                        );
                                        setStudentResultData(result);
                                      } catch (e) {
                                        setMessage((e as Error).message);
                                        setStudentResultOpen(false);
                                      } finally {
                                        setStudentResultLoading(false);
                                      }
                                    }}
                                    title={
                                      !canStudentViewResult
                                        ? "Result is hidden by instructor"
                                        : "View result"
                                    }
                                    aria-label={
                                      !canStudentViewResult
                                        ? "Result is hidden by instructor"
                                        : "View result"
                                    }
                                  >
                                    <span className="material-symbols-outlined text-[1.125rem]">visibility</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })}
            {!section.lessons.length && (
              <div className="px-4 py-8 text-center md:px-5">
                <span className="material-symbols-outlined text-3xl text-outline-variant/40 mb-2 block">quiz</span>
                <p className="text-sm text-on-surface-variant font-body">No lessons in this block yet.</p>
              </div>
            )}
          </div>
        </section>
      ))}
      {!selectedCourse.sections.some((s) => s.lessons.length) && (
        <div className="rounded-xl border border-dashed border-outline-variant/30 px-8 py-12 text-center">
          <span className="material-symbols-outlined text-4xl text-outline-variant/30 mb-3 block">quiz</span>
          <p className="font-headline text-lg font-bold text-primary mb-1">No quizzes available yet</p>
          <p className="text-sm text-on-surface-variant">Lessons will appear here once your instructor adds course content.</p>
        </div>
      )}
      {createLessonId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-xl md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-2xl">add_circle</span>
                <p className="font-headline text-lg font-bold text-primary">
                  Create Quiz
                </p>
              </div>
              <button
                className="rounded-lg border border-outline-variant/40 px-3 py-2 text-sm font-label hover:bg-surface-container transition-colors"
                onClick={resetComposer}
              >
                Close
              </button>
            </div>
            <div className="mb-4 grid gap-3 sm:grid-cols-[140px_1fr] sm:items-start">
              <label className="text-sm font-label font-medium text-on-surface-variant">
                Quiz Setup
              </label>
              <div className="grid gap-3">
                <input
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="Quiz title"
                  className="rounded-lg border border-outline-variant/40 px-4 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
                <select
                  value={quizMode}
                  onChange={(e) =>
                    setQuizMode(e.target.value as "MANUAL" | "URL")
                  }
                  className="rounded-lg border border-outline-variant/40 px-4 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="MANUAL">Manual</option>
                  <option value="URL">Google Form URL</option>
                </select>
                {quizMode === "URL" ? (
                  <input
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://forms.google.com/..."
                    className="rounded-lg border border-outline-variant/40 px-4 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary outline-none"
                  />
                ) : (
                  <select
                    value={quizType}
                    onChange={(e) => {
                      const nextType = e.target.value as QuizType;
                      setQuizType(nextType);
                      setDraftQuestions((prev) =>
                        prev.map((q) => ({
                          ...q,
                          correctOption:
                            nextType === "TRUE_FALSE" &&
                            (q.correctOption === "C" || q.correctOption === "D")
                              ? "A"
                              : q.correctOption,
                        })),
                      );
                    }}
                    className="rounded-lg border border-outline-variant/40 px-4 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="TRUE_FALSE">True / False</option>
                    <option value="IDENTIFICATION">Identification</option>
                  </select>
                )}
              </div>
            </div>
            {quizMode === "MANUAL" && (
              <div className="max-h-[50vh] space-y-3 overflow-auto pr-1">
                {draftQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-outline-variant/20 bg-surface-container p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-label font-bold text-primary">
                        Question {idx + 1}
                      </p>
                      <button
                        onClick={() =>
                          setDraftQuestions((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        className="rounded-lg border border-error-container px-2.5 py-1 text-xs font-label font-bold text-error hover:bg-error-container/30"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      value={q.prompt}
                      onChange={(e) =>
                        setDraftQuestions((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, prompt: e.target.value } : x,
                          ),
                        )
                      }
                      placeholder="Question prompt"
                      className="mb-3 w-full rounded-lg border border-outline-variant/40 px-4 py-2 text-sm font-body focus:ring-1 focus:ring-primary outline-none"
                    />
                    {quizType === "IDENTIFICATION" ? (
                      <input
                        value={q.optionA}
                        onChange={(e) =>
                          setDraftQuestions((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, optionA: e.target.value } : x,
                            ),
                          )
                        }
                        placeholder="Correct answer"
                        className="rounded-lg border border-outline-variant/40 px-4 py-2 text-sm font-body focus:ring-1 focus:ring-primary outline-none"
                      />
                    ) : isTrueFalse ? (
                      <p className="mb-2 text-xs text-on-surface-variant font-body">
                        Options are fixed: A=True, B=False
                      </p>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {(["A", "B", "C", "D"] as const).map((opt) => (
                          <input
                            key={opt}
                            value={
                              q[
                                `option${opt}` as
                                  | "optionA"
                                  | "optionB"
                                  | "optionC"
                                  | "optionD"
                              ]
                            }
                            onChange={(e) =>
                              setDraftQuestions((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        [`option${opt}`]: e.target.value,
                                      }
                                    : x,
                                ),
                              )
                            }
                            placeholder={`Option ${opt}`}
                            className="rounded-lg border border-outline-variant/40 px-4 py-2 text-sm font-body focus:ring-1 focus:ring-primary outline-none"
                          />
                        ))}
                      </div>
                    )}
                    <select
                      value={q.correctOption}
                      onChange={(e) =>
                        setDraftQuestions((prev) =>
                          prev.map((x, i) =>
                            i === idx
                              ? {
                                  ...x,
                                  correctOption: e.target.value as
                                    | "A"
                                    | "B"
                                    | "C"
                                    | "D",
                                }
                              : x,
                          ),
                        )
                      }
                      className="mt-2 rounded-lg border border-outline-variant/40 px-4 py-2 text-sm font-body focus:ring-1 focus:ring-primary outline-none"
                    >
                      <option value="A">Correct: A</option>
                      <option value="B">Correct: B</option>
                      {quizType === "MULTIPLE_CHOICE" && (
                        <option value="C">Correct: C</option>
                      )}
                      {quizType === "MULTIPLE_CHOICE" && (
                        <option value="D">Correct: D</option>
                      )}
                    </select>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                className="flex items-center gap-2 rounded-lg border border-outline-variant/40 px-4 py-2 font-label text-sm hover:bg-surface-container transition-colors"
                onClick={() =>
                  setDraftQuestions((prev) => [
                    ...prev,
                    {
                      prompt: "",
                      optionA: "",
                      optionB: "",
                      optionC: "",
                      optionD: "",
                      correctOption: "A",
                    },
                  ])
                }
                title="Add question"
                aria-label="Add question"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Add Question
              </button>
              <button
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-label text-sm font-bold text-on-primary hover:opacity-90 transition-opacity"
                onClick={() => submitManualQuiz(createLessonId)}
                title="Save quiz"
                aria-label="Save quiz"
              >
                <span className="material-symbols-outlined text-lg">save</span>
                Create Quiz
              </button>
            </div>
          </div>
        </div>
      )}
      {takeQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-xl md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-headline text-lg font-bold text-primary">{takeQuiz.title}</p>
                {takeQuiz.timeLimitMinutes ? (
                  <p className="text-xs text-on-surface-variant mt-1">
                    Time limit: {takeQuiz.timeLimitMinutes} minutes
                  </p>
                ) : null}
                {takeQuiz.timeLimitMinutes ? (
                  <p
                    className={`text-sm font-bold mt-1 ${takeRemainingSeconds !== null && takeRemainingSeconds <= 60 ? "text-error" : "text-on-surface"}`}
                  >
                    Time left:{" "}
                    {takeRemainingSeconds !== null
                      ? formatSeconds(takeRemainingSeconds)
                      : "00:00"}
                  </p>
                ) : (
                  <p className="text-sm font-bold text-on-surface mt-1">
                    No time limit
                  </p>
                )}
                <p className="text-xs text-on-surface-variant mt-1">
                  Progress is saved locally on this device.
                </p>
              </div>
              <button
                className="rounded-lg border border-outline-variant/40 px-3 py-2 text-sm font-label hover:bg-surface-container transition-colors"
                onClick={() => {
                  setTakeQuiz(null);
                  setTakeRemainingSeconds(null);
                  setTakeExpiresAt(null);
                }}
              >
                Close
              </button>
            </div>
            <div className="max-h-[55vh] space-y-3 overflow-auto">
              {(takeQuiz.questions || []).map((q: any, idx: number) => (
                <div key={q.id} className="rounded-xl border border-outline-variant/20 bg-surface-container p-4">
                  <p className="mb-3 font-label text-sm font-bold text-primary">
                    Q{idx + 1}. {q.prompt}
                  </p>
                  {takeQuiz.quizType === "IDENTIFICATION" ? (
                    <input
                      className="w-full rounded-lg border border-outline-variant/40 px-4 py-2 text-sm font-body focus:ring-1 focus:ring-primary outline-none"
                      value={takeAnswers[q.id] || ""}
                      onChange={(e) =>
                        setTakeAnswers((prev) => ({
                          ...prev,
                          [q.id]: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <div className="space-y-1 text-xs">
                      {[q.optionA, q.optionB, q.optionC, q.optionD]
                        .filter(Boolean)
                        .map((opt: string, i: number) => {
                          const key = ["A", "B", "C", "D"][i];
                          return (
                            <label
                              key={key}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="radio"
                                name={`q-${q.id}`}
                                value={key}
                                checked={(takeAnswers[q.id] || "") === key}
                                onChange={(e) =>
                                  setTakeAnswers((prev) => ({
                                    ...prev,
                                    [q.id]: e.target.value,
                                  }))
                                }
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <button
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-3 font-label text-sm font-bold text-on-primary hover:opacity-90 transition-opacity disabled:opacity-60"
                onClick={() => submitTakeQuiz(false)}
                disabled={submittingTakeQuiz}
                title={submittingTakeQuiz ? "Submitting..." : "Submit quiz"}
                aria-label={
                  submittingTakeQuiz ? "Submitting..." : "Submit quiz"
                }
              >
                {submittingTakeQuiz ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined">send</span>
                    Submit Quiz
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {settingsQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-xl md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-xl">settings</span>
                <p className="font-headline text-lg font-bold text-primary">Quiz Settings</p>
              </div>
              <button
                className="rounded-lg border border-outline-variant/40 px-3 py-2 text-sm font-label hover:bg-surface-container transition-colors"
                onClick={() => setSettingsQuiz(null)}
              >
                Close
              </button>
            </div>
            <div className="grid gap-3 text-sm">
              <input
                id="quiz-title"
                className="rounded-lg border border-outline-variant/40 px-4 py-2.5 font-body focus:ring-1 focus:ring-primary outline-none"
                defaultValue={settingsQuiz.title || ""}
                placeholder="Quiz title"
              />
              <input
                id="quiz-time-limit"
                type="number"
                min={1}
                className="rounded-lg border border-outline-variant/40 px-4 py-2.5 font-body focus:ring-1 focus:ring-primary outline-none"
                defaultValue={settingsQuiz.timeLimitMinutes || ""}
                placeholder="Time limit (minutes)"
              />
              <input
                id="quiz-max-attempts"
                type="number"
                min={1}
                className="rounded-lg border border-outline-variant/40 px-4 py-2.5 font-body focus:ring-1 focus:ring-primary outline-none"
                defaultValue={settingsQuiz.maxAttempts || ""}
                placeholder="Max attempts"
              />
              <input
                id="quiz-passing-percentage"
                type="number"
                min={1}
                max={100}
                className="rounded-lg border border-outline-variant/40 px-4 py-2.5 font-body focus:ring-1 focus:ring-primary outline-none"
                defaultValue={settingsQuiz.passingPercentage || 60}
                placeholder="Passing score (%)"
              />
              <input
                id="quiz-access-code"
                className="rounded-lg border border-outline-variant/40 px-4 py-2.5 font-body focus:ring-1 focus:ring-primary outline-none"
                defaultValue={settingsQuiz.accessCode || ""}
                placeholder="Access code (optional)"
              />
              <label className="flex items-center gap-2 text-xs">
                <input
                  id="quiz-is-open"
                  type="checkbox"
                  defaultChecked={Boolean(settingsQuiz.isOpen)}
                />
                Quiz is open
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  id="quiz-shuffle"
                  type="checkbox"
                  defaultChecked={Boolean(settingsQuiz.shuffleQuestions)}
                />
                Shuffle questions
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  id="quiz-show-results"
                  type="checkbox"
                  defaultChecked={Boolean(settingsQuiz.showResultsImmediately)}
                />
                Show results immediately
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  id="quiz-show-score-tab"
                  type="checkbox"
                  defaultChecked={Boolean(
                    settingsQuiz.showScoreInStudentScores ?? true,
                  )}
                />
                Show quiz results in student Scores tab
              </label>
            </div>
            <div className="mt-4">
              <button
                className="rounded-lg bg-primary px-4 py-2.5 font-label text-sm font-bold text-on-primary hover:opacity-90 transition-opacity"
                onClick={async () => {
                  const title =
                    (
                      document.getElementById(
                        "quiz-title",
                      ) as HTMLInputElement | null
                    )?.value || "";
                  const timeLimit =
                    (
                      document.getElementById(
                        "quiz-time-limit",
                      ) as HTMLInputElement | null
                    )?.value || "";
                  const maxAttempts =
                    (
                      document.getElementById(
                        "quiz-max-attempts",
                      ) as HTMLInputElement | null
                    )?.value || "";
                  const passingPercentage =
                    (
                      document.getElementById(
                        "quiz-passing-percentage",
                      ) as HTMLInputElement | null
                    )?.value || "";
                  const accessCode =
                    (
                      document.getElementById(
                        "quiz-access-code",
                      ) as HTMLInputElement | null
                    )?.value || "";
                  const isOpen = Boolean(
                    (
                      document.getElementById(
                        "quiz-is-open",
                      ) as HTMLInputElement | null
                    )?.checked,
                  );
                  const shuffleQuestions = Boolean(
                    (
                      document.getElementById(
                        "quiz-shuffle",
                      ) as HTMLInputElement | null
                    )?.checked,
                  );
                  const showResultsImmediately = Boolean(
                    (
                      document.getElementById(
                        "quiz-show-results",
                      ) as HTMLInputElement | null
                    )?.checked,
                  );
                  const showScoreInStudentScores = Boolean(
                    (
                      document.getElementById(
                        "quiz-show-score-tab",
                      ) as HTMLInputElement | null
                    )?.checked,
                  );
                  await api(`/quizzes/${settingsQuiz.id}/settings`, {
                    method: "PATCH",
                    headers,
                    body: JSON.stringify({
                      title: title.trim() || undefined,
                      isOpen,
                      timeLimitMinutes: timeLimit ? Number(timeLimit) : null,
                      maxAttempts: maxAttempts ? Number(maxAttempts) : null,
                      passingPercentage: passingPercentage
                        ? Number(passingPercentage)
                        : null,
                      accessCode: accessCode || null,
                      shuffleQuestions,
                      showResultsImmediately,
                      showScoreInStudentScores,
                    }),
                  });
                  const rows = await api(
                    `/quizzes/course/${selectedCourse.id}`,
                    { headers },
                  );
                  setCourseQuizzes(rows || []);
                  setSettingsQuiz(null);
                }}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
      {studentResultOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-xl md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-xl">quiz</span>
                <p className="font-headline text-lg font-bold text-primary">Quiz Result</p>
              </div>
              <button
                className="rounded-lg border border-outline-variant/40 px-3 py-2 text-sm font-label hover:bg-surface-container transition-colors"
                onClick={() => {
                  setStudentResultOpen(false);
                  setStudentResultData(null);
                }}
              >
                Close
              </button>
            </div>
            {studentResultLoading ? (
              <div className="flex items-center gap-2 py-8 text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                <p className="text-sm font-body">Loading result...</p>
              </div>
            ) : !studentResultData ? (
              <p className="text-sm text-on-surface-variant font-body py-8">No result data.</p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-4 text-sm">
                  <p className="font-headline font-bold text-primary">
                    {studentResultData?.quiz?.title || "Quiz"}
                  </p>
                  <p className="text-on-surface-variant mt-1">
                    Block: {studentResultData?.quiz?.sectionName || "N/A"}
                  </p>
                  <p className="text-on-surface-variant">
                    Lesson: {studentResultData?.quiz?.lessonTitle || "N/A"}
                  </p>
                  <p className="font-headline font-bold text-primary mt-2">
                    Score: {studentResultData?.score}/{studentResultData?.total}
                  </p>
                </div>
                {!studentResultData?.quiz?.canViewAnswerKey ? (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 font-body">
                    Answer key is hidden by instructor.
                  </p>
                ) : (
                  <div className="max-h-[45vh] space-y-3 overflow-auto">
                    {(studentResultData?.questions || []).map((q: any, idx: number) => (
                      <div key={q.id} className="rounded-xl border border-outline-variant/20 bg-surface-container p-3 text-sm">
                        <p className="font-label font-bold text-primary">
                          Q{idx + 1}. {q.prompt}
                        </p>
                        <p className="text-on-surface-variant mt-1">
                          Your answer: {q.studentAnswer || "(no answer)"}
                        </p>
                        <p className="text-on-surface-variant">
                          Correct answer: {q.correctAnswer || "-"}
                        </p>
                        <p className={`mt-1 font-bold ${q.isCorrect ? "text-emerald-700" : "text-error"}`}>
                          {q.isCorrect ? "Correct" : "Incorrect"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

