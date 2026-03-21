import type { ScoreRow } from "../types/scoreTypes";

type StudentScoresListProps = {
  rows: ScoreRow[];
  onViewResult: (row: ScoreRow) => Promise<void>;
};

export function StudentScoresList({
  rows,
  onViewResult,
}: StudentScoresListProps) {
  return (
    <>
      {rows.map((row) => {
        const { attempt: a, canShowInScores, pct, passed } = row;
        return (
          <article
            key={a.id}
            className={`rounded-lg border p-3 text-sm font-body ${canShowInScores ? (passed ? "border-emerald-200 bg-emerald-50" : "border-error-container/50 bg-error-container/20") : "border-outline-variant/20 bg-surface-container"}`}
          >
            <p className="font-label font-medium text-primary">{a.quiz.lesson.title}</p>
            <p className="text-xs text-on-surface-variant font-label">
              {(a as any)?.quiz?.lesson?.sectionName
                ? `${(a as any).quiz.lesson.sectionName}`
                : ""}
            </p>
            {!canShowInScores && (
              <p className="text-xs text-slate-500">
                Result hidden by instructor.
              </p>
            )}
            {a.student && <p>{a.student.fullName}</p>}
            {canShowInScores && (
              <button
                className="mt-2 rounded-lg border border-outline-variant/40 p-2 hover:bg-surface-container transition-colors"
                title="View quiz result"
                aria-label="View quiz result"
                onClick={() => onViewResult(row)}
              >
                <span className="material-symbols-outlined text-[1rem]">visibility</span>
              </button>
            )}
            {canShowInScores && (
              <p className="mt-1 font-label text-xs text-on-surface-variant">
                {a.score}/{a.total} ({Math.round(pct)}%)
              </p>
            )}
          </article>
        );
      })}
    </>
  );
}
