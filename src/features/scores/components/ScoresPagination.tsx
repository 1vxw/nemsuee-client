import type { InstructorViewMode } from "../types/scoreTypes";
import type { Dispatch, SetStateAction } from "react";

type ScoresPaginationProps = {
  instructorViewMode: InstructorViewMode;
  scoreBlockFilter: string;
  gradebookPagedRowsLength: number;
  gradebookSafePage: number;
  gradebookTotalPages: number;
  sortedGradebookRowsLength: number;
  visibleRowsLength: number;
  safePage: number;
  totalPages: number;
  pageSize: number;
  setScorePage: Dispatch<SetStateAction<number>>;
};

export function ScoresPagination({
  instructorViewMode,
  scoreBlockFilter,
  gradebookPagedRowsLength,
  gradebookSafePage,
  gradebookTotalPages,
  sortedGradebookRowsLength,
  visibleRowsLength,
  safePage,
  totalPages,
  pageSize,
  setScorePage,
}: ScoresPaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-4 py-2.5 font-label text-xs text-on-surface-variant">
      <p>
        {instructorViewMode === "GRADEBOOK"
          ? scoreBlockFilter !== "ALL"
            ? `Showing ${gradebookPagedRowsLength} student row${gradebookPagedRowsLength !== 1 ? "s" : ""} in ${scoreBlockFilter}`
            : `Showing ${(gradebookSafePage - 1) * pageSize + 1}-${Math.min(
                gradebookSafePage * pageSize,
                sortedGradebookRowsLength,
              )} of ${sortedGradebookRowsLength} students`
          : scoreBlockFilter !== "ALL"
            ? `Showing ${visibleRowsLength} submission${visibleRowsLength !== 1 ? "s" : ""} in ${scoreBlockFilter}`
            : totalPages <= 1
              ? `Showing ${visibleRowsLength} submission${visibleRowsLength !== 1 ? "s" : ""} in this course`
              : `Showing ${(safePage - 1) * pageSize + 1}-${Math.min(
                  safePage * pageSize,
                  visibleRowsLength,
                )} of ${visibleRowsLength} submissions`}
      </p>
      <div className="flex items-center gap-2">
        <button
          className="rounded-lg border border-outline-variant/40 px-2.5 py-1.5 hover:bg-surface-container transition-colors disabled:opacity-50"
          disabled={
            instructorViewMode === "GRADEBOOK"
              ? gradebookSafePage <= 1
              : safePage <= 1
          }
          onClick={() => setScorePage((p) => Math.max(1, p - 1))}
        >
          Previous
        </button>
        <span>
          {instructorViewMode === "GRADEBOOK"
            ? `${gradebookSafePage} / ${gradebookTotalPages}`
            : `${safePage} / ${totalPages}`}
        </span>
        <button
          className="rounded-lg border border-outline-variant/40 px-2.5 py-1.5 hover:bg-surface-container transition-colors disabled:opacity-50"
          disabled={
            instructorViewMode === "GRADEBOOK"
              ? gradebookSafePage >= gradebookTotalPages
              : safePage >= totalPages
          }
          onClick={() =>
            setScorePage((p) =>
              instructorViewMode === "GRADEBOOK"
                ? Math.min(gradebookTotalPages, p + 1)
                : Math.min(totalPages, p + 1),
            )
          }
        >
          Next
        </button>
      </div>
    </div>
  );
}
