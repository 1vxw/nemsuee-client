import type { Attempt, Course, TeachingBlock, User, ViewKey } from "../../../shared/types/lms";

type DashboardProps = {
  user: User;
  courses: Course[];
  archivedCourses: Course[];
  teachingBlocks: TeachingBlock[];
  attempts: Attempt[];
  lastSync: Date | null;
  onNavigate: (view: ViewKey) => void;
  onRefresh: () => void;
  hideLmsSisFeatures: boolean;
};

type AttemptSummary = {
  score: number;
  total: number;
  count: number;
};

const cardAccents = [
  "border-secondary",
  "border-primary",
  "border-tertiary-container",
  "border-primary-container",
];

function titleTag(title: string): string {
  const normalized = title.toLowerCase();
  if (normalized.includes("math") || normalized.includes("algebra")) return "Mathematics";
  if (normalized.includes("science") || normalized.includes("physics") || normalized.includes("bio")) return "Core Science";
  if (normalized.includes("eng") || normalized.includes("lit") || normalized.includes("rhetoric")) return "Humanities";
  if (normalized.includes("comp") || normalized.includes("program")) return "Technology";
  return "Academic";
}

function computeCourseProgress(course: Course, summary?: AttemptSummary): number {
  if (summary && summary.total > 0) {
    return Math.max(0, Math.min(100, Math.round((summary.score / summary.total) * 100)));
  }

  const lessonCount = course.sections.reduce((sum, section) => sum + section.lessons.length, 0);
  if (!lessonCount) return 0;
  return Math.max(12, Math.min(85, lessonCount * 12));
}

function greetingName(fullName: string): string {
  const first = fullName.trim().split(" ")[0];
  return first || "Student";
}

export function StudentDashboard(props: DashboardProps) {
  const completion = props.attempts.length
    ? Math.round(
        props.attempts.reduce(
          (sum, attempt) => sum + (attempt.score / Math.max(1, attempt.total)) * 100,
          0,
        ) / props.attempts.length,
      )
    : 0;

  const attemptsByCourse = props.attempts.reduce<Record<number, AttemptSummary>>((acc, attempt) => {
    const courseId = attempt.quiz.lesson.course.id;
    const existing = acc[courseId] ?? { score: 0, total: 0, count: 0 };
    existing.score += attempt.score;
    existing.total += attempt.total;
    existing.count += 1;
    acc[courseId] = existing;
    return acc;
  }, {});

  const featuredCourses = props.courses.slice(0, 4);
  const recentAttempts = props.attempts.slice(0, 5);

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary to-primary-container p-6 text-white sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <h1 className="font-headline text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
            Welcome back, {greetingName(props.user.fullName)}
          </h1>
          <p className="mt-2 max-w-xl font-body text-sm text-primary-fixed opacity-95 sm:text-base">
            You have completed {completion}% of your current semester goals. Continue your momentum and finish this week strong.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => props.onNavigate("courses")}
              className="rounded-lg bg-secondary-container px-4 py-2 font-label text-sm font-semibold text-on-secondary-container transition-transform hover:scale-[1.02]"
            >
              Resume Learning
            </button>
            <button
              data-keep-action-text="true"
              onClick={props.onRefresh}
              className="rounded-md border border-white/25 bg-white/10 px-4 py-2 font-label text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              Refresh
            </button>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-24 -top-16 h-72 w-72 rounded-full bg-secondary/30 blur-3xl" />
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="space-y-4 xl:col-span-2">
          <div className="flex items-end justify-between">
            <h2 className="font-headline text-lg font-bold text-primary sm:text-xl">Currently Enrolled Courses</h2>
            <button
              onClick={() => props.onNavigate("courses")}
              className="flex items-center gap-1 font-label text-sm font-bold text-secondary hover:text-primary"
            >
              View All
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>

          {featuredCourses.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {featuredCourses.map((course, idx) => {
                const progress = computeCourseProgress(course, attemptsByCourse[course.id]);
                return (
                  <article
                    key={course.id}
                    className={`border-t-2 ${cardAccents[idx % cardAccents.length]} bg-surface-container-lowest p-4 shadow-sm shadow-primary/5 transition-transform duration-300 hover:-translate-y-0.5 sm:p-5`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="rounded-full bg-primary-fixed px-3 py-1 font-label text-xs font-bold text-on-primary-fixed">
                        {titleTag(course.title)}
                      </span>
                      <span className="material-symbols-outlined text-outline">more_vert</span>
                    </div>
                    <h3 className="line-clamp-2 font-headline text-base font-bold text-primary sm:text-lg">{course.title}</h3>
                    <p className="mt-1.5 line-clamp-2 font-body text-sm text-on-surface-variant">
                      {course.description || "Course details and learning materials are available in this class."}
                    </p>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between font-label text-xs font-bold text-on-surface-variant">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-primary-fixed">
                        <div className="h-full rounded-full bg-tertiary-fixed" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <article className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-5">
              <h3 className="font-headline text-base font-bold text-primary sm:text-lg">No active courses yet</h3>
              <p className="mt-2 font-body text-sm text-on-surface-variant">
                Start by exploring available subjects and enrolling in a class.
              </p>
              <button
                onClick={() => props.onNavigate("course_search")}
                className="mt-4 rounded-md bg-secondary-container px-4 py-2 font-label text-sm font-bold text-on-secondary-container"
              >
                Browse Course Catalog
              </button>
            </article>
          )}
        </section>

        <aside className="space-y-4">
          <article className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm shadow-primary/5">
            <h3 className="mb-3 flex items-center gap-2 font-headline text-base font-bold text-primary">
              <span className="material-symbols-outlined text-secondary text-lg">event_upcoming</span>
              Upcoming Blocks
            </h3>
            <div className="space-y-3">
              {props.teachingBlocks.length ? (
                props.teachingBlocks.slice(0, 4).map((block) => (
                  <div key={block.id} className="bg-surface-container p-3">
                    <p className="font-label text-xs font-bold uppercase tracking-wide text-secondary">{block.name}</p>
                    <p className="mt-1 line-clamp-1 font-body text-sm font-semibold text-primary">{block.courseTitle}</p>
                  </div>
                ))
              ) : (
                <p className="font-body text-sm text-on-surface-variant">No blocks scheduled yet.</p>
              )}
            </div>
          </article>

          <article className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm shadow-primary/5">
            <h3 className="mb-3 flex items-center gap-2 font-headline text-base font-bold text-primary">
              <span className="material-symbols-outlined text-tertiary text-lg">analytics</span>
              Recent Quiz Attempts
            </h3>
            <div className="space-y-3">
              {recentAttempts.length ? (
                recentAttempts.map((attempt) => {
                  const scorePercent = Math.round((attempt.score / Math.max(1, attempt.total)) * 100);
                  return (
                    <div key={attempt.id} className="rounded-lg bg-surface-container p-3">
                      <p className="line-clamp-1 font-body text-sm font-semibold text-primary">
                        {attempt.quiz.lesson.title}
                      </p>
                      <p className="mt-1 font-label text-xs text-on-surface-variant">
                        {attempt.quiz.lesson.course.title}
                      </p>
                      <p className="mt-1 font-label text-xs font-bold text-secondary">
                        Score: {attempt.score}/{attempt.total} ({scorePercent}%)
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="font-body text-sm text-on-surface-variant">No attempts yet. Take your first quiz to see performance data.</p>
              )}
            </div>
          </article>

          <article className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm shadow-primary/5">
            <h3 className="mb-3 font-headline text-base font-bold text-primary">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => props.onNavigate("courses")}
                className="rounded-md border border-outline-variant/60 px-3 py-2 text-left font-label text-sm font-bold text-primary transition-colors hover:bg-surface-container"
              >
                Open My Courses
              </button>
              {!props.hideLmsSisFeatures && (
                <button
                  onClick={() => props.onNavigate("scores")}
                  className="rounded-md border border-outline-variant/60 px-3 py-2 text-left font-label text-sm font-bold text-primary transition-colors hover:bg-surface-container"
                >
                  View Grades
                </button>
              )}
              <button
                onClick={() => props.onNavigate("profile")}
                className="rounded-md border border-outline-variant/60 px-3 py-2 text-left font-label text-sm font-bold text-primary transition-colors hover:bg-surface-container"
              >
                Edit Profile
              </button>
            </div>
            <p className="mt-4 font-label text-[11px] uppercase tracking-widest text-outline">
              Last sync: {props.lastSync ? props.lastSync.toLocaleTimeString() : "not yet"}
            </p>
          </article>
        </aside>
      </div>
    </section>
  );
}
