import { useState } from "react";
import type { Course, TeachingBlock, User, ViewKey } from "../../shared/types/lms";
import { menu } from "./menu";

const menuIcons: Record<string, string> = {
  dashboard: "space_dashboard",
  courses: "school",
  scores: "grade",
  grade_computation: "fact_check",
  admin_blocks: "admin_panel_settings",
  archives: "archive",
  admin_settings: "admin_panel_settings",
  storage: "cloud",
  notifications: "notifications",
  settings: "settings",
};

export function Sidebar({
  user,
  view,
  setView,
  courses,
  selectedCourseId,
  onOpenCourse,
  archivedCourses,
  onOpenArchivedCourse,
  teachingBlocks = [],
  onOpenTeachingBlock,
  hideLmsSisFeatures = false,
}: {
  user: User;
  view: ViewKey;
  setView: (v: ViewKey) => void;
  courses: Course[];
  archivedCourses: Course[];
  teachingBlocks?: TeachingBlock[];
  selectedCourseId: number | null;
  onOpenCourse: (id: number) => void;
  onOpenArchivedCourse: (id: number) => void;
  onOpenTeachingBlock?: (courseId: number, sectionId: number) => void;
  hideLmsSisFeatures?: boolean;
}) {
  const [coursesOpen, setCoursesOpen] = useState(true);
  const [myBlocksOpen, setMyBlocksOpen] = useState(true);
  const items = menu(user.role, { hideLmsSisFeatures });
  const hideIdentity = hideLmsSisFeatures && (user.role === "INSTRUCTOR" || user.role === "STUDENT");

  return (
    <aside className="rounded-xl bg-surface-container-low p-6 shadow-sm border border-outline-variant/20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-on-primary">
          <span className="material-symbols-outlined text-xl">school</span>
        </div>
        <div>
          <h3 className="font-headline font-bold text-primary text-base leading-tight">The Athenaeum</h3>
          <p className="text-xs text-on-surface-variant uppercase tracking-widest font-label">E-Learning Environment</p>
        </div>
      </div>

      {/* User Info */}
      <div className="bg-surface-container-lowest rounded-lg p-3 mb-6 border border-outline-variant/10">
        <p className="text-sm font-body text-on-surface">
          {!hideIdentity && (
            <>
              <span className="font-semibold">{user.fullName}</span>
              <br />
            </>
          )}
          <span className="text-xs text-on-surface-variant font-label uppercase tracking-wider">{user.role}</span>
        </p>
      </div>

      {/* Navigation */}
      <nav className="space-y-1" data-no-action-iconize="true">
        {items.map((m) => {
          if (m.key !== "courses" && m.key !== "archives") {
            return (
              <button
                key={m.key}
                onClick={() => setView(m.key)}
                data-keep-action-text="true"
                title={m.label}
                className={`w-full flex items-center gap-4 rounded-lg px-4 py-3 text-left text-sm font-label font-medium transition-all ${
                  view === m.key
                    ? "bg-surface-container-lowest text-primary shadow-sm shadow-primary/10 border-l-2 border-secondary"
                    : "text-on-surface-variant hover:bg-surface-container-lowest hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-lg">{menuIcons[m.key] || "article"}</span>
                <span className="font-body tracking-normal normal-case [font-family:Manrope,system-ui,sans-serif]">
                  {m.label}
                </span>
              </button>
            );
          }

          if (m.key === "archives") {
            return (
              <div key={m.key}>
                <button
                  onClick={() => {
                    setView("archives");
                    setCoursesOpen(false);
                  }}
                  data-keep-action-text="true"
                  className={`w-full flex items-center justify-between rounded-lg px-4 py-3 text-left text-sm font-label font-medium transition-all ${
                    view === "archives"
                      ? "bg-surface-container-lowest text-primary shadow-sm shadow-primary/10 border-l-2 border-secondary"
                      : "text-on-surface-variant hover:bg-surface-container-lowest hover:text-on-surface"
                  }`}
                >
                  <span className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-lg">archive</span>
                    {m.label}
                  </span>
                  <span className="material-symbols-outlined text-base transition-transform" style={{ transform: view === "archives" ? "rotate(90deg)" : "rotate(0deg)" }}>
                    chevron_right
                  </span>
                </button>
                {view === "archives" && (
                  <div className="mt-1 space-y-1 pl-4">
                    {archivedCourses.length ? (
                      archivedCourses.map((course) => (
                        <button
                          key={course.id}
                          onClick={() => onOpenArchivedCourse(course.id)}
                          className={`w-full rounded-md px-3 py-2 text-left text-xs font-body transition-colors ${
                            selectedCourseId === course.id
                              ? "bg-surface-container-lowest text-primary"
                              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                          }`}
                        >
                          {course.title}
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-xs text-on-surface-variant">No archived courses</p>
                    )}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={m.key}>
              <button
                onClick={() => {
                  setCoursesOpen(true);
                  setView("course_catalog");
                }}
                data-keep-action-text="true"
                className={`w-full flex items-center justify-between rounded-lg px-4 py-3 text-left text-sm font-label font-medium transition-all ${
                  view === "courses" || view === "course_catalog"
                    ? "bg-surface-container-lowest text-primary shadow-sm shadow-primary/10 border-l-2 border-secondary"
                    : "text-on-surface-variant hover:bg-surface-container-lowest hover:text-on-surface"
                }`}
              >
                <span className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-lg">school</span>
                  {m.label}
                </span>
                <span className="material-symbols-outlined text-base transition-transform" style={{ transform: coursesOpen ? "rotate(90deg)" : "rotate(0deg)" }}>
                  chevron_right
                </span>
              </button>
              {coursesOpen && (
                <div className="mt-1 space-y-1 pl-4">
                  {user.role === "INSTRUCTOR" && teachingBlocks.length ? (
                    <>
                      <button
                        onClick={() => setMyBlocksOpen((v) => !v)}
                        className="w-full flex items-center justify-between rounded-md px-3 py-2 text-left text-[11px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                        title="Toggle My Blocks"
                      >
                        <span>My blocks ({teachingBlocks.length})</span>
                        <span
                          className="material-symbols-outlined text-sm transition-transform"
                          style={{ transform: myBlocksOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                        >
                          chevron_right
                        </span>
                      </button>
                      {myBlocksOpen && teachingBlocks.map((block) => (
                        <button
                          key={`${block.courseId}-${block.id}`}
                          onClick={() => onOpenTeachingBlock?.(block.courseId, block.id)}
                          className={`w-full rounded-md px-3 py-2 text-left text-xs transition-colors ${
                            selectedCourseId === block.courseId
                              ? "bg-surface-container text-primary"
                              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                          }`}
                          title={`${block.courseTitle} - ${block.name}`}
                        >
                          <span className="block truncate font-body font-medium">{block.courseTitle}</span>
                          <span className="block truncate text-[10px] text-on-surface-variant font-label">{block.name}</span>
                        </button>
                      ))}
                    </>
                  ) : courses.length ? (
                    courses.map((course) => (
                      <button
                        key={course.id}
                        onClick={() => onOpenCourse(course.id)}
                        className={`w-full rounded-md px-3 py-2 text-left text-xs font-body transition-colors ${
                          selectedCourseId === course.id
                            ? "bg-surface-container text-primary"
                            : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                        }`}
                      >
                        {course.title}
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-2 text-xs text-on-surface-variant">No courses</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Enroll Button (Students) - opens Course Catalog tab */}
      {user.role === "STUDENT" && (
        <div className="mt-8 pt-6 border-t border-outline-variant/20">
          <button
            onClick={() => {
              setView("course_search");
            }}
            className="w-full py-3 bg-secondary-container text-on-secondary-container rounded-lg font-label font-bold text-sm shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Enroll New Course
          </button>
        </div>
      )}
    </aside>
  );
}
