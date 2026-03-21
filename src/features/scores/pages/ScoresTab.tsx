import { useState } from "react";
import type { Attempt, Course, User } from "../../../shared/types/lms";
import { InstructorGradebookTable } from "../components/InstructorGradebookTable";
import { InstructorLessonGroupsTable } from "../components/InstructorLessonGroupsTable";
import { ScoreAttemptDetailsModal } from "../components/ScoreAttemptDetailsModal";
import { ScoreResultModal } from "../components/ScoreResultModal";
import { ScoreSummaryStats } from "../components/ScoreSummaryStats";
import { ScoresFilterBar } from "../components/ScoresFilterBar";
import { ScoresPagination } from "../components/ScoresPagination";
import { StudentScoresList } from "../components/StudentScoresList";
import { useScoresViewModel } from "../hooks/useScoresViewModel";
import type { ScoreRow } from "../types/scoreTypes";

type ScoresTabProps = {
  selectedCourse: Course;
  attempts: Attempt[];
  user: User;
  api: any;
  headers: any;
  setMessage: (m: string) => void;
};

export function ScoresTab({
  selectedCourse,
  attempts,
  user,
  api,
  headers,
  setMessage,
}: ScoresTabProps) {
  const vm = useScoresViewModel(selectedCourse, attempts, user);
  const [viewResultOpen, setViewResultOpen] = useState(false);
  const [viewResultLoading, setViewResultLoading] = useState(false);
  const [viewResultData, setViewResultData] = useState<any | null>(null);
  const [selectedCellAttempt, setSelectedCellAttempt] = useState<ScoreRow | null>(
    null,
  );
  const [attemptDetailsLoading, setAttemptDetailsLoading] = useState(false);
  const [attemptDetailsError, setAttemptDetailsError] = useState<string | null>(null);
  const [attemptDetailsData, setAttemptDetailsData] = useState<any | null>(null);

  const handleStudentViewResult = async (row: ScoreRow) => {
    const a = row.attempt as any;
    try {
      setViewResultLoading(true);
      setViewResultOpen(true);
      const quizId = Number(a?.quiz?.id || a?.quizId || 0);
      const data = await api(`/quizzes/${quizId}/results/me`, { headers });
      setViewResultData(data);
    } catch (e) {
      setMessage((e as Error).message);
      setViewResultOpen(false);
    } finally {
      setViewResultLoading(false);
    }
  };

  const handleInstructorViewAttempt = async (row: ScoreRow) => {
    setSelectedCellAttempt(row);
    setAttemptDetailsData(null);
    setAttemptDetailsError(null);
    try {
      setAttemptDetailsLoading(true);
      const attemptId = Number((row.attempt as any)?.id || 0);
      const quizId = Number((row.attempt as any)?.quiz?.id || (row.attempt as any)?.quizId || 0);
      if (!attemptId || !quizId) {
        throw new Error("Attempt details are unavailable for this row.");
      }
      const data = await api(`/quizzes/${quizId}/results/attempt/${attemptId}`, {
        headers,
      });
      setAttemptDetailsData(data);
    } catch (e) {
      setAttemptDetailsError((e as Error).message);
    } finally {
      setAttemptDetailsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {user.role === "INSTRUCTOR" && (
        <section>
          <ScoreSummaryStats
            totalSubmissions={vm.totalSubmissions}
            passedCount={vm.passedCount}
            failedCount={vm.failedCount}
            averageScore={vm.averageScore}
          />
        </section>
      )}

      <section>
        <ScoresFilterBar
          role={user.role}
          scoreQuery={vm.scoreQuery}
          scoreLessonFilter={vm.scoreLessonFilter}
          scoreBlockFilter={vm.scoreBlockFilter}
          scoreStatusFilter={vm.scoreStatusFilter}
          scoreSortBy={vm.scoreSortBy}
          lessonOptions={vm.lessonOptions}
          blockOptions={vm.blockOptions}
          instructorViewMode={vm.instructorViewMode}
          setScoreQuery={vm.setScoreQuery}
          setScoreLessonFilter={vm.setScoreLessonFilter}
          setScoreBlockFilter={vm.setScoreBlockFilter}
          setScoreStatusFilter={vm.setScoreStatusFilter}
          setScoreSortBy={vm.setScoreSortBy}
          setInstructorViewMode={vm.setInstructorViewMode}
          setScorePage={vm.setScorePage}
        />
      </section>

      {user.role === "INSTRUCTOR" ? (
        vm.instructorViewMode === "GRADEBOOK" ? (
          <InstructorGradebookTable
            rows={vm.gradebookPagedRows}
            lessonColumns={vm.gradebookLessonColumns}
            onSelectCell={handleInstructorViewAttempt}
          />
        ) : (
          <InstructorLessonGroupsTable
            groupedRows={vm.groupedRows}
            collapsedLessons={vm.collapsedLessons}
            collapsedLessonGroups={vm.collapsedLessonGroups}
            setCollapsedLessons={vm.setCollapsedLessons}
            setCollapsedLessonGroups={vm.setCollapsedLessonGroups}
            onViewAttempt={handleInstructorViewAttempt}
          />
        )
      ) : (
        <StudentScoresList
          rows={vm.visibleRows}
          onViewResult={handleStudentViewResult}
        />
      )}

      {!vm.visibleRows.length && (
        <p className="font-body text-sm text-on-surface-variant">No scores for this course yet.</p>
      )}

      {user.role === "INSTRUCTOR" && vm.visibleRows.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-end gap-2">
            <label className="font-label text-xs text-on-surface-variant">Rows per page</label>
            <select
              data-keep-action-text="true"
              value={vm.pageSize}
              onChange={(e) => {
                vm.setPageSize(Number(e.target.value));
                vm.setScorePage(1);
              }}
              className="h-8 rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-2 font-body text-xs text-on-surface"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          <ScoresPagination
            instructorViewMode={vm.instructorViewMode}
            scoreBlockFilter={vm.scoreBlockFilter}
            gradebookPagedRowsLength={vm.gradebookPagedRows.length}
            gradebookSafePage={vm.gradebookSafePage}
            gradebookTotalPages={vm.gradebookTotalPages}
            sortedGradebookRowsLength={vm.sortedGradebookStudentRows.length}
            visibleRowsLength={vm.visibleRows.length}
            safePage={vm.safePage}
            totalPages={vm.totalPages}
            pageSize={vm.pageSize}
            setScorePage={vm.setScorePage}
          />
        </div>
      )}

      <ScoreAttemptDetailsModal
        selectedCellAttempt={selectedCellAttempt}
        loading={attemptDetailsLoading}
        details={attemptDetailsData}
        error={attemptDetailsError}
        onClose={() => {
          setSelectedCellAttempt(null);
          setAttemptDetailsData(null);
          setAttemptDetailsError(null);
        }}
      />

      <ScoreResultModal
        open={viewResultOpen}
        loading={viewResultLoading}
        data={viewResultData}
        selectedCourse={selectedCourse}
        onClose={() => {
          setViewResultOpen(false);
          setViewResultData(null);
        }}
      />
    </div>
  );
}
