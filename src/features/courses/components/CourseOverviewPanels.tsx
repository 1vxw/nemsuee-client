import { useEffect, useState } from "react";
import type { Course, CourseTask, User } from "../../../shared/types/lms";
import type { CourseAnnouncement } from "../hooks/useCourseAnnouncements";

const FACULTY_QUOTES: { text: string; author: string }[] = [
  {
    text: "Computer Science is no more about computers than astronomy is about telescopes.",
    author: "Edsger W. Dijkstra",
  },
  {
    text: "The only way to learn a new programming language is by writing programs in it.",
    author: "Dennis Ritchie",
  },
  {
    text: "First, solve the problem. Then, write the code.",
    author: "John Johnson",
  },
  {
    text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
    author: "Martin Fowler",
  },
  {
    text: "Programs must be written for people to read, and only incidentally for machines to execute.",
    author: "Harold Abelson",
  },
  {
    text: "The best error message is the one that never shows up.",
    author: "Thomas Fuchs",
  },
  {
    text: "Code is like humor. When you have to explain it, it's bad.",
    author: "Cory House",
  },
  {
    text: "Simplicity is the soul of efficiency.",
    author: "Austin Freeman",
  },
];

type CourseAnnouncementsPanelProps = {
  announcements: CourseAnnouncement[];
  showAnnouncementHistory: boolean;
  setShowAnnouncementHistory: (updater: (prev: boolean) => boolean) => void;
};

export function CourseAnnouncementsPanel({
  announcements,
  showAnnouncementHistory,
  setShowAnnouncementHistory,
}: CourseAnnouncementsPanelProps) {
  if (!announcements.length) return null;

  return (
    <article className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[1.125rem] sm:text-xl">
            notifications
          </span>
          <h3 className="font-headline text-base font-bold text-primary sm:text-lg">
            Course Announcements
          </h3>
        </div>
        <button
          onClick={() => setShowAnnouncementHistory((v) => !v)}
          className="rounded-lg p-2 hover:bg-surface-container transition-colors"
          aria-label="View recent announcements"
          title="Recent announcements"
        >
          <span className="material-symbols-outlined text-[1.125rem]">
            more_vert
          </span>
        </button>
      </div>

      <div className="space-y-1.5">
        <p className="font-body text-sm text-on-surface sm:text-base">
          {announcements[0].text}
        </p>
        <p className="text-xs text-on-surface-variant font-label">
          {announcements[0].sectionName
            ? `Block: ${announcements[0].sectionName} • `
            : "All blocks • "}
          {new Date(announcements[0].createdAt).toLocaleString()}
        </p>
      </div>

      {showAnnouncementHistory && announcements.length > 1 && (
        <div className="mt-6 pt-6 border-t border-outline-variant/20 space-y-4">
          <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant font-bold">
            Previous Announcements
          </p>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {announcements.slice(1, 6).map((announcement) => (
              <div
                key={announcement.id}
                className="rounded-lg bg-surface-container-low p-3 border border-outline-variant/10"
              >
                <p className="text-xs text-on-surface font-body">
                  {announcement.text}
                </p>
                <p className="mt-2 text-[10px] text-on-surface-variant font-label">
                  {announcement.sectionName
                    ? `${announcement.sectionName} • `
                    : ""}
                  {new Date(announcement.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

type CourseHeaderPanelProps = {
  selectedCourse: Course;
  user: User;
  enrollmentKey: string;
  regenerateEnrollmentKey: (courseId: number) => Promise<void>;
  loadRoster: (courseId: number) => Promise<void>;
  setShowCourseInfo: (open: boolean) => void;
};

export function CourseHeaderPanel({
  selectedCourse,
  user,
  enrollmentKey,
  regenerateEnrollmentKey,
  loadRoster,
  setShowCourseInfo,
}: CourseHeaderPanelProps) {
  const instructorLabel =
    selectedCourse.instructors && selectedCourse.instructors.length > 0
      ? selectedCourse.instructors.map((i) => i.fullName).join(", ")
      : selectedCourse.instructor?.fullName || "TBA";

  return (
    <section className="mb-4 space-y-3 md:mb-6 md:space-y-4 lg:mb-4 lg:space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-label text-on-surface-variant sm:gap-2 sm:text-sm">
        <span className="cursor-pointer hover:text-primary">Catalog</span>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-on-surface font-semibold max-w-xs truncate">
          {selectedCourse.title}
        </span>
      </nav>

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-headline text-xl font-bold leading-tight tracking-tight text-on-surface sm:text-2xl md:text-3xl">
            {selectedCourse.title}
          </h1>
          {selectedCourse.description && (
            <p className="text-sm text-on-surface-variant font-body max-w-2xl mt-2">
              {selectedCourse.description}
            </p>
          )}
        </div>
      </div>

      {/* Instructor and Actions Bar */}
      <div className="flex flex-wrap items-center gap-4 border-t border-outline-variant/20 pt-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white text-lg">
              person
            </span>
          </div>
          <div>
            <p className="text-[10px] font-label uppercase tracking-wider text-on-surface-variant sm:text-xs">
              Taught by
            </p>
            <p className="text-sm font-semibold text-on-surface">
              {instructorLabel}
            </p>
          </div>
        </div>

        {/* Actions - For Instructor only */}
        {user.role === "INSTRUCTOR" && (
          <>
            <div className="flex items-center gap-2 text-sm font-label">
              <span className="text-on-surface-variant">Enrollment Key:</span>
              <code className="bg-surface-container px-2 py-1 rounded font-mono text-on-surface border border-outline-variant/30">
                {enrollmentKey || "Loading..."}
              </code>
              <button
                onClick={() => regenerateEnrollmentKey(selectedCourse.id)}
                className="ml-2 inline-flex items-center gap-1.5 px-3 py-1 bg-tertiary text-on-tertiary rounded transition-colors text-xs font-bold hover:opacity-90"
              >
                <span className="material-symbols-outlined text-[0.95rem]">
                  key
                </span>
                New
              </button>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => loadRoster(selectedCourse.id)}
                title="Refresh"
                className="inline-flex items-center gap-1.5 rounded-md bg-surface-container px-2.5 py-2 text-xs font-label font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[1rem] text-on-surface-variant">
                  refresh
                </span>
                Refresh
              </button>
              <button
                onClick={() => setShowCourseInfo(true)}
                title="Course info"
                className="inline-flex items-center gap-1.5 rounded-md bg-surface-container px-2.5 py-2 text-xs font-label font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[1rem] text-on-surface-variant">
                  info
                </span>
                Details
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
type CourseSidebarPanelProps = {
  selectedCourse: Course;
  user: User;
  attempts: import("../../../shared/types/lms").Attempt[];
  api: (path: string, init?: RequestInit) => Promise<any>;
  headers: Record<string, string>;
};

export function CourseSidebarPanel({
  selectedCourse,
  user,
  attempts,
  api,
  headers,
}: CourseSidebarPanelProps) {
  const [quote] = useState(
    () => FACULTY_QUOTES[Math.floor(Math.random() * FACULTY_QUOTES.length)],
  );
  const [upcomingTasks, setUpcomingTasks] = useState<CourseTask[]>([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [assignments, activities] = await Promise.all([
          api(`/tasks/course/${selectedCourse.id}?kind=ASSIGNMENT`, {
            headers,
          }).catch(() => []),
          api(`/tasks/course/${selectedCourse.id}?kind=ACTIVITY`, {
            headers,
          }).catch(() => []),
        ]);
        if (!isMounted) return;
        const all = [...(assignments || []), ...(activities || [])].filter(
          (t: CourseTask) =>
            t.dueAt && new Date(t.dueAt).getTime() > Date.now(),
        );
        all.sort(
          (a: CourseTask, b: CourseTask) =>
            new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime(),
        );
        setUpcomingTasks(all.slice(0, 5));
      } catch {
        setUpcomingTasks([]);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [selectedCourse.id, api, headers]);

  if (user.role !== "STUDENT") return null;

  // Calculate total lessons in course
  const totalLessons = selectedCourse.sections.reduce(
    (sum, section) => sum + section.lessons.length,
    0,
  );

  // Calculate course progress from attempts for this specific course
  const courseAttempts = attempts.filter(
    (attempt) => attempt.quiz.lesson.course.id === selectedCourse.id,
  );
  const progressPercentage =
    courseAttempts.length > 0
      ? Math.round(
          courseAttempts.reduce(
            (sum, attempt) =>
              sum + (attempt.score / Math.max(1, attempt.total)) * 100,
            0,
          ) / courseAttempts.length,
        )
      : 0;

  // Calculate estimated completed lessons based on attempts
  const completedLessons =
    courseAttempts.length > 0
      ? Math.min(courseAttempts.length, totalLessons)
      : 0;

  return (
    <aside className="space-y-4">
      {/* Course Progress */}
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label">
          Course Progress
        </p>
        <p className="text-2xl font-bold leading-none text-primary font-headline md:text-3xl">
          {progressPercentage}%
        </p>
        <p className="text-xs font-label text-on-surface-variant">
          {completedLessons}/{totalLessons} modules completed
        </p>
      </div>

      {/* Academic Resources - Dynamic from course lessons */}
      {totalLessons > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-primary">
            <span className="material-symbols-outlined text-secondary text-[1rem] sm:text-[1.125rem]">
              auto_stories
            </span>
            Academic Resources
          </h3>
          <div className="space-y-3 md:space-y-4 lg:space-y-2">
            {/* PDF Resources */}
            {selectedCourse.sections.some((s) =>
              s.lessons.some((l) => l.fileUrl?.includes(".pdf")),
            ) && (
              <div className="cursor-pointer rounded-lg bg-surface-container p-3 transition-all hover:bg-surface-container-lowest hover:shadow-sm">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 rounded p-1.5 bg-red-100">
                    <span className="material-symbols-outlined text-red-700 text-[1rem] sm:text-[1.125rem]">
                      picture_as_pdf
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-primary leading-tight">
                      {selectedCourse.title} Resources
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {selectedCourse.sections.length} sections
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Course Materials */}
            <div className="cursor-pointer rounded-lg bg-surface-container p-3 transition-all hover:bg-surface-container-lowest hover:shadow-sm">
              <div className="flex items-start gap-2">
                <div className="p-1.5 bg-blue-100 rounded flex-shrink-0">
                  <span className="material-symbols-outlined text-blue-700 text-[1rem] sm:text-[1.125rem]">
                    folder_open
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary leading-tight">
                    Course Materials
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {totalLessons} lessons
                  </p>
                </div>
              </div>
            </div>

            {/* Assignment Repository */}
            <div className="cursor-pointer rounded-lg bg-surface-container p-3 transition-all hover:bg-surface-container-lowest hover:shadow-sm">
              <div className="flex items-start gap-2">
                <div className="p-1.5 bg-green-100 rounded flex-shrink-0">
                  <span className="material-symbols-outlined text-green-700 text-lg">
                    assignment
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary leading-tight">
                    Assignments & Tasks
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {selectedCourse.sections.length} modules
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Quote */}
      <div className="relative overflow-hidden rounded-lg bg-primary p-4">
        <span className="material-symbols-outlined pointer-events-none absolute -right-2 -top-2 text-6xl text-white/5">
          format_quote
        </span>
        <p className="font-headline relative z-10 mb-3 text-sm italic leading-relaxed text-white sm:text-base">
          &ldquo;{quote.text}&rdquo;
        </p>
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-6 h-[1px] bg-secondary"></div>
          <span className="text-white/90 font-label text-xs font-medium">
            {quote.author}
          </span>
        </div>
      </div>

      {/* Important Dates - dynamic from tasks */}
      <div className="space-y-3 rounded-lg border border-outline-variant/20 p-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant sm:text-sm">
          Important Dates
        </h3>
        {upcomingTasks.length > 0 ? (
          <div className="space-y-3">
            {upcomingTasks.map((task) => {
              const due = task.dueAt ? new Date(task.dueAt) : null;
              const month = due
                ? due.toLocaleString("en", { month: "short" }).toUpperCase()
                : "";
              const day = due ? due.getDate() : "";
              const daysLeft = due
                ? Math.ceil(
                    (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                  )
                : 0;
              const isUrgent = daysLeft <= 3 && daysLeft >= 0;
              return (
                <div key={task.id} className="flex gap-3">
                  <div className="flex flex-col items-center justify-center w-10 h-11 bg-surface-container-high rounded font-label text-primary flex-shrink-0 sm:w-11 sm:h-12">
                    <span className="text-[10px] font-bold sm:text-xs">
                      {month}
                    </span>
                    <span className="text-base font-black leading-none sm:text-lg">
                      {day}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-primary truncate sm:text-sm">
                      {task.title}
                    </p>
                    <p
                      className={`text-[10px] sm:text-xs ${isUrgent ? "font-medium text-error" : "text-on-surface-variant"}`}
                    >
                      {daysLeft === 0
                        ? "Due today"
                        : daysLeft === 1
                          ? "Due tomorrow"
                          : daysLeft < 0
                            ? "Overdue"
                            : `Due in ${daysLeft} days`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-on-surface-variant py-2">
            No upcoming deadlines
          </p>
        )}
      </div>
    </aside>
  );
}
type InstructorOverviewPanelsProps = {
  selectedCourse: Course;
  filteredRosterCount: number;
  setActiveCourseTab: (
    tab: "content" | "quizzes" | "assignments" | "activities",
  ) => void;
  setLessonComposerSectionId: (id: number | null) => void;
  setShowEnrollmentManager: (open: boolean) => void;
  createAnnouncement: () => Promise<void>;
};

export function InstructorOverviewPanels({
  selectedCourse,
  filteredRosterCount,
  setActiveCourseTab,
  setLessonComposerSectionId,
  setShowEnrollmentManager,
  createAnnouncement,
}: InstructorOverviewPanelsProps) {
  return (
    <section className="mb-4 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
      <article className="rounded-xl border border-outline-variant/30 bg-surface-container-high p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Course Content</p>
            <p className="text-xs text-on-surface-variant">
              Manage blocks and resources only.
            </p>
          </div>
          <div className="relative">
            <button
              onClick={() => {
                setActiveCourseTab("content");
                setLessonComposerSectionId(
                  selectedCourse.sections[0]?.id || null,
                );
              }}
              className="rounded-md bg-primary p-2 text-on-primary hover:opacity-90"
              aria-label="Upload resource"
              title="Upload resource"
            >
              <span
                className="material-symbols-outlined text-[1rem]"
                aria-hidden="true"
              >
                upload_file
              </span>
            </button>
          </div>
        </div>
        <div className="text-xs text-on-surface-variant">
          Blocks: {selectedCourse.sections.length}
        </div>
      </article>

      <article className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-primary">
            Enrollment / Students
          </p>
          <span className="rounded bg-primary-fixed px-2 py-1 text-[11px] font-medium text-on-primary-fixed">
            By Block
          </span>
        </div>
        <div className="space-y-3">
          <div className="grid gap-3 rounded-md border border-outline-variant/30 bg-surface-container-lowest p-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <p className="text-sm text-on-surface">
              <span className="font-semibold text-primary">
                {filteredRosterCount}
              </span>{" "}
              students in selected block
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEnrollmentManager(true)}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-on-primary hover:opacity-90"
              >
                <span className="material-symbols-outlined text-[0.95rem]">
                  group
                </span>
                Manage
              </button>
              <button
                data-keep-action-text="true"
                onClick={createAnnouncement}
                className="inline-flex items-center gap-1 rounded-md border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[0.95rem]">
                  campaign
                </span>
                New Announcement
              </button>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}

type PendingRequestsPanelProps = {
  selectedCourse: Course;
  pendingRows: { id: number; student: { fullName: string; email: string } }[];
  approveSection: Record<number, number>;
  setApproveSection: (updater: any) => void;
  loadPending: (courseId: number) => Promise<void>;
  decide: (
    courseId: number,
    enrollmentId: number,
    status: "APPROVED" | "REJECTED",
  ) => Promise<void>;
};

export function PendingRequestsPanel({
  selectedCourse,
  pendingRows,
  approveSection,
  setApproveSection,
  loadPending,
  decide,
}: PendingRequestsPanelProps) {
  return (
    <section className="mb-4 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Pending Requests</p>
          <p className="text-xs text-on-surface-variant">
            Review enrollment applications by assigning a block.
          </p>
        </div>
        <button
          onClick={() => loadPending(selectedCourse.id)}
          className="rounded-md border border-outline-variant/40 bg-surface-container-lowest px-3 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container"
          title="Refresh pending"
        >
          Refresh
        </button>
      </div>
      <div className="hidden grid-cols-[1.2fr_1fr_auto] gap-2 rounded-md bg-surface-container-low px-3 py-2 text-xs font-semibold text-on-surface-variant md:grid">
        <p>Student</p>
        <p>Assign Block</p>
        <p>Actions</p>
      </div>
      <div className="mt-2 space-y-2">
        {pendingRows.length === 0 && (
          <p className="rounded-md border border-dashed border-outline-variant/40 px-3 py-4 text-center text-sm text-on-surface-variant">
            No pending requests.
          </p>
        )}
        {pendingRows.map((p) => (
          <article
            key={p.id}
            className="grid gap-2 rounded-md border border-outline-variant/20 bg-surface-container-lowest p-3 md:grid-cols-[1.2fr_1fr_auto] md:items-center"
          >
            <div>
              <p className="text-sm font-medium text-on-surface">
                {p.student.fullName}
              </p>
              <p className="text-xs text-on-surface-variant">
                {p.student.email}
              </p>
            </div>
            <select
              value={
                approveSection[p.id] || selectedCourse.sections[0]?.id || ""
              }
              onChange={(e) =>
                setApproveSection((x: any) => ({
                  ...x,
                  [p.id]: Number(e.target.value),
                }))
              }
              className="w-full rounded-md border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
            >
              {selectedCourse.sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => decide(selectedCourse.id, p.id, "APPROVED")}
                className="rounded-md bg-tertiary-container px-3 py-2 text-xs font-medium text-on-tertiary-container hover:opacity-90"
              >
                Approve
              </button>
              <button
                onClick={() => decide(selectedCourse.id, p.id, "REJECTED")}
                className="rounded-md bg-error px-3 py-2 text-xs font-medium text-on-error hover:opacity-90"
              >
                Reject
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

type CourseTabsProps = {
  activeCourseTab: "content" | "quizzes" | "assignments" | "activities";
  setActiveCourseTab: (
    tab: "content" | "quizzes" | "assignments" | "activities",
  ) => void;
};

export function CourseTabs({
  activeCourseTab,
  setActiveCourseTab,
}: CourseTabsProps) {
  const tabs = [
    { key: "content" as const, label: "Content", icon: "menu_book" },
    { key: "quizzes" as const, label: "Quizzes", icon: "quiz" },
    { key: "assignments" as const, label: "Assignments", icon: "assignment" },
    { key: "activities" as const, label: "Activities", icon: "sports_soccer" },
  ];

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-px sm:gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveCourseTab(tab.key)}
          className={`flex items-center gap-1.5 px-2.5 py-2 font-label text-xs font-semibold transition-all whitespace-nowrap border-b-2 sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm ${
            activeCourseTab === tab.key
              ? "text-primary border-secondary"
              : "text-on-surface-variant border-transparent hover:text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-base sm:text-[1.125rem]">
            {tab.icon}
          </span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
