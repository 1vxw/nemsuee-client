import type {
  InstructorViewMode,
  ScoreSortBy,
  ScoreStatusFilter,
} from "../types/scoreTypes";
import type { Role } from "../../../shared/types/lms";

type ScoresFilterBarProps = {
  role: Role;
  scoreQuery: string;
  scoreLessonFilter: string;
  scoreBlockFilter: string;
  scoreStatusFilter: ScoreStatusFilter;
  scoreSortBy: ScoreSortBy;
  lessonOptions: string[];
  blockOptions: string[];
  instructorViewMode: InstructorViewMode;
  setScoreQuery: (value: string) => void;
  setScoreLessonFilter: (value: string) => void;
  setScoreBlockFilter: (value: string) => void;
  setScoreStatusFilter: (value: ScoreStatusFilter) => void;
  setScoreSortBy: (value: ScoreSortBy) => void;
  setInstructorViewMode: (value: InstructorViewMode) => void;
  setScorePage: (value: number) => void;
};

export function ScoresFilterBar({
  role,
  scoreQuery,
  scoreLessonFilter,
  scoreBlockFilter,
  scoreStatusFilter,
  scoreSortBy,
  lessonOptions,
  blockOptions,
  instructorViewMode,
  setScoreQuery,
  setScoreLessonFilter,
  setScoreBlockFilter,
  setScoreStatusFilter,
  setScoreSortBy,
  setInstructorViewMode,
  setScorePage,
}: ScoresFilterBarProps) {
  const controlClass = "h-9 rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 font-body text-xs text-on-surface";

  return (
    <div className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-3 md:p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]">
        <input
          value={scoreQuery}
          onChange={(e) => {
            setScoreQuery(e.target.value);
            setScorePage(1);
          }}
          className={`${controlClass} w-full`}
          placeholder={
            role === "INSTRUCTOR"
              ? "Search lesson, block, student"
              : "Search lesson, block"
          }
        />
        <select
          data-keep-action-text="true"
          value={scoreLessonFilter}
          onChange={(e) => {
            setScoreLessonFilter(e.target.value);
            setScorePage(1);
          }}
          className={controlClass}
        >
          <option value="ALL">All lessons</option>
          {lessonOptions.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select
          data-keep-action-text="true"
          value={scoreBlockFilter}
          onChange={(e) => {
            setScoreBlockFilter(e.target.value);
            setScorePage(1);
          }}
          className={controlClass}
        >
          <option value="ALL">All blocks</option>
          {blockOptions.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select
          data-keep-action-text="true"
          value={scoreStatusFilter}
          onChange={(e) =>
            setScoreStatusFilter(e.target.value as ScoreStatusFilter)
          }
          className={controlClass}
        >
          <option value="ALL">All statuses</option>
          <option value="PASSED">Passed</option>
          <option value="FAILED">Failed</option>
          {role === "STUDENT" && (
            <option value="HIDDEN">Hidden by instructor</option>
          )}
        </select>
      </div>
      <div className="mt-3 grid items-center gap-3 md:grid-cols-[220px_auto_1fr]">
        <select
          data-keep-action-text="true"
          value={scoreSortBy}
          onChange={(e) => setScoreSortBy(e.target.value as ScoreSortBy)}
          className={controlClass}
        >
          <option value="NEWEST">Newest</option>
          <option value="OLDEST">Oldest</option>
          <option value="PCT_DESC">Highest %</option>
          <option value="PCT_ASC">Lowest %</option>
          <option value="STUDENT_ASC">Student A-Z</option>
          <option value="STUDENT_DESC">Student Z-A</option>
          <option value="LESSON_ASC">Lesson A-Z</option>
          <option value="LESSON_DESC">Lesson Z-A</option>
        </select>
        {role === "INSTRUCTOR" && (
          <div className="inline-flex overflow-hidden rounded-lg border border-outline-variant/40 text-xs font-label">
          <button
            className={`px-3 py-2 font-bold transition-colors ${instructorViewMode === "GRADEBOOK" ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"}`}
            onClick={() => {
              setInstructorViewMode("GRADEBOOK");
              setScorePage(1);
            }}
          >
            Gradebook View
          </button>
          <button
            className={`px-3 py-2 font-bold transition-colors ${instructorViewMode === "LESSON" ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"}`}
            onClick={() => {
              setInstructorViewMode("LESSON");
              setScorePage(1);
            }}
          >
            Lesson View
          </button>
          </div>
        )}
        <div className="flex justify-start md:justify-end">
          <button
            data-keep-action-text="true"
            className="h-9 rounded-lg border border-outline-variant/40 px-3 font-label text-xs text-on-surface hover:bg-surface-container transition-colors"
            onClick={() => {
              setScoreQuery("");
              setScoreLessonFilter("ALL");
              setScoreBlockFilter("ALL");
              setScoreStatusFilter("ALL");
              setScoreSortBy("NEWEST");
              if (role === "INSTRUCTOR") setInstructorViewMode("GRADEBOOK");
              setScorePage(1);
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
}
