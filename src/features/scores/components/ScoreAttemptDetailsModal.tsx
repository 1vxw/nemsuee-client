import type { ScoreRow } from "../types/scoreTypes";

type ScoreAttemptDetailsModalProps = {
  selectedCellAttempt: ScoreRow | null;
  loading?: boolean;
  details?: any | null;
  error?: string | null;
  onClose: () => void;
};

export function ScoreAttemptDetailsModal({
  selectedCellAttempt,
  loading = false,
  details,
  error = null,
  onClose,
}: ScoreAttemptDetailsModalProps) {
  if (!selectedCellAttempt) return null;

  const pct =
    Number(details?.total || selectedCellAttempt.attempt.total || 0) > 0
      ? Math.round(
          (Number(details?.score ?? selectedCellAttempt.attempt.score) * 100) /
            Number(details?.total ?? selectedCellAttempt.attempt.total),
        )
      : 0;
  const passing = Number(details?.quiz?.passingPercentage || selectedCellAttempt.passing || 60);
  const passed = pct >= passing;
  const questions = Array.isArray(details?.questions) ? details.questions : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-headline text-base font-bold text-primary">Attempt Details</p>
          <button
            className="rounded-lg border border-outline-variant/40 px-3 py-1.5 font-label text-xs hover:bg-surface-container transition-colors"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="space-y-3 font-body text-xs text-on-surface">
          <div className="grid gap-2 sm:grid-cols-2">
            <p>Block: {details?.quiz?.sectionName || selectedCellAttempt.blockName || "-"}</p>
            <p>Lesson: {details?.quiz?.lessonTitle || selectedCellAttempt.lessonTitle || "-"}</p>
            <p>Student: {details?.student?.fullName || selectedCellAttempt.studentName || "-"}</p>
            <p>
              Attempt: Latest
              {selectedCellAttempt.attemptCount > 1
                ? ` of ${selectedCellAttempt.attemptCount}`
                : ""}
            </p>
            <p>
              Score: {Number(details?.score ?? selectedCellAttempt.attempt.score)}/
              {Number(details?.total ?? selectedCellAttempt.attempt.total)} ({pct}%)
            </p>
            <p>
              Status:{" "}
              <span className={passed ? "text-emerald-700" : "text-rose-700"}>
                {passed ? "Passed" : "Failed"}
              </span>
            </p>
            <p className="sm:col-span-2">
              Submitted:{" "}
              {new Date(
                details?.submittedAt || (selectedCellAttempt.attempt as any)?.createdAt || Date.now(),
              ).toLocaleString()}
            </p>
          </div>

          {loading && (
            <p className="rounded border border-outline-variant/20 bg-surface-container p-3 text-on-surface-variant">
              Loading detailed attempt review...
            </p>
          )}

          {!loading && error && (
            <p className="rounded border border-rose-200 bg-rose-50 p-3 text-rose-700">
              {error}
            </p>
          )}

          {!loading && !error && questions.length > 0 && (
            <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
              {questions.map((q: any, idx: number) => (
                <article
                  key={String(q.id || idx)}
                  className="rounded-lg border border-outline-variant/20 bg-surface-container-low p-3"
                >
                  <p className="font-label text-[11px] text-on-surface-variant">
                    Question {idx + 1}
                  </p>
                  <p className="mt-1 text-sm text-on-surface">{String(q.prompt || "-")}</p>
                  <div className="mt-2 grid gap-1">
                    <p>
                      <span className="text-on-surface-variant">Selected:</span>{" "}
                      <span className="font-medium text-on-surface">
                        {q.studentAnswer ? String(q.studentAnswer) : "No answer"}
                      </span>
                    </p>
                    <p>
                      <span className="text-on-surface-variant">Correct:</span>{" "}
                      <span className="font-medium text-on-surface">
                        {q.correctAnswer ? String(q.correctAnswer) : "-"}
                      </span>
                    </p>
                    <p>
                      <span className="text-on-surface-variant">Result:</span>{" "}
                      <span
                        className={
                          q.isCorrect === null
                            ? "text-on-surface"
                            : q.isCorrect
                              ? "text-emerald-700"
                              : "text-rose-700"
                        }
                      >
                        {q.isCorrect === null
                          ? "Not available"
                          : q.isCorrect
                            ? "Correct"
                            : "Incorrect"}
                      </span>
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && !error && details?.note && (
            <p className="rounded border border-amber-200 bg-amber-50 p-3 text-amber-700">
              {String(details.note)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
