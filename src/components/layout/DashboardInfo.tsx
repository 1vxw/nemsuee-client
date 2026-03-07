import type {
  Attempt,
  Course,
  Role,
  TeachingBlock,
  User,
  ViewKey,
} from "../../types/lms";

export function DashboardInfo({
  user,
  role,
  courses,
  archivedCourses = [],
  teachingBlocks = [],
  attempts,
  lastSync,
  onNavigate,
  onRefresh,
}: {
  user: User;
  role: Role;
  courses: Course[];
  archivedCourses?: Course[];
  teachingBlocks?: TeachingBlock[];
  attempts: Attempt[];
  lastSync: Date | null;
  onNavigate: (view: ViewKey) => void;
  onRefresh: () => void;
}) {
  const lessonsCount = courses.reduce(
    (sum, course) =>
      sum +
      course.sections.reduce(
        (secSum, section) => secSum + section.lessons.length,
        0,
      ),
    0,
  );
  const recentCourses = courses.slice(0, 4);
  const recentAttempts = attempts.slice(0, 5);
  const avgScore = attempts.length
    ? Math.round(
        attempts.reduce(
          (a, x) => a + (x.score / Math.max(1, x.total)) * 100,
          0,
        ) / attempts.length,
      )
    : 0;

  return (
    <section className="space-y-4 text-sm">
      <article className="rounded-md border border-slate-200 bg-slate-50 p-4">
        <p className="text-lg font-semibold">Welcome back, {user.fullName}</p>
        <p className="text-slate-600">
          {role === "ADMIN" &&
            "Manage subjects, blocks, and instructor assignments."}
          {role === "INSTRUCTOR" &&
            "Manage your assigned blocks, content, and student progress."}
          {role === "STUDENT" &&
            "Track your courses, lesson content, quizzes, and scores."}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Last sync: {lastSync ? lastSync.toLocaleString() : "Not synced yet"}
        </p>
      </article>

      <article className="rounded-md border border-slate-200 bg-slate-50 p-4">
        <p className="mb-2 font-semibold">Quick Actions</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {role === "ADMIN" ? (
            <button
              onClick={() => onNavigate("admin_blocks")}
              className="rounded bg-blue-700 px-3 py-2 text-white"
            >
              Open Block Admin
            </button>
          ) : (
            <button
              onClick={() =>
                onNavigate(role === "INSTRUCTOR" ? "courses" : "course_search")
              }
              className="rounded bg-blue-700 px-3 py-2 text-white"
            >
              {role === "INSTRUCTOR" ? "Open Teaching Hub" : "Search Courses"}
            </button>
          )}
          {role !== "ADMIN" && (
            <button
              onClick={() => onNavigate("scores")}
              className="rounded border border-slate-300 bg-white px-3 py-2"
            >
              {role === "INSTRUCTOR" ? "Student Scores" : "My Scores"}
            </button>
          )}
          <button
            onClick={() => onNavigate("storage")}
            className="rounded border border-slate-300 bg-white px-3 py-2"
          >
            My Storage
          </button>
          <button
            onClick={() => onNavigate("profile")}
            className="rounded border border-slate-300 bg-white px-3 py-2"
          >
            Profile
          </button>
          <button
            onClick={onRefresh}
            className="rounded border border-slate-300 bg-white px-3 py-2"
          >
            Refresh Data
          </button>
        </div>
      </article>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <article className="rounded-md border border-slate-200 bg-white p-4">
          <p className="mb-2 font-semibold">
            {role === "ADMIN" ? "Administration Snapshot" : "Course Snapshot"}
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {role === "ADMIN" ? (
              <>
                <p className="rounded bg-slate-50 p-2">
                  Total Courses: {courses.length}
                </p>
                <p className="rounded bg-slate-50 p-2">
                  Total Blocks:{" "}
                  {courses.reduce((a, c) => a + c.sections.length, 0)}
                </p>
                <p className="rounded bg-slate-50 p-2">
                  Archived: {archivedCourses.length}
                </p>
              </>
            ) : role === "INSTRUCTOR" ? (
              <>
                <p className="rounded bg-slate-50 p-2">
                  Courses: {courses.length}
                </p>
                <p className="rounded bg-slate-50 p-2">
                  Assigned Blocks: {teachingBlocks.length}
                </p>
                <p className="rounded bg-slate-50 p-2">
                  Lessons: {lessonsCount}
                </p>
              </>
            ) : (
              <>
                <p className="rounded bg-slate-50 p-2">
                  Courses: {courses.length}
                </p>
                <p className="rounded bg-slate-50 p-2">
                  Lessons: {lessonsCount}
                </p>
                <p className="rounded bg-slate-50 p-2">
                  Average Score: {avgScore}%
                </p>
              </>
            )}
          </div>
          <div className="mt-3 space-y-2">
            {recentCourses.length ? (
              recentCourses.map((course) => (
                <div
                  key={course.id}
                  className="rounded border border-slate-200 p-2"
                >
                  <p className="font-medium">{course.title}</p>
                  <p className="text-xs text-slate-500">
                    {course.sections.length} block(s)
                  </p>
                </div>
              ))
            ) : (
              <p className="text-slate-500">No courses yet.</p>
            )}
          </div>
        </article>

        <article className="rounded-md border border-slate-200 bg-white p-4">
          <p className="mb-2 font-semibold">
            {role === "INSTRUCTOR"
              ? "Recent Student Attempts"
              : role === "ADMIN"
                ? "Admin Shortcuts"
                : "Recent Quiz Attempts"}
          </p>
          {role === "ADMIN" ? (
            <div className="space-y-2">
              <button
                onClick={() => onNavigate("admin_blocks")}
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-left"
              >
                Manage Courses and Blocks
              </button>
              <button
                onClick={() => onNavigate("storage")}
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-left"
              >
                Open Files Hub
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentAttempts.length ? (
                recentAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="rounded border border-slate-200 p-2"
                  >
                    <p className="font-medium">{attempt.quiz.lesson.title}</p>
                    <p className="text-xs text-slate-600">
                      {attempt.score}/{attempt.total}
                      {attempt.student ? ` - ${attempt.student.fullName}` : ""}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">No attempts yet.</p>
              )}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
