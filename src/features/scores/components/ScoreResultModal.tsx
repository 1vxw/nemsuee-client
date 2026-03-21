import type { Course } from "../../../shared/types/lms";

type ScoreResultModalProps = {
  open: boolean;
  loading: boolean;
  data: any | null;
  selectedCourse: Course;
  onClose: () => void;
};

export function ScoreResultModal({
  open,
  loading,
  data,
  selectedCourse,
  onClose,
}: ScoreResultModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-xl md:p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-headline text-base font-bold text-primary">Quiz Result</p>
          <button
            className="rounded-lg border border-outline-variant/40 px-3 py-1.5 font-label text-xs hover:bg-surface-container transition-colors"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        {loading ? (
          <p className="font-body text-sm text-on-surface-variant">Loading result...</p>
        ) : !data ? (
          <p className="font-body text-sm text-on-surface-variant">No result data.</p>
        ) : (
          <div className="space-y-3">
            {(() => {
              const pct =
                Number(data?.total) > 0
                  ? (Number(data?.score || 0) * 100) / Number(data?.total || 1)
                  : 0;
              const passing = Number(data?.quiz?.passingPercentage || 60);
              const passed = pct >= passing;
              return (
                <p
                  className={`rounded px-2 py-1 text-xs font-semibold ${passed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                >
                  {passed
                    ? `Passed (${Math.round(pct)}% / ${passing}%)`
                    : `Failed (${Math.round(pct)}% / ${passing}%)`}
                </p>
              );
            })()}
            <div className="rounded-lg border border-outline-variant/20 bg-surface-container p-4 font-body text-sm">
              <p className="font-headline font-bold text-primary">
                {data?.quiz?.title || "Quiz"}
              </p>
              <p className="mt-1 text-on-surface-variant">
                Course: {data?.quiz?.courseTitle || selectedCourse.title}
              </p>
              <p className="text-on-surface-variant">
                Block: {data?.quiz?.sectionName || "N/A"}
              </p>
              <p className="text-on-surface-variant">
                Lesson: {data?.quiz?.lessonTitle || "N/A"}
              </p>
              <p className="text-on-surface-variant">Attempt ID: {data?.attemptId}</p>
              <p className="mt-2 font-label font-bold text-primary">
                Score: {data?.score}/{data?.total}
              </p>
            </div>
            {!data?.quiz?.canViewAnswerKey ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 font-label text-xs text-amber-700">
                Answer key is hidden by instructor.
              </p>
            ) : (
              <div className="max-h-[45vh] space-y-2 overflow-auto">
                {(data?.questions || []).map((q: any, idx: number) => (
                  <div
                    key={q.id}
                    className="rounded-lg border border-outline-variant/20 bg-surface-container p-3 text-xs font-body"
                  >
                    <p className="font-label font-semibold text-primary">
                      Q{idx + 1}. {q.prompt}
                    </p>
                    <p className="text-on-surface-variant">
                      Your answer: {q.studentAnswer || "(no answer)"}
                    </p>
                    <p className="text-on-surface-variant">
                      Correct answer: {q.correctAnswer || "-"}
                    </p>
                    <p
                      className={
                        q.isCorrect ? "text-emerald-700" : "text-rose-700"
                      }
                    >
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
  );
}
