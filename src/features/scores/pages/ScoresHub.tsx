import { useEffect, useMemo, useState } from "react";
import type { Attempt, Course, User } from "../../../shared/types/lms";
import { ScoresTab } from "./ScoresTab";

type ScoresHubProps = {
  user: User;
  courses: Course[];
  attempts: Attempt[];
  api: any;
  headers: any;
  setMessage: (m: string) => void;
  selectedCourseId: number | null;
  onSelectCourse: (courseId: number) => void;
};

export function ScoresHub({
  user,
  courses,
  attempts,
  api,
  headers,
  setMessage,
  selectedCourseId,
  onSelectCourse,
}: ScoresHubProps) {
  const [courseFilter, setCourseFilter] = useState("");
  const [showCoursePicker, setShowCoursePicker] = useState(true);
  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) ?? null,
    [courses, selectedCourseId],
  );
  const filteredCourses = useMemo(
    () =>
      courses.filter((c) =>
        c.title.toLowerCase().includes(courseFilter.trim().toLowerCase()),
      ),
    [courses, courseFilter],
  );

  useEffect(() => {
    if (!selectedCourseId) setShowCoursePicker(true);
  }, [selectedCourseId]);
  const [publishedGrades, setPublishedGrades] = useState<any[]>([]);
  const [semester, setSemester] = useState("1st Semester");
  const [term, setTerm] = useState("");
  const [termOptions, setTermOptions] = useState<string[]>([]);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [breakdownRow, setBreakdownRow] = useState<any | null>(null);

  useEffect(() => {
    if (user.role !== "STUDENT") return;
    api("/terms/context", { headers })
      .then((ctx: any) => {
        const sem = String(ctx?.semester || "1st Semester");
        const year = String(ctx?.academicYear || "").trim();
        setSemester(sem);
        if (year) {
          setTerm(year);
          setTermOptions([year]);
        } else {
          setTerm("All");
          setTermOptions(["All"]);
        }
      })
      .catch(() => {
        setTerm("All");
        setTermOptions(["All"]);
      });
  }, [user.role, api, headers]);

  useEffect(() => {
    if (user.role !== "STUDENT") return;
    const params = new URLSearchParams();
    if (semester) params.set("semester", semester);
    if (term && term !== "All") params.set("term", term);
    api(`/grade-computation/me/final-course?${params.toString()}`, { headers })
      .then((rows: any[]) => setPublishedGrades(rows || []))
      .catch(() => setPublishedGrades([]));
  }, [user.role, semester, term, api, headers]);

  if (user.role === "STUDENT") {
    const courseById = new Map(courses.map((c) => [c.id, c]));
    const visible = publishedGrades.map((g) => {
      const course = courseById.get(Number(g.courseId));
      const instructor =
        course?.instructor?.fullName ||
        course?.instructors?.[0]?.fullName ||
        "TBA";
      return {
        ...g,
        courseTitle: g.courseTitle || course?.title || "Course",
        instructor,
        units: "-",
      };
    });
    return (
      <section className="space-y-4">
        <header className="overflow-hidden rounded-lg border border-outline-variant/20 bg-gradient-to-r from-primary to-primary-container shadow-sm">
          <div className="p-4 text-on-primary sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-headline text-xl font-bold tracking-tight">Grades</p>
              <p className="text-xs font-label text-primary-fixed">Published records only</p>
            </div>
            <p className="mt-1 font-body text-sm text-primary-fixed">
              {semester} / {term}
            </p>
          </div>
        </header>

        <article className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm md:p-5">
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <label className="space-y-1">
              <span className="text-xs font-label font-bold uppercase tracking-wider text-on-surface-variant">
                Semester
              </span>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="h-10 w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 font-body text-sm text-on-surface"
              >
                <option>1st Semester</option>
                <option>2nd Semester</option>
                <option>Summer</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-label font-bold uppercase tracking-wider text-on-surface-variant">
                School Year
              </span>
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="h-10 w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 font-body text-sm text-on-surface"
              >
                {termOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <button
                data-keep-action-text="true"
                className="h-10 rounded-lg bg-primary px-4 font-label text-sm font-bold text-on-primary hover:opacity-90 transition-opacity"
                onClick={() => {
                  api(
                    `/grade-computation/me/final-course?semester=${encodeURIComponent(semester)}&term=${encodeURIComponent(term)}`,
                    { headers },
                  )
                    .then((rows: any[]) => setPublishedGrades(rows || []))
                    .catch(() => setPublishedGrades([]));
                }}
              >
                Refresh Grades
              </button>
            </div>
          </div>

          <div className="overflow-auto rounded-lg border border-outline-variant/20">
            <table className="min-w-full text-left text-xs font-body">
              <thead className="bg-surface-container font-label text-on-surface-variant">
                <tr>
                  <th className="px-3 py-2">Course</th>
                  <th className="px-3 py-2">Instructor</th>
                  <th className="px-3 py-2">Units</th>
                  <th className="px-3 py-2">Midterm</th>
                  <th className="px-3 py-2">Final</th>
                  <th className="px-3 py-2">Completion</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((g) => (
                  <tr key={g.courseId} className="border-t border-outline-variant/20">
                    <td className="px-3 py-2">{g.courseTitle}</td>
                    <td className="px-3 py-2">{g.instructor}</td>
                    <td className="px-3 py-2">{g.units}</td>
                    <td className="px-3 py-2">{g.midtermGrade === null || g.midtermGrade === undefined ? "-" : Number(g.midtermGrade).toFixed(2)}</td>
                    <td className="px-3 py-2">{g.finalsGrade === null || g.finalsGrade === undefined ? "-" : Number(g.finalsGrade).toFixed(2)}</td>
                    <td className="px-3 py-2 font-semibold">
                      {g.equivalentGrade === null || g.equivalentGrade === undefined ? "-" : Number(g.equivalentGrade).toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs font-semibold">
                        {Number(g.equivalentGrade ?? 5) <= 3 ? "PASSED" : "FAILED"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        className="rounded-lg border border-outline-variant/40 px-2.5 py-1.5 font-label text-xs text-primary hover:bg-surface-container transition-colors"
                        onClick={() => {
                          setBreakdownRow(g);
                          setBreakdownOpen(true);
                        }}
                      >
                        View breakdown
                      </button>
                    </td>
                  </tr>
                ))}
                {!visible.length && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center font-body text-sm text-on-surface-variant">No published grades yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-3 font-body text-sm italic text-on-surface-variant">
            Pending means your grade is encoded but not yet approved, and is excluded from completion computation.
          </p>
        </article>
        {breakdownOpen && breakdownRow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-6xl rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-xl md:p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-headline text-base font-bold text-primary">
                  Grade Breakdown - {breakdownRow.courseTitle}
                </p>
                <button
                  className="rounded-lg border border-outline-variant/40 px-3 py-1.5 font-label text-xs hover:bg-surface-container transition-colors"
                  onClick={() => {
                    setBreakdownOpen(false);
                    setBreakdownRow(null);
                  }}
                >
                  Close
                </button>
              </div>
              <div className="overflow-auto rounded-lg border border-outline-variant/20">
                <table className="min-w-full text-left text-xs font-body">
                  <thead className="bg-primary font-label text-on-primary">
                    <tr>
                      <th className="px-3 py-2">Grade item</th>
                      <th className="px-3 py-2">Calculated weight</th>
                      <th className="px-3 py-2">Grade</th>
                      <th className="px-3 py-2">Range</th>
                      <th className="px-3 py-2">Scale</th>
                      <th className="px-3 py-2">Feedback</th>
                      <th className="px-3 py-2">Contribution to course total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        item: "Midterm Term Grade",
                        weight: Number(breakdownRow.midtermCourseWeight ?? 50),
                        grade: Number(breakdownRow.midtermGrade ?? 0),
                        feedback: "-",
                      },
                      {
                        item: "Final Term Grade",
                        weight: Number(breakdownRow.finalsCourseWeight ?? 50),
                        grade: Number(breakdownRow.finalsGrade ?? 0),
                        feedback: "-",
                      },
                    ].map((r) => (
                      <tr key={r.item} className="border-t border-outline-variant/20">
                        <td className="px-3 py-2 font-label font-medium text-primary">{r.item}</td>
                        <td className="px-3 py-2">{r.weight}%</td>
                        <td className="px-3 py-2">{r.grade.toFixed(2)}</td>
                        <td className="px-3 py-2">1.00 - 5.00</td>
                        <td className="px-3 py-2">{r.grade.toFixed(2)}</td>
                        <td className="px-3 py-2">{r.feedback}</td>
                        <td className="px-3 py-2">
                          {((r.grade * r.weight) / 100).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-outline-variant/30 bg-surface-container">
                      <td className="px-3 py-2 font-label font-bold text-primary">
                        Course total
                      </td>
                      <td className="px-3 py-2">100%</td>
                      <td className="px-3 py-2">
                        {Number(breakdownRow.finalCourseGrade || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-2">1.00 - 5.00</td>
                      <td className="px-3 py-2">
                        {Number(breakdownRow.finalCourseGrade || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-2">
                        {String(breakdownRow.result || "FAILED")}
                      </td>
                      <td className="px-3 py-2">
                        Eq. {Number(breakdownRow.equivalentGrade || 5).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  if (user.role !== "INSTRUCTOR") {
    return (
      <article className="rounded-lg border border-outline-variant/20 bg-surface-container p-4 font-body text-sm text-on-surface-variant">
        Scores page is available for instructors.
      </article>
    );
  }

  if (showCoursePicker) {
    return (
      <section className="space-y-5">
        <header className="overflow-hidden rounded-lg border border-outline-variant/20 bg-gradient-to-r from-primary to-primary-container shadow-sm">
          <div className="p-4 text-on-primary sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-headline text-xl font-bold tracking-tight">
                Quiz Scores
              </p>
              <span className="rounded-md bg-primary-fixed/30 px-2.5 py-1 text-xs font-label text-primary-fixed">
                Instructor View
              </span>
            </div>
            <p className="mt-1 font-body text-sm text-primary-fixed">
              Select a subject first before opening quiz grades.
            </p>
          </div>
        </header>

        <article className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm md:p-5">
          <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_280px]">
            <input
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2.5 font-body text-sm text-on-surface placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary outline-none"
              placeholder="Search subject"
            />
            <select
              data-keep-action-text="true"
              value=""
              onChange={(e) => {
                const id = Number(e.target.value);
                if (!id) return;
                onSelectCourse(id);
                setShowCoursePicker(false);
              }}
              className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2.5 font-body text-sm text-on-surface"
            >
              <option value="">Select subject first</option>
              {filteredCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <button
                key={course.id}
                onClick={() => {
                  onSelectCourse(course.id);
                  setShowCoursePicker(false);
                }}
                className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-3 text-left hover:bg-surface-container transition-colors"
              >
                <p className="font-label text-xs uppercase tracking-wider text-on-surface-variant">
                  Subject
                </p>
                <p className="mt-1 font-headline text-base font-bold text-primary line-clamp-2">
                  {course.title}
                </p>
              </button>
            ))}
            {!filteredCourses.length && (
              <p className="text-sm text-on-surface-variant">No subjects found.</p>
            )}
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <header className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-4 md:p-5">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-headline text-lg font-bold text-primary">Quiz Scores</p>
          <p className="text-xs font-label text-on-surface-variant">
            Select a course to view student performance.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[auto_1fr_280px]">
          <button
            onClick={() => setShowCoursePicker(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2.5 font-label text-sm text-on-surface hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[1rem]">arrow_back</span>
            Subjects
          </button>
          <input
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2.5 font-body text-sm text-on-surface placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary outline-none"
            placeholder="Search subject"
          />
          <select
            data-keep-action-text="true"
            value={selectedCourse?.id ?? ""}
            onChange={(e) => onSelectCourse(Number(e.target.value))}
            className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2.5 font-body text-sm text-on-surface"
          >
            <option value="" disabled>
              Select subject first
            </option>
            {filteredCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
      </header>

      {selectedCourse ? (
        <ScoresTab
          selectedCourse={selectedCourse}
          attempts={attempts}
          user={user}
          api={api}
          headers={headers}
          setMessage={setMessage}
        />
      ) : (
        <section className="space-y-3">
          <article className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-4 font-body text-sm text-on-surface-variant">
            Select a subject first to view quiz scores.
          </article>
          {!!filteredCourses.length && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => onSelectCourse(course.id)}
                  className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-3 text-left hover:bg-surface-container transition-colors"
                >
                  <p className="font-label text-xs uppercase tracking-wider text-on-surface-variant">
                    Subject
                  </p>
                  <p className="mt-1 font-headline text-base font-bold text-primary line-clamp-2">
                    {course.title}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      )}
    </section>
  );
}
