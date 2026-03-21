import type { Dispatch, SetStateAction } from "react";
import type { GroupedRowsByBlockLesson, ScoreRow } from "../types/scoreTypes";

type InstructorLessonGroupsTableProps = {
  groupedRows: GroupedRowsByBlockLesson;
  collapsedLessons: Record<string, boolean>;
  collapsedLessonGroups: Record<string, boolean>;
  setCollapsedLessons: Dispatch<SetStateAction<Record<string, boolean>>>;
  setCollapsedLessonGroups: Dispatch<SetStateAction<Record<string, boolean>>>;
  onViewAttempt: (row: ScoreRow) => void;
};

export function InstructorLessonGroupsTable({
  groupedRows,
  collapsedLessons,
  collapsedLessonGroups,
  setCollapsedLessons,
  setCollapsedLessonGroups,
  onViewAttempt,
}: InstructorLessonGroupsTableProps) {
  return (
    <div className="space-y-2">
      {Object.entries(groupedRows).map(([block, rows]) => (
        <section
          key={block}
          className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest shadow-sm"
        >
          <button
            className="flex w-full items-center justify-between border-b border-outline-variant/20 bg-surface-container px-4 py-3 text-left"
            onClick={() =>
              setCollapsedLessons((prev) => ({
                ...prev,
                [block]: !prev[block],
              }))
            }
          >
            <span className="text-sm font-semibold tracking-wide text-slate-900">
              {block}
            </span>
            <span className="text-xs text-slate-500">
              {Object.values(rows).reduce((n, list) => n + list.length, 0)}
            </span>
          </button>
          {!collapsedLessons[block] && (
            <div className="space-y-2 p-2">
              {Object.entries(rows).map(([lesson, lessonRows]) => (
                <article
                  key={`${block}-${lesson}`}
                  className="overflow-x-auto rounded-lg border border-outline-variant/20"
                >
                  <button
                    className="flex w-full items-center justify-between border-b border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-left"
                    onClick={() =>
                      setCollapsedLessonGroups((prev) => ({
                        ...prev,
                        [`${block}::${lesson}`]: !prev[`${block}::${lesson}`],
                      }))
                    }
                  >
                    <span className="font-label text-sm font-bold text-primary">
                      {lesson}
                    </span>
                    <span className="font-label text-[11px] text-on-surface-variant">
                      {lessonRows.length} submission
                      {lessonRows.length > 1 ? "s" : ""} | Quiz |{" "}
                      {Math.max(
                        ...lessonRows.map((x) => Number(x.attempt.total || 0)),
                        0,
                      )}{" "}
                      questions
                    </span>
                  </button>
                  {!collapsedLessonGroups[`${block}::${lesson}`] && (
                    <table className="min-w-full text-xs">
                      <thead className="bg-surface-container font-label text-on-surface-variant">
                        <tr>
                          <th className="px-3 py-2 text-left">Student</th>
                          <th className="px-3 py-2 text-left">Attempt</th>
                          <th className="px-3 py-2 text-left">Score</th>
                          <th className="px-3 py-2 text-left">Status</th>
                          <th className="px-3 py-2 text-left">Submitted</th>
                          <th className="px-3 py-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lessonRows.map((row) => {
                          const a = row.attempt;
                          return (
                            <tr key={a.id} className="border-t border-slate-100">
                              <td className="px-3 py-2">{row.studentName || "-"}</td>
                              <td className="px-3 py-2 font-label text-[11px] text-on-surface-variant">
                                Latest
                                {row.attemptCount > 1 ? ` of ${row.attemptCount}` : ""}
                              </td>
                              <td className="px-3 py-2">
                                <p className="font-label font-bold text-primary">
                                  {a.score}/{a.total} ({Math.round(row.pct)}%)
                                </p>
                                <div className="mt-1 h-1.5 w-24 rounded bg-surface-container-high">
                                  <div
                                    className={`h-full rounded ${row.passed ? "bg-emerald-500" : "bg-rose-500"}`}
                                    style={{
                                      width: `${Math.max(
                                        0,
                                        Math.min(100, Math.round(row.pct)),
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <span
                                  className={`rounded px-2 py-0.5 ${row.passed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                                >
                                  {row.passed ? "Passed" : "Failed"}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                {new Date(
                                  (a as any)?.createdAt || Date.now(),
                                ).toLocaleString()}
                              </td>
                              <td className="px-3 py-2">
                                <button
                                  className="rounded-lg border border-outline-variant/40 px-2.5 py-1.5 font-label text-xs hover:bg-surface-container transition-colors"
                                  onClick={() => onViewAttempt(row)}
                                >
                                  View Attempt
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
