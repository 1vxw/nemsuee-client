import { useEffect, useMemo, useRef, useState } from "react";
import type { CatalogCourse } from "../../../../shared/types/lms";
import courseThumbnailDefault from "../../../../assets/course-thumbnail-default.svg";

const courseCategories: Record<string, string> = {
  math: "Mathematics",
  science: "Core Science",
  physics: "Core Science",
  biology: "Core Science",
  bio: "Core Science",
  eng: "Humanities",
  english: "Humanities",
  literature: "Humanities",
  lit: "Humanities",
  rhetoric: "Humanities",
  comp: "Computing",
  computer: "Computing",
  programming: "Technology",
  program: "Technology",
  design: "Engineering",
  architecture: "Engineering",
  engineering: "Engineering",
  research: "Science & Research",
};

function getCategoryTag(title: string): string {
  const normalized = title.toLowerCase();
  for (const [key, category] of Object.entries(courseCategories)) {
    if (normalized.includes(key)) return category;
  }
  return "Academic";
}

export type CatalogFilter = "all" | "enrolled" | "available";

export function StudentCatalogPanel(props: {
  studentViewMode: "all" | "my" | "search";
  userRole: string;
  catalogQuery: string;
  setCatalogQuery: (v: string) => void;
  loadCatalog: (query?: string) => void;
  catalog: CatalogCourse[];
  selectedCatalogCourseId: number | null;
  setSelectedCatalogCourseId: (id: number | null) => void;
  selectedCatalogCourse: CatalogCourse | null;
  showEnrollRequest: Record<number, boolean>;
  setShowEnrollRequest: (v: any) => void;
  keyInput: Record<number, string>;
  setKeyInput: (v: any) => void;
  requestEnroll: (courseId: number) => Promise<void>;
  onOpenCourse?: (id: number) => void;
  progressByCourseId?: Record<number, number>;
}) {
  const {
    studentViewMode,
    userRole,
    catalogQuery,
    setCatalogQuery,
    loadCatalog,
    catalog,
    selectedCatalogCourseId,
    setSelectedCatalogCourseId,
    showEnrollRequest,
    setShowEnrollRequest,
    keyInput,
    setKeyInput,
    requestEnroll,
    onOpenCourse,
    progressByCourseId = {},
  } = props;
  const [filter, setFilter] = useState<CatalogFilter>("all");
  const [showSearchOptions, setShowSearchOptions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSearchOptions) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSearchOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSearchOptions]);

  const getInstructorLabel = (course: CatalogCourse) => {
    const names = (course.instructors || [])
      .map((i) => i.fullName)
      .filter(Boolean);
    if (names.length) return names.join(", ");
    return course.instructor?.fullName || "TBA";
  };

  const filteredCatalog = useMemo(() => {
    const query = catalogQuery.trim().toLowerCase();
    let list = catalog;
    if (query) {
      list = list.filter((course) => {
        const title = course.title.toLowerCase();
        const instructors = getInstructorLabel(course).toLowerCase();
        return title.includes(query) || instructors.includes(query);
      });
    }
    if (filter === "enrolled") {
      list = list.filter((c) => c.enrollmentStatus === "APPROVED");
    } else if (filter === "available") {
      list = list.filter((c) => !c.enrollmentStatus);
    }
    return list.slice(0, 12);
  }, [catalog, catalogQuery, filter]);

  if (
    (userRole !== "STUDENT" && userRole !== "INSTRUCTOR") ||
    studentViewMode === "my"
  )
    return null;

  const showFilters = userRole === "STUDENT";

  return (
    <section className="min-w-0 space-y-8">
      {/* Page Header & Filters - matches course.list.html */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 mb-8 md:mb-12">
        <div className="max-w-2xl">
          <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-3 md:mb-4">
            Curriculum Gallery
          </h2>
          <p className="text-on-surface-variant font-body text-base sm:text-lg">
            Continue your intellectual journey through the curated archives of
            North Eastern Mindanao State University.
          </p>
        </div>
        {showFilters && (
          <div className="flex items-center gap-2 sm:gap-4 bg-surface-container p-1 rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-4 sm:px-6 py-2 text-sm font-bold rounded transition-colors ${
                filter === "all"
                  ? "bg-surface-container-lowest text-primary shadow-sm"
                  : "text-on-surface-variant font-medium hover:text-primary"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter("enrolled")}
              className={`px-4 sm:px-6 py-2 text-sm rounded transition-colors ${
                filter === "enrolled"
                  ? "bg-surface-container-lowest text-primary shadow-sm font-bold"
                  : "text-on-surface-variant font-medium hover:text-primary"
              }`}
            >
              In Progress
            </button>
            <button
              type="button"
              onClick={() => setFilter("available")}
              className={`px-4 sm:px-6 py-2 text-sm rounded transition-colors ${
                filter === "available"
                  ? "bg-surface-container-lowest text-primary shadow-sm font-bold"
                  : "text-on-surface-variant font-medium hover:text-primary"
              }`}
            >
              Available
            </button>
          </div>
        )}
      </div>

      {/* Search Bar - rounded-full to match reference */}
      <div ref={searchContainerRef} className="relative">
        <div className="relative flex items-center">
          <input
            value={catalogQuery}
            onFocus={() => {
              if (!catalog.length) loadCatalog("");
              setShowSearchOptions(true);
            }}
            onChange={(e) => {
              setCatalogQuery(e.target.value);
              setShowSearchOptions(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                loadCatalog(catalogQuery);
              }
            }}
            className="w-full pl-4 pr-10 py-2.5 text-sm bg-surface-container rounded-md border-none focus:ring-1 focus:ring-primary outline-none text-on-surface font-body placeholder-on-surface-variant"
            placeholder="Search knowledge..."
          />
          <span className="material-symbols-outlined absolute right-3 text-on-surface-variant text-sm pointer-events-none">
            search
          </span>
        </div>

        {showSearchOptions && (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-80 overflow-y-auto rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-2 shadow-lg">
            {filteredCatalog.length ? (
              filteredCatalog.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => {
                    setCatalogQuery(course.title);
                    setSelectedCatalogCourseId(course.id);
                    setShowSearchOptions(false);
                  }}
                  className="w-full rounded px-4 py-3 text-left hover:bg-surface-container transition-colors"
                >
                  <p className="font-label font-bold text-primary">
                    {course.title}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {getInstructorLabel(course)}
                  </p>
                </button>
              ))
            ) : (
              <p className="px-4 py-3 text-sm text-on-surface-variant">
                No matching courses.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bento Grid - horizontal cards like course.list.html */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {filteredCatalog.map((course, idx) => {
          const isSelected = selectedCatalogCourseId === course.id;
          const category = getCategoryTag(course.title);
          const progress = progressByCourseId[course.id] ?? 0;

          const statusLabel =
            course.enrollmentStatus === "APPROVED"
              ? "In Progress"
              : course.enrollmentStatus === "PENDING"
                ? "Starting Soon"
                : progress >= 90
                  ? "Final Project"
                  : "Available";

          const statusBadgeClass =
            course.enrollmentStatus === "APPROVED" || progress > 0
              ? "bg-tertiary-container text-on-tertiary-container"
              : course.enrollmentStatus === "PENDING"
                ? "bg-surface-container text-on-surface-variant"
                : "bg-surface-container text-on-surface-variant";

          const isFirstCard = idx === 0;
          const borderAccent = isFirstCard ? "border-secondary" : "";

          return (
            <article
              key={course.id}
              onClick={() => setSelectedCatalogCourseId(course.id)}
              className={`group bg-surface-container-lowest rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:translate-y-[-4px] border-t-2 cursor-pointer ${borderAccent} ${
                isSelected
                  ? "shadow-lg shadow-primary/10 ring-2 ring-primary/20"
                  : "shadow-sm"
              }`}
            >
              <div className="flex flex-col md:flex-row flex-1 min-w-0">
                {/* Image - left third on desktop */}
                <div className="md:w-1/3 h-48 sm:h-64 md:min-h-[200px] overflow-hidden bg-surface-container shrink-0">
                  <img
                    src={courseThumbnailDefault}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>

                {/* Content - right side */}
                <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span
                        className={`text-xs font-label uppercase tracking-widest font-bold ${
                          isFirstCard ? "text-secondary" : "text-outline"
                        }`}
                      >
                        {category}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter shrink-0 ${statusBadgeClass}`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    <h3 className="font-headline text-xl sm:text-2xl font-bold text-primary mb-2 line-clamp-2">
                      {course.title}
                    </h3>

                    <p className="text-on-surface-variant text-sm font-body mb-6 line-clamp-2">
                      {course.description ||
                        "Course details and learning materials are available in this class."}
                    </p>

                    {/* Instructor */}
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-6 h-6 rounded-full bg-surface-container overflow-hidden flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-xs text-primary">
                          person
                        </span>
                      </div>
                      <span className="text-xs text-on-surface-variant font-medium truncate">
                        {getInstructorLabel(course)}
                      </span>
                    </div>
                  </div>

                  <div>
                    {/* Progress bar */}
                    <div className="flex justify-between text-xs font-label mb-2">
                      <span className="text-on-surface-variant">
                        Curriculum Progress
                      </span>
                      <span className="text-primary font-bold">
                        {progress}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-primary-fixed rounded-full overflow-hidden mb-6">
                      <div
                        className="h-full bg-tertiary-fixed-dim rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* CTA Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          (course.enrollmentStatus === "APPROVED" ||
                            userRole === "INSTRUCTOR") &&
                          onOpenCourse
                        ) {
                          onOpenCourse(course.id);
                        } else if (course.enrollmentStatus === "APPROVED") {
                          setSelectedCatalogCourseId(course.id);
                        } else if (userRole === "INSTRUCTOR") {
                          if (onOpenCourse) onOpenCourse(course.id);
                          else setSelectedCatalogCourseId(course.id);
                        } else {
                          setShowEnrollRequest((p: any) => ({
                            ...p,
                            [course.id]: !p[course.id],
                          }));
                        }
                      }}
                      className={`w-full py-3 font-bold rounded flex items-center justify-center gap-2 transition-opacity hover:opacity-90 ${
                        progress >= 90 && course.enrollmentStatus === "APPROVED"
                          ? "bg-secondary-container text-on-secondary-container"
                          : "bg-primary text-on-primary"
                      }`}
                    >
                      <span>
                        {userRole === "INSTRUCTOR"
                          ? "Open Course"
                          : course.enrollmentStatus === "APPROVED"
                            ? progress >= 90
                              ? "Submit Final Thesis"
                              : "Continue Studies"
                            : course.enrollmentStatus === "PENDING"
                              ? "Request Pending"
                              : "Enroll Now"}
                      </span>
                      <span className="material-symbols-outlined text-sm">
                        {progress >= 90 &&
                        course.enrollmentStatus === "APPROVED"
                          ? "history_edu"
                          : "arrow_forward"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Enrollment Form - full width when toggled */}
              {showEnrollRequest[course.id] &&
                course.enrollmentStatus !== "APPROVED" &&
                course.enrollmentStatus !== "PENDING" && (
                  <div
                    className="w-full border-t border-outline-variant/20 bg-surface-container-low p-4 md:p-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-xs font-label text-on-surface-variant mb-3 md:text-sm">
                      Enter enrollment key if required
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        value={keyInput[course.id] || ""}
                        onChange={(e) =>
                          setKeyInput((p: any) => ({
                            ...p,
                            [course.id]: e.target.value,
                          }))
                        }
                        className="flex-1 rounded border border-outline-variant/40 px-4 py-2.5 font-body text-sm focus:ring-1 focus:ring-primary outline-none"
                        placeholder="Enrollment key (optional)"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          requestEnroll(course.id);
                        }}
                        className="rounded bg-secondary-container px-5 py-2.5 font-label text-sm font-bold text-on-secondary-container hover:opacity-90 shrink-0"
                        data-keep-action-text="true"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                )}
            </article>
          );
        })}
      </div>

      {/* Empty State */}
      {!filteredCatalog.length && (
        <article className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-outline-variant/30 block mb-3">
            school
          </span>
          <h3 className="font-headline text-lg font-bold text-primary mb-2">
            No courses available
          </h3>
          <p className="text-on-surface-variant font-body">
            {catalogQuery.trim()
              ? "Try adjusting your search."
              : "Try a different filter or check back later for new courses."}
          </p>
        </article>
      )}

      {/* Academic Resource Banner - from course.list.html */}
      <section className="pt-4">
        <div className="bg-primary-container rounded-xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between text-on-primary-container relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
            <svg
              className="w-full h-full"
              viewBox="0 0 200 200"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M44.7,-76.4C58.1,-69.2,69.2,-58.1,77.3,-44.7C85.4,-31.3,90.5,-15.7,90.5,0C90.5,15.7,85.4,31.3,77.3,44.7C69.2,58.1,58.1,69.2,44.7,77.3C31.3,85.4,15.7,90.5,0,90.5C-15.7,90.5,-31.3,85.4,-44.7,77.3C-58.1,69.2,-69.2,58.1,-77.3,44.7C-85.4,31.3,-90.5,15.7,-90.5,0C-90.5,-15.7,-85.4,-31.3,-77.3,-44.7C-69.2,-58.1,-58.1,-69.2,-44.7,-77.3C-31.3,-85.4,-15.7,-90.5,0,-90.5C15.7,-90.5,31.3,-85.4,44.7,-76.4Z"
                fill="#FFFFFF"
                transform="translate(100 100)"
              />
            </svg>
          </div>
          <div className="z-10 text-center md:text-left mb-6 md:mb-0">
            <h4 className="font-headline text-2xl sm:text-3xl text-white font-bold mb-2">
              Expand Your Horizons
            </h4>
            <p className="text-white/70 max-w-lg">
              Discover new disciplines and join the upcoming inter-departmental
              research seminars.
            </p>
          </div>
          <div className="z-10 flex flex-wrap gap-2 sm:gap-4 justify-center md:justify-end">
            <button
              type="button"
              onClick={() => loadCatalog("")}
              className="bg-white text-primary px-6 sm:px-8 py-3 rounded font-bold hover:opacity-90 transition-all"
            >
              Browse Library
            </button>
            <button
              type="button"
              className="border border-white/30 text-white px-6 sm:px-8 py-3 rounded font-bold hover:bg-white/10 transition-all"
            >
              Research Portal
            </button>
          </div>
        </div>
      </section>
    </section>
  );
}
