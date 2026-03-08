import { useEffect, useMemo, useState } from "react";
import type { Course } from "../../../shared/types/lms";

type Instructor = { id: number; fullName: string; email: string };
type SectionInstructor = {
  id: number;
  role?: string | null;
  instructorId: number;
  fullName: string;
  email: string;
};
type InstructorApplication = {
  id: number;
  userId: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  note?: string | null;
  fullName: string;
  email: string;
  createdAt: string;
};

export function AdminBlocksHub(props: {
  api: any;
  headers: any;
  courses: Course[];
  refreshCore: () => Promise<void>;
  setMessage: (m: string) => void;
}) {
  const { api, headers, courses, refreshCore, setMessage } = props;

  const [courseQuery, setCourseQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"create_course" | "block_admin">(
    "create_course",
  );
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(
    courses[0]?.id || null,
  );
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDescription, setNewCourseDescription] = useState("");
  const [editCourseTitle, setEditCourseTitle] = useState("");
  const [editCourseDescription, setEditCourseDescription] = useState("");
  const [showCourseMenu, setShowCourseMenu] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [showCourseOptions, setShowCourseOptions] = useState(false);
  const [newBlockName, setNewBlockName] = useState("");
  const [editingSectionName, setEditingSectionName] = useState("");
  const [managingSectionId, setManagingSectionId] = useState<number | null>(
    null,
  );
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [sectionInstructors, setSectionInstructors] = useState<
    Record<number, SectionInstructor[]>
  >({});
  const [assignBySection, setAssignBySection] = useState<
    Record<number, number | null>
  >({});
  const [instructorQueryBySection, setInstructorQueryBySection] = useState<
    Record<number, string>
  >({});
  const [showInstructorOptions, setShowInstructorOptions] = useState(false);
  const [applications, setApplications] = useState<InstructorApplication[]>([]);

  const filteredCourses = useMemo(() => {
    const q = courseQuery.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => {
      const bag = `${c.title} ${c.description || ""}`.toLowerCase();
      return bag.includes(q);
    });
  }, [courses, courseQuery]);
  const courseOptions = useMemo(
    () => filteredCourses.slice(0, 30),
    [filteredCourses],
  );

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) || null,
    [courses, selectedCourseId],
  );
  const selectedFilteredCourse = useMemo(
    () => filteredCourses.find((c) => c.id === selectedCourseId) || null,
    [filteredCourses, selectedCourseId],
  );
  const activeBlockAdminCourse =
    selectedFilteredCourse || filteredCourses[0] || null;
  const managingSection = useMemo(
    () =>
      selectedCourse?.sections.find((s) => s.id === managingSectionId) || null,
    [selectedCourse, managingSectionId],
  );
  const activeAssignedInstructor = useMemo(() => {
    if (!managingSection) return null;
    const id = assignBySection[managingSection.id];
    return instructors.find((i) => i.id === id) || null;
  }, [assignBySection, instructors, managingSection?.id]);
  const filteredInstructorOptions = useMemo(() => {
    if (!managingSection) return [];
    const query = (instructorQueryBySection[managingSection.id] || "")
      .trim()
      .toLowerCase();
    const base = instructors.filter((i) => {
      if (!query) return true;
      const bag = `${i.fullName} ${i.email}`.toLowerCase();
      return bag.includes(query);
    });
    return base.slice(0, 30);
  }, [instructorQueryBySection, instructors, managingSection?.id]);

  useEffect(() => {
    if (!selectedCourseId && courses[0]) {
      setSelectedCourseId(courses[0].id);
      return;
    }
    if (
      selectedCourseId &&
      !courses.some((course) => course.id === selectedCourseId)
    ) {
      setSelectedCourseId(courses[0]?.id || null);
    }
  }, [courses, selectedCourseId]);

  useEffect(() => {
    if (activeTab !== "block_admin") return;
    if (!activeBlockAdminCourse) return;
    if (selectedCourseId !== activeBlockAdminCourse.id) {
      setSelectedCourseId(activeBlockAdminCourse.id);
    }
  }, [activeTab, activeBlockAdminCourse?.id, selectedCourseId]);

  async function loadInstructors() {
    try {
      const rows = await api("/courses/instructors", { headers });
      setInstructors(rows);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function loadApplications() {
    try {
      const rows = await api("/auth/instructor-applications", { headers });
      setApplications(rows);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function loadSectionInstructors(sectionId: number, courseId: number) {
    try {
      const rows = await api(
        `/courses/${courseId}/sections/${sectionId}/instructors`,
        { headers },
      );
      const normalized = rows.map((r: any) => ({
        id: r.id,
        role: r.role,
        instructorId: r.instructorId || r.instructor?.id,
        fullName: r.fullName || r.instructor?.fullName,
        email: r.email || r.instructor?.email,
      }));
      setSectionInstructors((p) => ({ ...p, [sectionId]: normalized }));
      if (!assignBySection[sectionId] && instructors[0]) {
        setAssignBySection((p) => ({ ...p, [sectionId]: instructors[0].id }));
      }
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  useEffect(() => {
    loadInstructors();
    loadApplications();
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    selectedCourse.sections.forEach((s) => {
      loadSectionInstructors(s.id, selectedCourse.id);
    });
  }, [selectedCourse?.id, courses.length]);

  useEffect(() => {
    if (!instructors.length || !selectedCourse) return;
    const updates: Record<number, number> = {};
    selectedCourse.sections.forEach((s) => {
      if (!assignBySection[s.id]) updates[s.id] = instructors[0].id;
    });
    if (Object.keys(updates).length) {
      setAssignBySection((p) => ({ ...p, ...updates }));
    }
  }, [instructors, selectedCourse?.id]);

  useEffect(() => {
    if (!selectedCourse) return;
    setEditCourseTitle(selectedCourse.title || "");
    setEditCourseDescription(selectedCourse.description || "");
    setShowCourseMenu(false);
    setShowEditCourseModal(false);
  }, [selectedCourse?.id, selectedCourse?.title, selectedCourse?.description]);

  useEffect(() => {
    if (!managingSection) return;
    setEditingSectionName(managingSection.name);
    const selected = assignBySection[managingSection.id];
    const current = instructors.find((i) => i.id === selected);
    setInstructorQueryBySection((p) => ({
      ...p,
      [managingSection.id]: current
        ? `${current.fullName} (${current.email})`
        : "",
    }));
    setShowInstructorOptions(false);
  }, [
    managingSection?.id,
    managingSection?.name,
    assignBySection,
    instructors,
  ]);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab("create_course")}
          className={`rounded-md px-3 py-2 text-sm font-medium ${
            activeTab === "create_course"
              ? "bg-blue-700 text-white"
              : "border border-slate-300 bg-white text-slate-700"
          }`}
        >
          Create Course
        </button>
        <button
          onClick={() => setActiveTab("block_admin")}
          className={`rounded-md px-3 py-2 text-sm font-medium ${
            activeTab === "block_admin"
              ? "bg-blue-700 text-white"
              : "border border-slate-300 bg-white text-slate-700"
          }`}
        >
          Block Admin
        </button>
      </div>

      {activeTab === "create_course" && (
        <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold">Create Course</h3>
          <p className="mb-3 text-xs text-slate-500">
            Create a new subject. Instructor assignment is done per block.
          </p>
          <div className="grid gap-2 md:grid-cols-2">
            <input
              value={newCourseTitle}
              onChange={(e) => setNewCourseTitle(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="New course title"
            />
            <textarea
              value={newCourseDescription}
              onChange={(e) => setNewCourseDescription(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="New course description"
            />
            <button
              onClick={async () => {
                try {
                  await api("/courses", {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                      title: newCourseTitle,
                      description: newCourseDescription,
                    }),
                  });
                  setNewCourseTitle("");
                  setNewCourseDescription("");
                  await refreshCore();
                  setMessage("Course created.");
                } catch (e) {
                  setMessage((e as Error).message);
                }
              }}
              className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white md:col-span-2"
            >
              Create Course
            </button>
          </div>
        </article>
      )}

      <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              Instructor Registration Review
            </h3>
            <p className="text-xs text-slate-500">
              Approve or reject instructor accounts before they can log in.
            </p>
          </div>
          <button
            onClick={() => loadApplications()}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
          >
            Refresh
          </button>
        </div>
        <div className="space-y-2">
          {applications.map((app) => (
            <article
              key={app.id}
              className="rounded-md border border-slate-200 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{app.fullName}</p>
                  <p className="text-xs text-slate-500">{app.email}</p>
                  <p className="mt-1 text-xs">
                    <span
                      className={`rounded px-2 py-0.5 ${
                        app.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-700"
                          : app.status === "REJECTED"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {app.status}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        await api(
                          `/auth/instructor-applications/${app.userId}`,
                          {
                            method: "PATCH",
                            headers,
                            body: JSON.stringify({ status: "APPROVED" }),
                          },
                        );
                        await loadApplications();
                        setMessage("Instructor approved.");
                      } catch (e) {
                        setMessage((e as Error).message);
                      }
                    }}
                    className="rounded-md bg-emerald-600 px-2 py-1 text-xs text-white"
                  >
                    Approve
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await api(
                          `/auth/instructor-applications/${app.userId}`,
                          {
                            method: "PATCH",
                            headers,
                            body: JSON.stringify({ status: "REJECTED" }),
                          },
                        );
                        await loadApplications();
                        setMessage("Instructor rejected.");
                      } catch (e) {
                        setMessage((e as Error).message);
                      }
                    }}
                    className="rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </article>
          ))}
          {!applications.length && (
            <p className="text-sm text-slate-500">
              No instructor applications.
            </p>
          )}
        </div>
      </article>

      {activeTab === "block_admin" && activeBlockAdminCourse && (
        <div className="space-y-4">
          <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative">
              <input
                value={courseQuery}
                onChange={(e) => {
                  setCourseQuery(e.target.value);
                  setShowCourseOptions(true);
                }}
                onFocus={() => setShowCourseOptions(true)}
                onBlur={() =>
                  setTimeout(() => setShowCourseOptions(false), 120)
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Search and select a course"
              />
              {showCourseOptions && (
                <div className="absolute left-0 right-0 top-11 z-20 max-h-72 overflow-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg">
                  {courseOptions.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCourseId(c.id);
                        setCourseQuery(c.title);
                        setShowCourseOptions(false);
                      }}
                      className={`w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-100 ${
                        c.id === activeBlockAdminCourse.id ? "bg-slate-100" : ""
                      }`}
                    >
                      <p className="font-medium">{c.title}</p>
                      <p className="truncate text-xs text-slate-500">
                        {c.description}
                      </p>
                    </button>
                  ))}
                  {!courseOptions.length && (
                    <p className="px-3 py-2 text-xs text-slate-500">
                      No matching courses.
                    </p>
                  )}
                </div>
              )}
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="mb-1 text-lg font-semibold">Course Settings</h3>
                <p className="text-xs text-slate-500">
                  Configure course-level details only.
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {activeBlockAdminCourse.title}
                </p>
                <p className="text-sm text-slate-600">
                  {activeBlockAdminCourse.description}
                </p>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowCourseMenu((v) => !v)}
                  className="rounded-md border border-slate-300 p-2"
                  aria-label="Open course actions"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="currentColor"
                  >
                    <circle cx="12" cy="5" r="1.8" />
                    <circle cx="12" cy="12" r="1.8" />
                    <circle cx="12" cy="19" r="1.8" />
                  </svg>
                </button>
                {showCourseMenu && (
                  <div className="absolute right-0 top-10 z-20 w-44 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
                    <button
                      onClick={() => {
                        setShowEditCourseModal(true);
                        setShowCourseMenu(false);
                      }}
                      className="w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-100"
                    >
                      Edit Course
                    </button>
                    <button
                      onClick={async () => {
                        setShowCourseMenu(false);
                        const ok = confirm(
                          `Delete ${activeBlockAdminCourse.title}? This permanently removes blocks, lessons, and enrollments.`,
                        );
                        if (!ok) return;
                        try {
                          await api(`/courses/${activeBlockAdminCourse.id}`, {
                            method: "DELETE",
                            headers,
                          });
                          await refreshCore();
                          setMessage("Course deleted.");
                        } catch (e) {
                          setMessage((e as Error).message);
                        }
                      }}
                      className="w-full rounded px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                    >
                      Delete Course
                    </button>
                  </div>
                )}
              </div>
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold">Blocks</h3>
                <p className="text-xs text-slate-500">
                  Add and manage blocks. Instructor assignment is inside each
                  block panel.
                </p>
              </div>
              <span className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                {activeBlockAdminCourse.sections.length} block(s)
              </span>
            </div>

            <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto]">
              <input
                value={newBlockName}
                onChange={(e) => setNewBlockName(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Add block (e.g., BLOCK-D)"
              />
              <button
                onClick={async () => {
                  try {
                    await api(
                      `/courses/${activeBlockAdminCourse.id}/sections`,
                      {
                        method: "POST",
                        headers,
                        body: JSON.stringify({ name: newBlockName }),
                      },
                    );
                    setNewBlockName("");
                    await refreshCore();
                    setMessage("Block created.");
                  } catch (e) {
                    setMessage((e as Error).message);
                  }
                }}
                className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white"
              >
                Add Block
              </button>
            </div>

            <div className="space-y-2">
              {activeBlockAdminCourse.sections.map((s) => (
                <article
                  key={s.id}
                  className="flex items-center justify-between rounded-md border border-slate-200 p-3"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-500">
                      Instructor(s): {(sectionInstructors[s.id] || []).length}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setManagingSectionId(s.id)}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    >
                      Manage
                    </button>
                    <button
                      onClick={async () => {
                        const ok = confirm(
                          `Delete ${s.name}? This removes lessons/resources tied to this block.`,
                        );
                        if (!ok) return;
                        try {
                          await api(
                            `/courses/${activeBlockAdminCourse.id}/sections/${s.id}`,
                            {
                              method: "DELETE",
                              headers,
                            },
                          );
                          await refreshCore();
                          setMessage("Block deleted.");
                        } catch (e) {
                          setMessage((e as Error).message);
                        }
                      }}
                      className="rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </div>
      )}

      {activeTab === "block_admin" && !activeBlockAdminCourse && (
        <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-900">
            No matching courses
          </p>
          <p className="text-xs text-slate-500">
            Try another keyword or clear the search field.
          </p>
        </article>
      )}

      {activeTab === "block_admin" && selectedCourse && managingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <article className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Manage {managingSection.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Block instructor assignment and block details.
                </p>
              </div>
              <button
                onClick={() => setManagingSectionId(null)}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
              >
                Close
              </button>
            </div>

            <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-sm font-semibold">Block Settings</p>
              <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                <input
                  value={editingSectionName}
                  onChange={(e) => setEditingSectionName(e.target.value)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  onClick={async () => {
                    try {
                      await api(
                        `/courses/${selectedCourse.id}/sections/${managingSection.id}`,
                        {
                          method: "PATCH",
                          headers,
                          body: JSON.stringify({ name: editingSectionName }),
                        },
                      );
                      await refreshCore();
                      setMessage("Block updated.");
                    } catch (e) {
                      setMessage((e as Error).message);
                    }
                  }}
                  className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white"
                >
                  Save Name
                </button>
              </div>
            </div>

            <div className="mb-3 rounded-md border border-slate-200 p-3">
              <p className="mb-2 text-sm font-semibold">Assigned Instructors</p>
              <div className="space-y-2">
                {(sectionInstructors[managingSection.id] || []).map((i) => (
                  <div
                    key={`${managingSection.id}-${i.instructorId}`}
                    className="flex items-center justify-between rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                  >
                    <div>
                      <p>{i.fullName}</p>
                      <p className="text-xs text-slate-500">{i.email}</p>
                    </div>
                    <button
                      onClick={async () => {
                        const ok = confirm(
                          `Remove ${i.fullName} from ${managingSection.name}?`,
                        );
                        if (!ok) return;
                        try {
                          await api(
                            `/courses/${selectedCourse.id}/sections/${managingSection.id}/instructors/${i.instructorId}`,
                            { method: "DELETE", headers },
                          );
                          await loadSectionInstructors(
                            managingSection.id,
                            selectedCourse.id,
                          );
                          setMessage("Instructor removed from block.");
                        } catch (e) {
                          setMessage((e as Error).message);
                        }
                      }}
                      className="rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {!(sectionInstructors[managingSection.id] || []).length && (
                  <p className="text-xs text-slate-500">
                    No instructors assigned yet.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-md border border-slate-200 p-3">
              <p className="mb-2 text-sm font-semibold">Assign Instructor</p>
              <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                <div className="relative">
                  <input
                    value={instructorQueryBySection[managingSection.id] || ""}
                    onChange={(e) => {
                      setInstructorQueryBySection((p) => ({
                        ...p,
                        [managingSection.id]: e.target.value,
                      }));
                      setShowInstructorOptions(true);
                    }}
                    onFocus={() => setShowInstructorOptions(true)}
                    onBlur={() =>
                      setTimeout(() => setShowInstructorOptions(false), 120)
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Search instructor by name or email"
                  />
                  {showInstructorOptions && (
                    <div className="absolute left-0 right-0 top-11 z-20 max-h-72 overflow-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg">
                      {filteredInstructorOptions.map((i) => (
                        <button
                          key={i.id}
                          onClick={() => {
                            setAssignBySection((p) => ({
                              ...p,
                              [managingSection.id]: i.id,
                            }));
                            setInstructorQueryBySection((p) => ({
                              ...p,
                              [managingSection.id]: `${i.fullName} (${i.email})`,
                            }));
                            setShowInstructorOptions(false);
                          }}
                          className="w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-100"
                        >
                          <p className="font-medium">{i.fullName}</p>
                          <p className="truncate text-xs text-slate-500">
                            {i.email}
                          </p>
                        </button>
                      ))}
                      {!filteredInstructorOptions.length && (
                        <p className="px-3 py-2 text-xs text-slate-500">
                          No matching instructors.
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={async () => {
                    const instructorId = assignBySection[managingSection.id];
                    if (!instructorId) return;
                    try {
                      await api(
                        `/courses/${selectedCourse.id}/sections/${managingSection.id}/instructors`,
                        {
                          method: "POST",
                          headers,
                          body: JSON.stringify({ instructorId }),
                        },
                      );
                      await loadSectionInstructors(
                        managingSection.id,
                        selectedCourse.id,
                      );
                      setMessage("Instructor assigned to block.");
                    } catch (e) {
                      setMessage((e as Error).message);
                    }
                  }}
                  className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white"
                >
                  Assign
                </button>
              </div>
              {activeAssignedInstructor && (
                <p className="mt-2 text-xs text-slate-500">
                  Selected: {activeAssignedInstructor.fullName} (
                  {activeAssignedInstructor.email})
                </p>
              )}
            </div>
          </article>
        </div>
      )}

      {activeTab === "block_admin" && showEditCourseModal && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <article className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Edit Course</h3>
              <button
                onClick={() => setShowEditCourseModal(false)}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
              >
                Close
              </button>
            </div>
            <div className="grid gap-2">
              <input
                value={editCourseTitle}
                onChange={(e) => setEditCourseTitle(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Course title"
              />
              <textarea
                value={editCourseDescription}
                onChange={(e) => setEditCourseDescription(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Course description"
              />
              <button
                onClick={async () => {
                  try {
                    await api(`/courses/${selectedCourse.id}`, {
                      method: "PUT",
                      headers,
                      body: JSON.stringify({
                        title: editCourseTitle,
                        description: editCourseDescription,
                      }),
                    });
                    await refreshCore();
                    setShowEditCourseModal(false);
                    setMessage("Course updated.");
                  } catch (e) {
                    setMessage((e as Error).message);
                  }
                }}
                className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
              >
                Update Course
              </button>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
