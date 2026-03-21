import { useEffect, useMemo, useState } from "react";
import type { Attempt, CatalogCourse, Course, User } from "../../../shared/types/lms";
import { StudentCatalogPanel } from "../components/discover/StudentCatalogPanel";
import { fetchCatalogCourses, sendEnrollRequest } from "../services/course.service";

function catalogFromCourses(courses: Course[]): CatalogCourse[] {
  return courses.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description || "",
    instructor: c.instructor || { fullName: "TBA" },
    instructors: c.instructors,
    sections: c.sections.map((s) => ({ id: s.id, name: s.name })),
    enrollmentStatus: "APPROVED" as const,
  }));
}

export function CourseCatalogPage(props: {
  user: User;
  api: (path: string, init?: RequestInit) => Promise<any>;
  headers: Record<string, string>;
  courses: Course[];
  attempts?: Attempt[];
  onOpenCourse: (id: number) => void;
  refreshCore: () => Promise<void>;
  setMessage: (m: string) => void;
}) {
  const {
    user,
    api,
    headers,
    courses,
    attempts = [],
    onOpenCourse,
    refreshCore,
    setMessage,
  } = props;

  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalog, setCatalog] = useState<CatalogCourse[]>([]);
  const [selectedCatalogCourseId, setSelectedCatalogCourseId] = useState<
    number | null
  >(null);
  const [keyInput, setKeyInput] = useState<Record<number, string>>({});
  const [showEnrollRequest, setShowEnrollRequest] = useState<
    Record<number, boolean>
  >({});

  async function loadCatalog(query = catalogQuery) {
    try {
      setCatalog(await fetchCatalogCourses(api, headers, query));
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  useEffect(() => {
    if (user.role === "STUDENT") loadCatalog("");
  }, [user.role]);

  const catalogForDisplay =
    user.role === "STUDENT" ? catalog : catalogFromCourses(courses);
  const selectedCatalogCourse =
    catalogForDisplay.find((c) => c.id === selectedCatalogCourseId) || null;
  const progressByCourseId = useMemo(() => {
    if (user.role !== "STUDENT") return {};
    const grouped: Record<number, { score: number; total: number }> = {};
    for (const attempt of attempts) {
      const courseId = attempt.quiz?.lesson?.course?.id;
      if (courseId == null) continue;
      const current = grouped[courseId] ?? { score: 0, total: 0 };
      current.score += attempt.score;
      current.total += attempt.total;
      grouped[courseId] = current;
    }
    const progressMap: Record<number, number> = {};
    for (const [courseId, agg] of Object.entries(grouped)) {
      progressMap[Number(courseId)] =
        agg.total > 0 ? Math.round((agg.score / agg.total) * 100) : 0;
    }
    return progressMap;
  }, [attempts, user.role]);

  async function requestEnroll(courseId: number) {
    try {
      await sendEnrollRequest(api, headers, courseId, keyInput[courseId] || "");
      setCatalog((prev) =>
        prev.map((c) =>
          c.id === courseId ? { ...c, enrollmentStatus: "PENDING" } : c,
        ),
      );
      await refreshCore();
      setMessage("Enrollment request submitted.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  return (
    <StudentCatalogPanel
      studentViewMode={user.role === "STUDENT" ? "search" : "all"}
      userRole={user.role}
      catalogQuery={catalogQuery}
      setCatalogQuery={setCatalogQuery}
      loadCatalog={loadCatalog}
      catalog={catalogForDisplay}
      selectedCatalogCourseId={selectedCatalogCourseId}
      setSelectedCatalogCourseId={setSelectedCatalogCourseId}
      selectedCatalogCourse={selectedCatalogCourse}
      showEnrollRequest={showEnrollRequest}
      setShowEnrollRequest={setShowEnrollRequest}
      keyInput={keyInput}
      setKeyInput={setKeyInput}
      requestEnroll={requestEnroll}
      onOpenCourse={onOpenCourse}
      progressByCourseId={progressByCourseId}
    />
  );
}
