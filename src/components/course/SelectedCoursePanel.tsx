import { useEffect, useState } from "react";
import type { Attempt, Course, Lesson, User } from "../../types/lms";
import {
  ConfirmRemoveAllModal,
  CourseInfoModal,
  EditCourseModal,
  EditLessonModal,
  EditSectionModal,
  EnrollmentManagerModal,
  LessonComposerModal,
} from "./selected-course/Modals";

type Props = {
  selectedCourse: Course | null;
  user: User;
  studentViewMode: "all" | "my" | "search";
  roster: Record<number, any[]>;
  loadRoster: (courseId: number) => Promise<void>;
  activeCourseTab: "content" | "quizzes" | "scores";
  setActiveCourseTab: (tab: "content" | "quizzes" | "scores") => void;
  regenerateEnrollmentKey: (courseId: number) => Promise<void>;
  showAddSection: Record<number, boolean>;
  setShowAddSection: (v: any) => void;
  newSection: Record<number, string>;
  setNewSection: (v: any) => void;
  addSection: (courseId: number) => Promise<void>;
  updateSection: (
    courseId: number,
    sectionId: number,
    name: string,
  ) => Promise<void>;
  deleteSection: (courseId: number, sectionId: number) => Promise<void>;
  showManualEnroll: Record<number, boolean>;
  setShowManualEnroll: (v: any) => void;
  manualEmail: Record<number, string>;
  setManualEmail: (v: any) => void;
  manualSection: Record<number, number>;
  setManualSection: (v: any) => void;
  manualAdd: (course: Course) => Promise<void>;
  showAddLesson: Record<number, boolean>;
  setShowAddLesson: (v: any) => void;
  lessonTargetSection: Record<number, number>;
  setLessonTargetSection: (v: any) => void;
  lessonInput: Record<
    number,
    { title: string; content: string; fileUrl: string }
  >;
  setLessonInput: (v: any) => void;
  addLesson: (
    courseId: number,
    sectionId: number,
    lessonOverride?: { title: string; content: string; fileUrl: string },
  ) => Promise<void>;
  updateLesson: (
    courseId: number,
    sectionId: number,
    lessonId: number,
    payload: { title?: string; content?: string; fileUrl?: string },
  ) => Promise<void>;
  deleteLesson: (
    courseId: number,
    sectionId: number,
    lessonId: number,
  ) => Promise<void>;
  updateQuiz: (quizId: number, questions: any[]) => Promise<void>;
  deleteQuiz: (quizId: number) => Promise<void>;
  loadPending: (courseId: number) => Promise<void>;
  pending: Record<
    number,
    { id: number; student: { fullName: string; email: string } }[]
  >;
  approveSection: Record<number, number>;
  setApproveSection: (v: any) => void;
  decide: (
    courseId: number,
    enrollmentId: number,
    status: "APPROVED" | "REJECTED",
  ) => Promise<void>;
  attempts: Attempt[];
  groupForLesson: (lesson: Lesson) => string;
  api: any;
  headers: any;
  refreshCore: () => Promise<void>;
  setMessage: (m: string) => void;
  updateCourse: (
    courseId: number,
    payload: { title: string; description: string },
  ) => Promise<void>;
  archiveCourse: (courseId: number) => Promise<void>;
  deleteCourse: (courseId: number) => Promise<void>;
  leaveCourse: (courseId: number) => Promise<void>;
  kickStudent: (courseId: number, enrollmentId: number) => Promise<void>;
  kickAllInSection: (courseId: number, sectionId: number) => Promise<void>;
};

export function SelectedCoursePanel(props: Props) {
  const [showCourseInfo, setShowCourseInfo] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [lessonComposerSectionId, setLessonComposerSectionId] = useState<
    number | null
  >(null);
  const [collapsedBlocks, setCollapsedBlocks] = useState<
    Record<number, boolean>
  >({});
  const [lessonMenuOpenId, setLessonMenuOpenId] = useState<number | null>(null);
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [isUploadingResource, setIsUploadingResource] = useState(false);
  const [editingLesson, setEditingLesson] = useState<{
    sectionId: number;
    lesson: Lesson;
  } | null>(null);
  const [editLessonInput, setEditLessonInput] = useState({
    title: "",
    content: "",
    fileUrl: "",
  });
  const [sectionMenuOpenId, setSectionMenuOpenId] = useState<number | null>(
    null,
  );
  const [editingSection, setEditingSection] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [editCourseOpen, setEditCourseOpen] = useState(false);
  const [editCourseInput, setEditCourseInput] = useState({
    title: "",
    description: "",
  });
  const [kickSectionId, setKickSectionId] = useState<number | null>(null);
  const [enrollSectionId, setEnrollSectionId] = useState<number | null>(null);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [confirmRemoveAllOpen, setConfirmRemoveAllOpen] = useState(false);
  const [showDangerTools, setShowDangerTools] = useState(false);
  const [showEnrollmentManager, setShowEnrollmentManager] = useState(false);
  const [rosterQuery, setRosterQuery] = useState("");
  const [rosterPage, setRosterPage] = useState(1);
  const {
    selectedCourse,
    user,
    studentViewMode,
    roster,
    loadRoster,
    activeCourseTab,
    setActiveCourseTab,
    regenerateEnrollmentKey,
    updateSection,
    deleteSection,
    manualEmail,
    setManualEmail,
    setManualSection,
    manualAdd,
    lessonInput,
    setLessonInput,
    addLesson,
    updateLesson,
    deleteLesson,
    updateQuiz,
    deleteQuiz,
    loadPending,
    pending,
    approveSection,
    setApproveSection,
    decide,
    attempts,
    groupForLesson,
    api,
    headers,
    refreshCore,
    setMessage,
    updateCourse,
    archiveCourse,
    deleteCourse,
    leaveCourse,
    kickStudent,
    kickAllInSection,
  } = props;

  if (
    !selectedCourse ||
    (user.role !== "INSTRUCTOR" && studentViewMode === "search")
  ) {
    return null;
  }

  const enrolledStudents = (roster[selectedCourse.id] || []).map(
    (r: any) => r.student,
  );
  const rosterRows = roster[selectedCourse.id] || [];
  const uniqueStudents: { id: number; fullName: string }[] = [];
  const seen = new Set<number>();
  for (const student of enrolledStudents) {
    if (!student?.id || !student?.fullName || seen.has(student.id)) continue;
    seen.add(student.id);
    uniqueStudents.push({ id: student.id, fullName: student.fullName });
  }
  const composerSection =
    selectedCourse.sections.find(
      (section) => section.id === lessonComposerSectionId,
    ) || null;
  const filteredRosterRows = rosterRows.filter((r: any) => {
    const matchesSection = enrollSectionId
      ? r.section?.id === enrollSectionId
      : true;
    if (!matchesSection) return false;
    const q = rosterQuery.trim().toLowerCase();
    if (!q) return true;
    const name = String(r.student?.fullName || "").toLowerCase();
    const email = String(r.student?.email || "").toLowerCase();
    return name.includes(q) || email.includes(q);
  });
  const rosterPageSize = 10;
  const rosterTotalPages = Math.max(
    1,
    Math.ceil(filteredRosterRows.length / rosterPageSize),
  );
  const safeRosterPage = Math.min(rosterPage, rosterTotalPages);
  const pagedRosterRows = filteredRosterRows.slice(
    (safeRosterPage - 1) * rosterPageSize,
    safeRosterPage * rosterPageSize,
  );

  function toUserMessage(error: unknown) {
    const msg = (error as Error)?.message || "Request failed";
    if (msg.includes("Google Drive not linked")) {
      return "Google Drive is not linked. Please link your account in the Files tab first.";
    }
    if (msg.includes("Service account uploads require")) {
      return "Drive upload is disabled in service-account mode. Use OAuth-linked account.";
    }
    if (msg.includes("Uploaded file is too large")) {
      return "Selected file is too large. Please choose a smaller file.";
    }
    return msg;
  }

  async function toBase64(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || "");
        const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Failed to read selected file"));
      reader.readAsDataURL(file);
    });
  }

  async function saveResourceToLesson() {
    if (!composerSection) return;
    const current = lessonInput[selectedCourse!.id] || {
      title: "",
      content: "",
      fileUrl: "",
    };
    if (!current.title.trim() || !current.content.trim()) {
      setMessage("Please provide both resource title and description.");
      return;
    }

    try {
      setIsUploadingResource(true);
      let driveLink = current.fileUrl || "";

      if (resourceFile) {
        const base64 = await toBase64(resourceFile);
        const uploaded = await api("/storage/google/upload", {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: resourceFile.name,
            contentBase64: base64,
            mimeType: resourceFile.type || "application/octet-stream",
          }),
        });
        driveLink = uploaded?.webViewLink || uploaded?.webContentLink || "";
      }

      await addLesson(selectedCourse!.id, composerSection.id, {
        title: current.title,
        content: current.content,
        fileUrl: driveLink,
      });
      setResourceFile(null);
      setLessonComposerSectionId(null);
      setMessage("Resource saved. Students can open the uploaded file.");
    } catch (e) {
      setMessage(toUserMessage(e));
    } finally {
      setIsUploadingResource(false);
    }
  }

  useEffect(() => {
    setCollapsedBlocks(
      selectedCourse.sections.reduce(
        (acc, section) => ({ ...acc, [section.id]: false }),
        {} as Record<number, boolean>,
      ),
    );
  }, [selectedCourse.id]);

  useEffect(() => {
    setEditCourseInput({
      title: selectedCourse.title || "",
      description: selectedCourse.description || "",
    });
    setKickSectionId(selectedCourse.sections[0]?.id || null);
    setEnrollSectionId(selectedCourse.sections[0]?.id || null);
    setRosterQuery("");
    setRosterPage(1);
  }, [selectedCourse.id, selectedCourse.title, selectedCourse.description]);

  return (
    <article className="rounded-md border border-slate-200 p-3">
      <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
        <p className="mb-1 font-semibold">Course Announcements</p>
        <p>
          Welcome to {selectedCourse.title}. Check your section content and
          complete quizzes before deadlines.
        </p>
      </div>

      <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Course
        </p>
        <p className="text-xl font-semibold text-slate-900">
          {selectedCourse.title}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {selectedCourse.description}
        </p>
      </div>

      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          {user.role === "INSTRUCTOR" && (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-sm text-blue-700">
                Enrollment Key: {selectedCourse.enrollmentKey}
              </p>
              <button
                onClick={() => regenerateEnrollmentKey(selectedCourse.id)}
                className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
              >
                New Key
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadRoster(selectedCourse.id)}
            className="rounded border border-slate-300 p-2 text-xs"
            title="Refresh student list"
            aria-label="Refresh student list"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <polyline points="21 3 21 9 15 9" />
            </svg>
          </button>
          <button
            onClick={() => setShowCourseInfo(true)}
            className="rounded border border-slate-300 p-2 text-xs"
            aria-label="Open course info"
            title="Course info"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <circle cx="12" cy="5" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="12" cy="19" r="1.8" />
            </svg>
          </button>
        </div>
      </div>

      {user.role === "INSTRUCTOR" && (
        <section className="mb-4 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
          <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Course Content</p>
                <p className="text-xs text-slate-500">
                  Manage blocks and resources only.
                </p>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowAddMenu((v) => !v)}
                  className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white"
                >
                  + Add
                </button>
                {showAddMenu && (
                  <div className="absolute right-0 top-11 z-20 w-48 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
                    <button
                      onClick={() => {
                        setActiveCourseTab("content");
                        setLessonComposerSectionId(
                          selectedCourse.sections[0]?.id || null,
                        );
                        setShowAddMenu(false);
                      }}
                      className="w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-100"
                    >
                      Add Resource
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Blocks: {selectedCourse.sections.length}
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold">Enrollment / Students</p>
              <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                By Block
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                <p className="text-slate-600">
                  {filteredRosterRows.length} student(s) in selected block
                </p>
                <button
                  onClick={() => setShowEnrollmentManager(true)}
                  className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-white"
                >
                  Manage Enrollment
                </button>
              </div>
            </div>
          </article>
        </section>
      )}

      {user.role === "INSTRUCTOR" && (
        <section className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Pending Requests</p>
              <p className="text-xs text-slate-500">
                Review enrollment applications by assigning a block.
              </p>
            </div>
            <button
              onClick={() => loadPending(selectedCourse.id)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
              title="Refresh pending"
            >
              Refresh
            </button>
          </div>
          <div className="hidden grid-cols-[1.2fr_1fr_auto] gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 md:grid">
            <p>Student</p>
            <p>Assign Block</p>
            <p>Actions</p>
          </div>
          <div className="mt-2 space-y-2">
            {(pending[selectedCourse.id] || []).length === 0 && (
              <p className="rounded-md border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-500">
                No pending requests.
              </p>
            )}
            {(pending[selectedCourse.id] || []).map((p) => (
              <article
                key={p.id}
                className="grid gap-2 rounded-md border border-slate-200 bg-white p-3 md:grid-cols-[1.2fr_1fr_auto] md:items-center"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {p.student.fullName}
                  </p>
                  <p className="text-xs text-slate-500">{p.student.email}</p>
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
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
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
                    className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-white"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => decide(selectedCourse.id, p.id, "REJECTED")}
                    className="rounded-md bg-rose-600 px-3 py-2 text-xs font-medium text-white"
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="mb-4 flex flex-wrap gap-2 rounded-md border border-slate-200 bg-slate-50 p-1">
        <button
          onClick={() => setActiveCourseTab("content")}
          className={`rounded-md px-3 py-2 text-sm font-medium ${activeCourseTab === "content" ? "bg-blue-700 text-white shadow-sm" : "bg-transparent text-slate-700 hover:bg-white"}`}
        >
          Content
        </button>
        <button
          onClick={() => setActiveCourseTab("quizzes")}
          className={`rounded-md px-3 py-2 text-sm font-medium ${activeCourseTab === "quizzes" ? "bg-blue-700 text-white shadow-sm" : "bg-transparent text-slate-700 hover:bg-white"}`}
        >
          Quizzes
        </button>
        <button
          onClick={() => setActiveCourseTab("scores")}
          className={`rounded-md px-3 py-2 text-sm font-medium ${activeCourseTab === "scores" ? "bg-blue-700 text-white shadow-sm" : "bg-transparent text-slate-700 hover:bg-white"}`}
        >
          Scores
        </button>
      </div>

      {activeCourseTab === "content" && user.role === "INSTRUCTOR" && (
        <div className="space-y-3">
          {selectedCourse.sections.map((s) => (
            <section
              key={s.id}
              id={`section-${s.id}`}
              className="rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                <button
                  onClick={() =>
                    setCollapsedBlocks((prev) => ({
                      ...prev,
                      [s.id]: !prev[s.id],
                    }))
                  }
                  className="flex items-center gap-2 text-left"
                >
                  <svg
                    viewBox="0 0 20 20"
                    className={`h-4 w-4 text-slate-500 transition-transform ${
                      collapsedBlocks[s.id] ? "rotate-0" : "rotate-90"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M7 6l6 4-6 4" />
                  </svg>
                  <p className="font-semibold text-slate-900">{s.name}</p>
                </button>
                <div className="relative flex items-center gap-2">
                  <button
                    onClick={() =>
                      setLessonComposerSectionId((prev) =>
                        prev === s.id ? null : s.id,
                      )
                    }
                    className="rounded-md bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800"
                  >
                    + Add Resource
                  </button>
                  <button
                    onClick={() =>
                      setSectionMenuOpenId((prev) =>
                        prev === s.id ? null : s.id,
                      )
                    }
                    className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-white"
                    aria-label={`More actions for ${s.name}`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="5" r="1.8" />
                      <circle cx="12" cy="12" r="1.8" />
                      <circle cx="12" cy="19" r="1.8" />
                    </svg>
                  </button>
                  {sectionMenuOpenId === s.id && (
                    <div className="absolute right-0 top-9 z-40 w-40 rounded-md border border-slate-200 bg-white p-1.5 shadow-lg">
                      <button
                        onClick={() => {
                          setEditingSection({ id: s.id, name: s.name });
                          setSectionMenuOpenId(null);
                        }}
                        className="w-full rounded px-2 py-1.5 text-left text-xs font-medium hover:bg-slate-100"
                      >
                        Edit Block
                      </button>
                      <div className="my-1 border-t border-slate-200" />
                      <button
                        onClick={async () => {
                          if (
                            !confirm(
                              `Delete block "${s.name}" and all its content?`,
                            )
                          )
                            return;
                          await deleteSection(selectedCourse.id, s.id);
                          setSectionMenuOpenId(null);
                        }}
                        className="w-full rounded px-2 py-1.5 text-left text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        Delete Block
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {!collapsedBlocks[s.id] && (
                <div className="space-y-3 p-3">
                  {(
                    [
                      "Lecture",
                      "Laboratory",
                      "Class Activities",
                      "Quizzes",
                      "Examinations",
                      "Resources",
                    ] as const
                  ).map((group) => {
                    const items = s.lessons.filter(
                      (l) => groupForLesson(l) === group,
                    );
                    if (!items.length) return null;
                    return (
                      <div key={group}>
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            {group}
                          </span>
                        </div>
                        <div className="divide-y divide-slate-100 rounded-md border border-slate-200">
                          {items.map((l) => (
                            <article
                              key={l.id}
                              className="flex items-center justify-between gap-3 overflow-visible px-3 py-2 hover:bg-slate-50"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-900">
                                  {l.quiz ? "?" : l.fileUrl ? "F" : "L"}{" "}
                                  {l.title}
                                </p>
                                {l.content &&
                                  l.content.trim().toLowerCase() !==
                                    l.title.trim().toLowerCase() && (
                                    <p className="truncate text-xs text-slate-500">
                                      {l.content}
                                    </p>
                                  )}
                              </div>
                              <div className="relative flex shrink-0 items-center gap-1">
                                {l.fileUrl && (
                                  <a
                                    className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-white"
                                    href={l.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Open
                                  </a>
                                )}
                                <button
                                  onClick={() =>
                                    setLessonMenuOpenId((prev) =>
                                      prev === l.id ? null : l.id,
                                    )
                                  }
                                  className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-white"
                                  aria-label={`More actions for ${l.title}`}
                                >
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="h-4 w-4"
                                    fill="currentColor"
                                    aria-hidden="true"
                                  >
                                    <circle cx="12" cy="5" r="1.8" />
                                    <circle cx="12" cy="12" r="1.8" />
                                    <circle cx="12" cy="19" r="1.8" />
                                  </svg>
                                </button>
                                {lessonMenuOpenId === l.id && (
                                  <div className="absolute right-0 top-9 z-40 w-28 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
                                    <button
                                      onClick={() => {
                                        setEditingLesson({
                                          sectionId: s.id,
                                          lesson: l,
                                        });
                                        setEditLessonInput({
                                          title: l.title || "",
                                          content: l.content || "",
                                          fileUrl: l.fileUrl || "",
                                        });
                                        setLessonMenuOpenId(null);
                                      }}
                                      className="w-full rounded px-2 py-1 text-left text-xs hover:bg-slate-100"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (
                                          !confirm(
                                            `Delete lesson "${l.title}"?`,
                                          )
                                        )
                                          return;
                                        await deleteLesson(
                                          selectedCourse.id,
                                          s.id,
                                          l.id,
                                        );
                                        setLessonMenuOpenId(null);
                                      }}
                                      className="w-full rounded px-2 py-1 text-left text-xs text-rose-600 hover:bg-rose-50"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {!s.lessons.length && (
                    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
                      <p className="text-sm font-medium text-slate-700">
                        No lessons yet.
                      </p>
                      <p className="text-xs text-slate-500">
                        Add your first lesson to this block.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {activeCourseTab === "content" && user.role === "STUDENT" && (
        <div className="space-y-4">
          {selectedCourse.sections.map((s, sectionIndex) => (
            <section
              key={s.id}
              id={`section-${s.id}`}
              className="rounded-md border border-slate-200 bg-white"
            >
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Topic {sectionIndex + 1}
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {s.name}
                  </p>
                </div>
                <span className="text-xs text-slate-500">
                  {s.lessons.length} activities
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {s.lessons.map((l) => {
                  const group = groupForLesson(l);
                  return (
                    <article
                      key={l.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">
                          {l.title}
                        </p>
                        {l.content &&
                          l.content.trim().toLowerCase() !==
                            l.title.trim().toLowerCase() && (
                            <p className="truncate text-xs text-slate-500">
                              {l.content}
                            </p>
                          )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
                          {group}
                        </span>
                        {l.fileUrl && (
                          <a
                            className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                            href={l.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open
                          </a>
                        )}
                        {l.quiz && (
                          <button
                            onClick={async () => {
                              const quiz = l.quiz;
                              if (!quiz) return;
                              try {
                                await api(`/quizzes/${quiz.id}/submit`, {
                                  method: "POST",
                                  headers,
                                  body: JSON.stringify({
                                    answers: quiz.questions.map((q: any) => ({
                                      questionId: q.id,
                                      selectedOption: "A",
                                    })),
                                  }),
                                });
                                await refreshCore();
                              } catch (e) {
                                setMessage((e as Error).message);
                              }
                            }}
                            className="rounded bg-slate-900 px-2 py-1 text-xs text-white"
                          >
                            Attempt Quiz
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
                {!s.lessons.length && (
                  <p className="px-4 py-3 text-sm text-slate-500">
                    No activities yet.
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      {activeCourseTab === "quizzes" && (
        <div className="space-y-3">
          {selectedCourse.sections.map((section) => (
            <section
              key={section.id}
              className="rounded-lg border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-sm font-semibold text-slate-900">
                  {section.name}
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {section.lessons.map((lesson) => {
                  const attemptsForLesson = attempts.filter(
                    (a) => a.quiz.lesson.title === lesson.title,
                  );
                  const myAttempt = attemptsForLesson[0];
                  const hasQuiz = Boolean(lesson.quiz);
                  const hasFileQuiz = Boolean(lesson.fileUrl);
                  const statusLabel = hasQuiz
                    ? user.role === "STUDENT" && myAttempt
                      ? "Completed"
                      : "Quiz Ready"
                    : hasFileQuiz
                      ? "File Quiz Available"
                      : user.role === "STUDENT"
                        ? "Quiz Not Available"
                        : "No Quiz Yet";

                  return (
                    <article
                      key={lesson.id}
                      className="flex items-start justify-between gap-3 px-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          Q {lesson.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          <span
                            className={`rounded px-2 py-0.5 ${
                              statusLabel === "Quiz Ready" ||
                              statusLabel === "Completed"
                                ? "bg-emerald-100 text-emerald-700"
                                : statusLabel === "File Quiz Available"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {statusLabel}
                          </span>
                          {hasQuiz && (
                            <span className="text-slate-500">
                              {lesson.quiz?.questions.length || 0} questions
                            </span>
                          )}
                          {user.role === "INSTRUCTOR" && hasQuiz && (
                            <span className="text-slate-500">
                              {attemptsForLesson.length} submissions
                            </span>
                          )}
                          {user.role === "STUDENT" && myAttempt && (
                            <span className="text-slate-500">
                              Score: {myAttempt.score}/{myAttempt.total}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                        {user.role === "INSTRUCTOR" ? (
                          <>
                            {hasQuiz ? (
                              <>
                                <button
                                  onClick={async () => {
                                    if (!lesson.quiz) return;
                                    const updatedPrompt = prompt(
                                      "Question prompt",
                                      lesson.quiz.questions[0]?.prompt ||
                                        "Sample?",
                                    );
                                    if (!updatedPrompt) return;
                                    await updateQuiz(lesson.quiz.id, [
                                      {
                                        prompt: updatedPrompt,
                                        optionA: "A",
                                        optionB: "B",
                                        optionC: "C",
                                        optionD: "D",
                                        correctOption: "A",
                                      },
                                    ]);
                                  }}
                                  className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                                >
                                  Edit Quiz
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!lesson.quiz) return;
                                    if (
                                      !confirm(
                                        `Delete quiz for "${lesson.title}"?`,
                                      )
                                    )
                                      return;
                                    await deleteQuiz(lesson.quiz.id);
                                  }}
                                  className="rounded border border-rose-200 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                                >
                                  Delete Quiz
                                </button>
                                <button
                                  onClick={() => setActiveCourseTab("scores")}
                                  className="rounded bg-slate-900 px-2 py-1 text-xs text-white"
                                >
                                  View Results
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={async () => {
                                    try {
                                      await api("/quizzes", {
                                        method: "POST",
                                        headers,
                                        body: JSON.stringify({
                                          lessonId: lesson.id,
                                          questions: [
                                            {
                                              prompt: "Sample?",
                                              optionA: "A",
                                              optionB: "B",
                                              optionC: "C",
                                              optionD: "D",
                                              correctOption: "A",
                                            },
                                          ],
                                        }),
                                      });
                                      await refreshCore();
                                    } catch (e) {
                                      setMessage((e as Error).message);
                                    }
                                  }}
                                  className="rounded bg-blue-700 px-2 py-1 text-xs text-white"
                                >
                                  Create Quiz
                                </button>
                                <button
                                  onClick={() =>
                                    setMessage(
                                      "Upload Quiz File: use Add Lesson and provide a file URL.",
                                    )
                                  }
                                  className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                                >
                                  Upload Quiz File
                                </button>
                              </>
                            )}
                            {hasFileQuiz && (
                              <a
                                className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                                href={lesson.fileUrl || "#"}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open File
                              </a>
                            )}
                          </>
                        ) : (
                          <>
                            {hasQuiz && (
                              <button
                                onClick={async () => {
                                  const quiz = lesson.quiz;
                                  if (!quiz) return;
                                  try {
                                    await api(`/quizzes/${quiz.id}/submit`, {
                                      method: "POST",
                                      headers,
                                      body: JSON.stringify({
                                        answers: quiz.questions.map(
                                          (q: any) => ({
                                            questionId: q.id,
                                            selectedOption: "A",
                                          }),
                                        ),
                                      }),
                                    });
                                    await refreshCore();
                                  } catch (e) {
                                    setMessage((e as Error).message);
                                  }
                                }}
                                className="rounded bg-slate-900 px-2 py-1 text-xs text-white"
                              >
                                {myAttempt ? "Retake Quiz" : "Start Quiz"}
                              </button>
                            )}
                            {hasFileQuiz && (
                              <>
                                <a
                                  className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                                  href={lesson.fileUrl || "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Open Quiz File
                                </a>
                                <button
                                  onClick={() =>
                                    setMessage(
                                      "Submit Answer is not available yet.",
                                    )
                                  }
                                  className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                                >
                                  Submit Answer
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
                {!section.lessons.length && (
                  <p className="px-3 py-4 text-center text-sm text-slate-500">
                    No lessons in this block yet.
                  </p>
                )}
              </div>
            </section>
          ))}
          {!selectedCourse.sections.some((s) => s.lessons.length) && (
            <p className="rounded-md border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-500">
              No quizzes available yet.
            </p>
          )}
        </div>
      )}

      {activeCourseTab === "scores" && (
        <div className="space-y-2">
          {attempts
            .filter((a) => a.quiz.lesson.course.id === selectedCourse.id)
            .map((a) => (
              <article
                key={a.id}
                className="rounded border border-slate-200 bg-slate-50 p-2 text-sm"
              >
                <p className="font-medium">{a.quiz.lesson.title}</p>
                <p className="text-blue-700">
                  Score: {a.score}/{a.total}
                </p>
                {a.student && <p>{a.student.fullName}</p>}
              </article>
            ))}
          {!attempts.some(
            (a) => a.quiz.lesson.course.id === selectedCourse.id,
          ) && (
            <p className="text-sm text-slate-500">
              No scores for this course yet.
            </p>
          )}
        </div>
      )}

      <CourseInfoModal
        open={showCourseInfo}
        selectedCourse={selectedCourse}
        uniqueStudents={uniqueStudents}
        user={user}
        showDangerTools={showDangerTools}
        setShowDangerTools={setShowDangerTools}
        kickSectionId={kickSectionId}
        setKickSectionId={setKickSectionId}
        setConfirmRemoveAllOpen={setConfirmRemoveAllOpen}
        setShowCourseInfo={setShowCourseInfo}
        setEditCourseOpen={setEditCourseOpen}
        archiveCourse={archiveCourse}
        deleteCourse={deleteCourse}
        leaveCourse={leaveCourse}
      />

      <EditCourseModal
        open={user.role === "INSTRUCTOR" && editCourseOpen}
        editCourseInput={editCourseInput}
        setEditCourseInput={setEditCourseInput}
        setEditCourseOpen={setEditCourseOpen}
        setShowCourseInfo={setShowCourseInfo}
        selectedCourse={selectedCourse}
        updateCourse={updateCourse}
      />

      <EditSectionModal
        open={user.role === "INSTRUCTOR" && Boolean(editingSection)}
        editingSection={editingSection}
        setEditingSection={setEditingSection}
        selectedCourse={selectedCourse}
        updateSection={updateSection}
      />

      <ConfirmRemoveAllModal
        open={user.role === "INSTRUCTOR" && confirmRemoveAllOpen}
        selectedCourse={selectedCourse}
        kickSectionId={kickSectionId}
        kickAllInSection={kickAllInSection}
        setConfirmRemoveAllOpen={setConfirmRemoveAllOpen}
      />

      <EnrollmentManagerModal
        open={user.role === "INSTRUCTOR" && showEnrollmentManager}
        selectedCourse={selectedCourse}
        enrollSectionId={enrollSectionId}
        setEnrollSectionId={setEnrollSectionId}
        setManualSection={setManualSection}
        setRosterPage={setRosterPage}
        showEnrollForm={showEnrollForm}
        setShowEnrollForm={setShowEnrollForm}
        manualEmail={manualEmail}
        setManualEmail={setManualEmail}
        manualAdd={manualAdd}
        rosterQuery={rosterQuery}
        setRosterQuery={setRosterQuery}
        filteredRosterRows={filteredRosterRows}
        pagedRosterRows={pagedRosterRows}
        safeRosterPage={safeRosterPage}
        rosterPageSize={rosterPageSize}
        rosterTotalPages={rosterTotalPages}
        kickStudent={kickStudent}
        setShowEnrollmentManager={setShowEnrollmentManager}
      />

      <EditLessonModal
        open={user.role === "INSTRUCTOR" && Boolean(editingLesson)}
        editingLesson={editingLesson}
        setEditingLesson={setEditingLesson}
        editLessonInput={editLessonInput}
        setEditLessonInput={setEditLessonInput}
        selectedCourse={selectedCourse}
        updateLesson={updateLesson}
      />

      <LessonComposerModal
        open={user.role === "INSTRUCTOR" && Boolean(composerSection)}
        composerSection={composerSection}
        selectedCourse={selectedCourse}
        lessonInput={lessonInput}
        setLessonInput={setLessonInput}
        resourceFile={resourceFile}
        setResourceFile={setResourceFile}
        saveResourceToLesson={saveResourceToLesson}
        isUploadingResource={isUploadingResource}
        setLessonComposerSectionId={setLessonComposerSectionId}
      />
    </article>
  );
}
