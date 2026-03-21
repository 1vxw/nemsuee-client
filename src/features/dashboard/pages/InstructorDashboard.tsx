import { useEffect, useMemo, useState } from "react";
import type {
  Attempt,
  Course,
  TeachingBlock,
  User,
  ViewKey,
} from "../../../shared/types/lms";

const FACULTY_QUOTES: { text: string; author: string }[] = [
  {
    text: "The library of wisdom is not built of bricks, but of the persistent inquiries of the mind.",
    author: "Archival Inscription, Hall of Athenaeum",
  },
  {
    text: "Computer Science is no more about computers than astronomy is about telescopes.",
    author: "Edsger W. Dijkstra",
  },
  {
    text: "First, solve the problem. Then, write the code.",
    author: "John Johnson",
  },
];

type DashboardProps = {
  user: User;
  courses: Course[];
  archivedCourses: Course[];
  teachingBlocks: TeachingBlock[];
  attempts: Attempt[];
  lastSync: Date | null;
  onNavigate: (view: ViewKey) => void;
  onRefresh: () => void;
  onOpenCourse?: (courseId: number) => void;
  hideLmsSisFeatures: boolean;
  api: (
    path: string,
    opts?: { headers?: Record<string, string> }
  ) => Promise<unknown>;
  headers: Record<string, string>;
};

type TermContext = {
  semester: string;
  academicYear: string;
  activePeriod?: string;
  gradingPeriod?: string;
};

type TermActive = {
  name?: string;
  academicYear?: string;
  startDate?: string | null;
  endDate?: string | null;
};

type SectionWithEnrollments = { id: number; name: string; enrollments?: { student?: { id: number } }[] };

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}M AGO`;
  if (diffHours < 24) return `${diffHours}H AGO`;
  if (diffDays === 1) return "YESTERDAY";
  if (diffDays < 7) return `${diffDays}D AGO`;
  return date.toLocaleDateString();
}

function getWeekProgress(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): { week: number; total: number; pct: number } {
  const total = 14;
  if (!startDate || !endDate) return { week: 1, total, pct: 0.1 };
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  if (now <= start) return { week: 1, total, pct: 0.07 };
  if (now >= end) return { week: total, total, pct: 1 };
  const elapsed = now - start;
  const duration = end - start;
  const pct = Math.min(1, Math.max(0, elapsed / duration));
  const week = Math.max(1, Math.min(total, Math.ceil(pct * total)));
  return { week, total, pct };
}

export function InstructorDashboard(props: DashboardProps) {
  const {
    user,
    courses,
    teachingBlocks,
    attempts,
    lastSync,
    onNavigate,
    onOpenCourse,
    hideLmsSisFeatures,
    api,
    headers,
  } = props;

  const [termContext, setTermContext] = useState<TermContext | null>(null);
  const [termActive, setTermActive] = useState<TermActive | null>(null);
  const [quote] = useState(
    () => FACULTY_QUOTES[Math.floor(Math.random() * FACULTY_QUOTES.length)]
  );

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api("/terms/context", { headers }).catch(() => null),
      api("/terms/active", { headers }).catch(() => null),
    ]).then(([ctx, active]) => {
      if (!mounted) return;
      setTermContext(ctx as TermContext | null);
      setTermActive(active as TermActive | null);
    });
    return () => {
      mounted = false;
    };
  }, [api, headers]);

  const { week, total, pct } = useMemo(
    () =>
      getWeekProgress(
        termActive?.startDate,
        termActive?.endDate
      ),
    [termActive?.startDate, termActive?.endDate]
  );

  const courseStats = useMemo(() => {
    const byCourse = new Map<
      number,
      { enrolled: number; avgGrade: number; pending: number; category: string }
    >();
    const blockSectionIds = new Set(teachingBlocks.map((b) => b.id));

    for (const course of courses) {
      let enrolled = 0;
      for (const section of course.sections as SectionWithEnrollments[]) {
        if (!blockSectionIds.has(section.id)) continue;
        const enrols = section.enrollments || [];
        enrolled += enrols.filter((e) => e?.student?.id).length;
      }
      const courseAttempts = attempts.filter(
        (a) => (a.quiz as { lesson?: { course?: { id?: number } } }).lesson?.course?.id === course.id
      );
      const pending = courseAttempts.length;
      const avgGrade =
        courseAttempts.length > 0
          ? Math.round(
              courseAttempts.reduce(
                (s, a) => s + (a.total > 0 ? (a.score / a.total) * 100 : 0),
                0
              ) / courseAttempts.length
            )
          : 0;
      const category = course.term?.name || "Academic";
      byCourse.set(course.id, { enrolled, avgGrade, pending, category });
    }
    return byCourse;
  }, [courses, teachingBlocks, attempts]);

  const engagementByWeek = useMemo(() => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const buckets: number[] = Array(6).fill(0);
    for (const a of attempts) {
      const at = new Date((a as unknown as { createdAt?: string }).createdAt || 0).getTime();
      if (at < thirtyDaysAgo) continue;
      const idx = Math.min(5, Math.floor((at - thirtyDaysAgo) / weekMs));
      buckets[idx]++;
    }
    const max = Math.max(1, ...buckets);
    return buckets.map((c) => (c / max) * 100);
  }, [attempts]);

  const sortedSubmissions = useMemo(() => {
    return [...attempts]
      .sort((a, b) => {
        const at = new Date((a as unknown as { createdAt?: string }).createdAt || 0).getTime();
        const bt = new Date((b as unknown as { createdAt?: string }).createdAt || 0).getTime();
        return bt - at;
      })
      .slice(0, 6);
  }, [attempts]);

  const firstName = user.fullName.split(" ")[0] || "Professor";

  const activeCourses = courses.slice(0, 4);

  return (
    <section className="space-y-4 sm:space-y-6 md:space-y-7">
      {/* Hero - mobile first */}
      <section className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-headline text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2 md:mb-3 leading-tight">
            Instructor Dashboard
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant max-w-lg">
            Welcome back, {firstName}.{" "}
            {attempts.length > 0
              ? `You have ${attempts.length} submission${attempts.length === 1 ? "" : "s"} waiting for review across your courses.`
              : "No pending submissions at the moment."}
          </p>
          {lastSync && (
            <p className="mt-2 text-xs text-outline">
              Last sync: {lastSync.toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex flex-col items-start sm:items-end shrink-0">
          <span className="text-[10px] sm:text-xs text-outline uppercase tracking-widest font-bold mb-2">
            Term Progress
          </span>
          <div className="w-32 sm:w-40 h-2 bg-primary-fixed rounded-full overflow-hidden">
            <div
              className="h-full bg-tertiary-fixed-dim transition-all duration-300"
              style={{ width: `${pct * 100}%` }}
            />
          </div>
          <span className="text-xs sm:text-sm font-body mt-2 text-primary font-semibold">
            Week {week} of {total}
          </span>
          {termContext && (
            <span className="text-xs text-on-surface-variant mt-1">
              {termContext.semester} · {termContext.academicYear}
            </span>
          )}
        </div>
      </section>

      {/* Active Courses - mobile first grid */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="font-headline text-lg sm:text-xl font-bold text-primary">
            Active Courses
          </h2>
          <button
            onClick={() => onNavigate("course_catalog")}
            className="text-primary font-semibold flex items-center gap-1 hover:underline text-xs sm:text-sm"
          >
            View All Catalogs
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
          {activeCourses.map((course, idx) => {
            const stats = courseStats.get(course.id) || {
              enrolled: 0,
              avgGrade: 0,
              pending: 0,
              category: "Academic",
            };
            const isFeatured = idx === 0;
            return (
              <div
                key={course.id}
                onClick={() => (onOpenCourse ? onOpenCourse(course.id) : onNavigate("courses"))}
                className={`bg-surface-container-lowest p-4 sm:p-5 border-t-2 group hover:shadow-xl transition-all duration-300 cursor-pointer ${
                  isFeatured
                    ? "md:col-span-2 border-secondary"
                    : "border-primary-container"
                }`}
              >
                <div className="flex flex-col h-full">
                  <div
                    className={`flex flex-col sm:flex-row justify-between items-start gap-4 ${
                      isFeatured ? "mb-6" : "mb-4"
                    }`}
                  >
                    <div>
                      <span
                        className={`inline-block text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter ${
                          idx === 0
                            ? "bg-tertiary-container text-on-tertiary-container"
                            : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        {stats.category}
                      </span>
                      <h3
                        className={`font-headline font-bold mt-4 group-hover:text-primary transition-colors ${
                          isFeatured ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"
                        }`}
                      >
                        {course.title}
                      </h3>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <div
                        className={`font-headline font-bold ${
                          isFeatured ? "text-2xl sm:text-3xl text-secondary" : "text-xl sm:text-2xl text-primary"
                        }`}
                      >
                        {stats.avgGrade}%
                      </div>
                      <div className="text-[10px] sm:text-xs text-outline uppercase font-bold">
                        Avg. Grade
                      </div>
                    </div>
                  </div>
                  <div
                    className={`mt-auto pt-4 border-t border-surface-variant/30 ${
                      isFeatured
                        ? "grid grid-cols-3 gap-4"
                        : "space-y-3"
                    }`}
                  >
                    {isFeatured ? (
                      <>
                        <div>
                          <div className="text-lg sm:text-xl font-bold">
                            {stats.enrolled}
                          </div>
                          <div className="text-xs text-on-surface-variant">
                            Enrolled Students
                          </div>
                        </div>
                        <div>
                          <div className="text-lg sm:text-xl font-bold">
                            {attempts.filter(
                              (a) =>
                                (a.quiz as { lesson?: { course?: { id?: number } } }).lesson
                                  ?.course?.id === course.id
                            ).length}
                          </div>
                          <div className="text-xs text-on-surface-variant">
                            Pending Tasks
                          </div>
                        </div>
                        <div>
                          <div className="text-lg sm:text-xl font-bold">
                            {teachingBlocks.filter((b) => b.courseId === course.id).length}
                          </div>
                          <div className="text-xs text-on-surface-variant">
                            Blocks
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-on-surface-variant">Students</span>
                          <span className="font-bold">{stats.enrolled}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-on-surface-variant">Pending</span>
                          <span className="font-bold text-tertiary-fixed-variant">
                            {stats.pending}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <button
            onClick={() => onNavigate("archives")}
            className="md:col-span-2 bg-surface-container-low border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center p-5 sm:p-6 opacity-60 hover:opacity-100 transition-opacity cursor-pointer rounded-lg"
          >
            <span className="material-symbols-outlined text-3xl sm:text-4xl mb-2">
              add_circle
            </span>
            <span className="font-headline font-bold text-lg sm:text-xl">
              Archive New Curriculum
            </span>
            <span className="text-sm font-label text-outline mt-1 italic">
              View archived courses
            </span>
          </button>
        </div>
      </section>

      {/* Bottom: Engagement + Submissions - mobile stacked, lg side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7">
        {/* Engagement Chart */}
        <section className="lg:col-span-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="font-headline text-lg sm:text-xl font-bold text-primary">
                Student Engagement
              </h2>
              <p className="text-sm text-on-surface-variant">
                Quiz submissions across all modules (last 30 days)
              </p>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-4 sm:p-5 min-h-[220px] sm:min-h-[260px] lg:min-h-[300px] flex flex-col relative rounded-lg border border-outline-variant/20">
            <div className="flex-1 flex items-end gap-2 sm:gap-3 border-l-2 border-b-2 border-surface-variant/50 mb-4 sm:mb-5 pt-3 px-2 sm:px-3 relative">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-t border-outline" />
                <div className="border-t border-outline" />
                <div className="border-t border-outline" />
                <div className="border-t border-outline" />
              </div>
              {engagementByWeek.map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 min-w-[20px] sm:min-w-0 transition-all rounded-t-sm ${
                    i === engagementByWeek.length - 1
                      ? "bg-secondary hover:bg-secondary/80"
                      : "bg-primary/10 hover:bg-primary/20"
                  }`}
                  style={{ height: `${Math.max(10, h)}%` }}
                  title={`Week ${i + 1}`}
                />
              ))}
            </div>
            <div className="flex justify-between px-3 sm:px-8 text-[10px] font-bold text-outline uppercase tracking-wider">
              <span>4W ago</span>
              <span>3W ago</span>
              <span>2W ago</span>
              <span>1W ago</span>
              <span>Current</span>
            </div>
          </div>
        </section>

        {/* Submissions */}
        <section className="lg:col-span-4">
          <div className="bg-surface-container-lowest p-4 sm:p-5 min-h-[220px] sm:min-h-[260px] lg:min-h-[300px] flex flex-col rounded-lg border border-outline-variant/20">
            <h2 className="font-headline text-lg sm:text-xl font-bold text-primary mb-4">
              Submissions
            </h2>
            <div className="flex-1 space-y-2.5 sm:space-y-3 overflow-auto pr-1">
            {sortedSubmissions.length ? (
              sortedSubmissions.map((attempt, i) => {
                const name = attempt.student?.fullName || "Student";
                const lessonTitle =
                  (attempt.quiz as { lesson?: { title?: string } }).lesson?.title || "Quiz";
                const createdAt = (attempt as unknown as { createdAt?: string }).createdAt;
                const isRecent = i < 2;
                return (
                  <div
                    key={attempt.id}
                    onClick={() => !hideLmsSisFeatures && onNavigate("scores")}
                    className={`bg-surface-container-lowest p-3 group hover:bg-surface-container-low transition-colors cursor-pointer relative overflow-hidden rounded-lg border border-outline-variant/20 ${
                      !hideLmsSisFeatures ? "cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 ${
                        isRecent ? "bg-amber-600" : "bg-primary"
                      }`}
                    />
                    <div className="flex items-center gap-2.5 sm:gap-3 pl-1">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 bg-surface-container-high flex items-center justify-center font-bold text-xs text-primary shrink-0">
                        {getInitials(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{name}</p>
                        <p className="text-xs text-on-surface-variant truncate italic">
                          {lessonTitle}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-outline">
                          {createdAt ? formatRelativeTime(createdAt) : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-on-surface-variant text-sm py-4">
                No submissions to review.
              </p>
            )}
            </div>
            {!hideLmsSisFeatures && attempts.length > 0 && (
              <button
                onClick={() => onNavigate("scores")}
                className="mt-4 w-full py-2.5 sm:py-3 border-2 border-outline-variant/20 text-[11px] font-bold uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all rounded-lg"
              >
                Review All {attempts.length} Submission
                {attempts.length === 1 ? "" : "s"}
              </button>
            )}
          </div>
        </section>
      </div>

      {/* Faculty Quote */}
      <section className="mt-8 sm:mt-10 md:mt-12 max-w-3xl mx-auto text-center border-t border-surface-variant/30 pt-7 sm:pt-10">
        <span
          className="material-symbols-outlined text-3xl sm:text-4xl text-secondary mb-4"
          style={{ fontVariationSettings: '"FILL" 1' }}
        >
          format_quote
        </span>
        <p className="text-base sm:text-lg md:text-xl font-headline italic text-primary leading-relaxed">
          &ldquo;{quote.text}&rdquo;
        </p>
        <cite className="block mt-4 text-xs sm:text-sm font-label text-outline not-italic uppercase tracking-widest">
          — {quote.author}
        </cite>
      </section>
    </section>
  );
}
