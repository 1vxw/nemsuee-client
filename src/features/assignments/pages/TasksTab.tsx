import { useEffect, useMemo, useState } from "react";
import type { Course, CourseTask, User } from "../../../shared/types/lms";

type TasksTabProps = {
  kind: "ASSIGNMENT" | "ACTIVITY";
  selectedCourse: Course;
  user: User;
  api: any;
  headers: any;
  setMessage: (m: string) => void;
};

type SubmissionFilter =
  | "ALL"
  | "SUBMITTED"
  | "MISSING"
  | "LATE"
  | "UNGRADED"
  | "GRADED";

export function TasksTab({
  kind,
  selectedCourse,
  user,
  api,
  headers,
  setMessage,
}: TasksTabProps) {
  const [tasks, setTasks] = useState<CourseTask[]>([]);
  const [courseRoster, setCourseRoster] = useState<any[]>([]);
  const [submitState, setSubmitState] = useState<
    Record<number, { file: File | null }>
  >({});

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeSectionId, setComposeSectionId] = useState<number>(
    selectedCourse.sections[0]?.id || 0,
  );
  const [composeMode, setComposeMode] = useState<"MANUAL" | "FILE">("MANUAL");
  const [composeTitle, setComposeTitle] = useState("");
  const [composeDescription, setComposeDescription] = useState("");
  const [composeDueAt, setComposeDueAt] = useState("");
  const [composeFile, setComposeFile] = useState<File | null>(null);
  const [composeAllowResubmit, setComposeAllowResubmit] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState<number | null>(null);
  const [editMode, setEditMode] = useState<"MANUAL" | "FILE">("MANUAL");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueAt, setEditDueAt] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editFileUrl, setEditFileUrl] = useState("");
  const [editAllowResubmit, setEditAllowResubmit] = useState(true);

  const [viewTaskId, setViewTaskId] = useState<number | null>(null);
  const [submissionSearch, setSubmissionSearch] = useState("");
  const [submissionStatus, setSubmissionStatus] =
    useState<SubmissionFilter>("ALL");
  const [submissionSort, setSubmissionSort] = useState<"NEWEST" | "OLDEST">(
    "NEWEST",
  );
  const [openBlocks, setOpenBlocks] = useState<Record<string, boolean>>({});
  const [studentTaskTab, setStudentTaskTab] = useState<
    "OPEN" | "DONE" | "MISSING"
  >("OPEN");

  const isInstructor = user.role === "INSTRUCTOR";
  const rosterStudentId = (row: any) =>
    Number(row?.student?.id ?? row?.id ?? 0);
  const rosterStudentName = (row: any) =>
    String(
      row?.student?.fullName ||
        row?.fullName ||
        `${row?.student?.firstName || ""} ${row?.student?.lastName || ""}`,
    ).trim() || "Student";

  async function toBase64(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || "");
        resolve(dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl);
      };
      reader.onerror = () => reject(new Error("Failed to read selected file"));
      reader.readAsDataURL(file);
    });
  }

  async function loadTasks() {
    try {
      const rows = await api(
        `/tasks/course/${selectedCourse.id}?kind=${encodeURIComponent(kind)}`,
        { headers },
      );
      setTasks(rows || []);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function loadRoster() {
    try {
      const rows = await api(`/courses/${selectedCourse.id}/students`, {
        headers,
      });
      setCourseRoster(rows || []);
    } catch {
      setCourseRoster([]);
    }
  }

  useEffect(() => {
    loadTasks();
    loadRoster();
  }, [selectedCourse.id, kind]);

  useEffect(() => {
    setComposeSectionId(selectedCourse.sections[0]?.id || 0);
  }, [selectedCourse.id]);

  async function createTask() {
    try {
      if (!selectedCourse.sections.length)
        return setMessage("No block available. Please create a block first.");
      if (!composeSectionId) return setMessage("Please select a block.");
      if (!composeTitle.trim()) return setMessage("Title is required.");
      if (composeMode === "FILE" && !composeFile)
        return setMessage("Please choose a file to upload.");

      let fileUrl = "";
      if (composeFile) {
        const base64 = await toBase64(composeFile);
        const uploaded = await api("/storage/google/upload", {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: composeFile.name,
            contentBase64: base64,
            mimeType: composeFile.type || "application/octet-stream",
          }),
        });
        fileUrl = uploaded?.webViewLink || uploaded?.webContentLink || "";
      }

      await api(
        `/tasks/course/${selectedCourse.id}/sections/${composeSectionId}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            kind,
            mode: composeMode,
            title: composeTitle,
            description: composeDescription,
            fileUrl: fileUrl || undefined,
            dueAt: composeDueAt || undefined,
            allowStudentResubmit: composeAllowResubmit,
          }),
        },
      );

      setComposeOpen(false);
      setComposeTitle("");
      setComposeDescription("");
      setComposeDueAt("");
      setComposeFile(null);
      setComposeMode("MANUAL");
      setComposeAllowResubmit(true);
      await loadTasks();
      setMessage(
        `${kind === "ASSIGNMENT" ? "Assignment" : "Activity"} posted.`,
      );
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  function openEditTask(task: CourseTask) {
    setEditTaskId(task.id);
    setEditMode(task.mode);
    setEditTitle(task.title || "");
    setEditDescription(task.description || "");
    setEditDueAt(
      task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16) : "",
    );
    setEditFile(null);
    setEditFileUrl(task.fileUrl || "");
    setEditAllowResubmit(Number(task.allowStudentResubmit ?? 1) === 1);
    setEditOpen(true);
  }

  async function updateTask() {
    if (!editTaskId) return;
    if (!editTitle.trim()) return setMessage("Title is required.");
    if (editMode === "FILE" && !editFile && !editFileUrl)
      return setMessage("Please upload a file or keep the existing file.");

    try {
      let nextFileUrl = editFileUrl || "";
      if (editFile) {
        const base64 = await toBase64(editFile);
        const uploaded = await api("/storage/google/upload", {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: editFile.name,
            contentBase64: base64,
            mimeType: editFile.type || "application/octet-stream",
          }),
        });
        nextFileUrl = uploaded?.webViewLink || uploaded?.webContentLink || "";
      }

      await api(`/tasks/${editTaskId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription,
          dueAt: editDueAt || null,
          mode: editMode,
          fileUrl: editMode === "FILE" ? nextFileUrl || null : null,
          allowStudentResubmit: editAllowResubmit,
        }),
      });

      setEditOpen(false);
      setEditTaskId(null);
      await loadTasks();
      setMessage("Task updated.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function deleteTask(taskId: number, title: string) {
    if (!confirm(`Delete "${title}"? This will remove submissions.`)) return;
    try {
      await api(`/tasks/${taskId}`, { method: "DELETE", headers });
      await loadTasks();
      setMessage("Task deleted.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function submitTask(taskId: number) {
    const state = submitState[taskId] || { file: null };
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (task?.dueAt && new Date(task.dueAt).getTime() < Date.now())
        return setMessage("Submission closed. Deadline has passed.");

      let fileUrl = "";
      if (state.file) {
        const base64 = await toBase64(state.file);
        const uploaded = await api("/storage/google/upload", {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: state.file.name,
            contentBase64: base64,
            mimeType: state.file.type || "application/octet-stream",
          }),
        });
        fileUrl = uploaded?.webViewLink || uploaded?.webContentLink || "";
      }

      await api(`/tasks/${taskId}/submissions`, {
        method: "POST",
        headers,
        body: JSON.stringify({ fileUrl: fileUrl || undefined }),
      });
      await loadTasks();
      setMessage("Submission saved.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function deleteMySubmission(taskId: number) {
    try {
      await api(`/tasks/${taskId}/submissions/me`, {
        method: "DELETE",
        headers,
      });
      await loadTasks();
      setMessage("Submission deleted. You can submit again.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function gradeSubmission(
    submissionId: number,
    grade: number,
    feedback: string,
  ) {
    try {
      await api(`/tasks/submissions/${submissionId}/grade`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ grade, feedback }),
      });
      await loadTasks();
      setMessage("Grade saved.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  const groupedTasks = useMemo(
    () =>
      tasks.reduce(
        (acc, task) => {
          const key = task.sectionName || "Unassigned block";
          if (!acc[key]) acc[key] = [];
          acc[key].push(task);
          return acc;
        },
        {} as Record<string, CourseTask[]>,
      ),
    [tasks],
  );

  const summary = useMemo(() => {
    return tasks.reduce(
      (acc, task) => {
        const closed = Boolean(
          task.dueAt && new Date(task.dueAt).getTime() < Date.now(),
        );
        const subs = task.submissions || [];
        const blockStudents = courseRoster.filter((student) => {
          const studentBlock = String(
            student.section?.name || student.sectionName || "",
          ).toUpperCase();
          return studentBlock === String(task.sectionName || "").toUpperCase();
        });
        const latestByStudent = new Map<number, any>();
        for (const s of subs) {
          const sid = Number(s.studentId);
          const prev = latestByStudent.get(sid);
          if (
            !prev ||
            new Date(s.createdAt).getTime() > new Date(prev.createdAt).getTime()
          )
            latestByStudent.set(sid, s);
        }
        const ungraded = Array.from(latestByStudent.values()).filter(
          (s) => s.grade === null || s.grade === undefined,
        ).length;
        acc.total += 1;
        if (!closed) acc.active += 1;
        acc.pending += closed
          ? Math.max(0, blockStudents.length - latestByStudent.size)
          : 0;
        acc.ungraded += ungraded;
        return acc;
      },
      { total: 0, active: 0, pending: 0, ungraded: 0 },
    );
  }, [tasks, courseRoster]);

  const viewedTask = tasks.find((t) => t.id === viewTaskId) || null;
  const studentFilteredTasks = useMemo(() => {
    if (isInstructor) return tasks;
    return tasks.filter((task) => {
      const hasSubmission = Boolean(task.mySubmission);
      const isMissing = Boolean(
        !hasSubmission &&
        task.dueAt &&
        new Date(task.dueAt).getTime() < Date.now(),
      );
      if (studentTaskTab === "OPEN") return !hasSubmission && !isMissing;
      if (studentTaskTab === "DONE") return hasSubmission;
      return isMissing;
    });
  }, [tasks, isInstructor, studentTaskTab]);
  const studentGroupedTasks = useMemo(
    () =>
      studentFilteredTasks.reduce(
        (acc, task) => {
          const key = task.sectionName || "Unassigned block";
          if (!acc[key]) acc[key] = [];
          acc[key].push(task);
          return acc;
        },
        {} as Record<string, CourseTask[]>,
      ),
    [studentFilteredTasks],
  );
  const viewedRows = useMemo(() => {
    if (!viewedTask) return [] as any[];
    const blockStudents = courseRoster.filter((student) => {
      const studentBlock = String(
        student.section?.name || student.sectionName || "",
      ).toUpperCase();
      return (
        studentBlock === String(viewedTask.sectionName || "").toUpperCase()
      );
    });

    return blockStudents
      .map((student) => {
        const latest = (viewedTask.submissions || [])
          .filter((s) => Number(s.studentId) === rosterStudentId(student))
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )[0];
        const isLate = Boolean(
          latest &&
          viewedTask.dueAt &&
          new Date(latest.createdAt).getTime() >
            new Date(viewedTask.dueAt).getTime(),
        );
        const isClosed = Boolean(
          viewedTask.dueAt && new Date(viewedTask.dueAt).getTime() < Date.now(),
        );
        const status = latest
          ? latest.grade !== null && latest.grade !== undefined
            ? "GRADED"
            : "SUBMITTED"
          : isClosed
            ? "MISSING"
            : "NOT_SUBMITTED";
        return { student, latest, status, isLate };
      })
      .filter((row) => {
        const q = submissionSearch.trim().toLowerCase();
        const name = rosterStudentName(row.student).toLowerCase();
        const searchMatch = !q || name.includes(q);
        if (!searchMatch) return false;
        if (submissionStatus === "ALL") return true;
        if (submissionStatus === "SUBMITTED") return row.status === "SUBMITTED";
        if (submissionStatus === "MISSING") return row.status === "MISSING";
        if (submissionStatus === "LATE") return row.isLate;
        if (submissionStatus === "UNGRADED") return row.status === "SUBMITTED";
        if (submissionStatus === "GRADED") return row.status === "GRADED";
        return true;
      })
      .sort((a, b) => {
        const at = a.latest ? new Date(a.latest.createdAt).getTime() : 0;
        const bt = b.latest ? new Date(b.latest.createdAt).getTime() : 0;
        return submissionSort === "NEWEST" ? bt - at : at - bt;
      });
  }, [
    viewedTask,
    courseRoster,
    submissionSearch,
    submissionStatus,
    submissionSort,
  ]);

  function exportCsv() {
    if (!viewedTask) return;
    const rows = [
      "Student,Status,Submitted,Grade,Late",
      ...viewedRows.map((row) =>
        [
          `"${String(rosterStudentName(row.student))}"`,
          row.status,
          row.latest ? new Date(row.latest.createdAt).toLocaleString() : "",
          row.latest?.grade ?? "",
          row.isLate ? "Yes" : "No",
        ].join(","),
      ),
    ];
    const blob = new Blob([rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${viewedTask.title.replace(/\s+/g, "_")}_submissions.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="min-w-0 space-y-4 md:space-y-6">
      {isInstructor && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-2.5 shadow-sm sm:p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="material-symbols-outlined text-secondary text-[1rem] sm:text-[1.125rem]">assignment</span>
                <p className="text-xs font-label text-on-surface-variant uppercase tracking-wide">Total</p>
              </div>
              <p className="font-headline text-xl font-bold text-primary sm:text-2xl">{summary.total}</p>
            </div>
            <div className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-2.5 shadow-sm sm:p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="material-symbols-outlined text-emerald-600 text-[1rem] sm:text-[1.125rem]">check_circle</span>
                <p className="text-xs font-label text-on-surface-variant uppercase tracking-wide">Active</p>
              </div>
              <p className="font-headline text-xl font-bold text-primary sm:text-2xl">{summary.active}</p>
            </div>
            <div className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-2.5 shadow-sm sm:p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="material-symbols-outlined text-amber-600 text-[1rem] sm:text-[1.125rem]">schedule</span>
                <p className="text-xs font-label text-on-surface-variant uppercase tracking-wide">Pending</p>
              </div>
              <p className="font-headline text-xl font-bold text-primary sm:text-2xl">{summary.pending}</p>
            </div>
            <div className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-2.5 shadow-sm sm:p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="material-symbols-outlined text-primary text-[1rem] sm:text-[1.125rem]">grade</span>
                <p className="text-xs font-label text-on-surface-variant uppercase tracking-wide">Ungraded</p>
              </div>
              <p className="font-headline text-xl font-bold text-primary sm:text-2xl">{summary.ungraded}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              disabled={!selectedCourse.sections.length}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 font-label text-xs font-bold text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
              onClick={() => setComposeOpen(true)}
            >
              <span className="material-symbols-outlined text-[1rem]">add</span>
              New {kind === "ASSIGNMENT" ? "Assignment" : "Activity"}
            </button>
          </div>
        </>
      )}

      {isInstructor &&
        Object.entries(groupedTasks).map(([blockName, blockTasks]) => {
          const blockOpen = openBlocks[blockName] ?? true;
          return (
            <section key={blockName} className="space-y-2">
              <button
                className="flex w-full items-center justify-between rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2.5 text-xs font-label font-bold text-primary hover:bg-surface-container-high transition-colors sm:px-4 sm:py-3 sm:text-sm"
                onClick={() =>
                  setOpenBlocks((prev) => ({
                    ...prev,
                    [blockName]: !blockOpen,
                  }))
                }
              >
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[1rem] sm:text-[1.125rem]">{blockOpen ? "expand_less" : "expand_more"}</span>
                  <span>{blockName}</span>
                </div>
                <span className="rounded-full bg-secondary-container px-2.5 py-0.5 text-xs font-bold text-on-secondary-container">{blockTasks.length}</span>
              </button>
              {blockOpen && (
                <div className="overflow-x-auto rounded-lg border border-outline-variant/20 bg-surface-container-lowest">
                  {/* Mobile: cards */}
                  <div className="divide-y divide-outline-variant/20 sm:hidden">
                    {blockTasks.map((task) => {
                      const blockStudents = courseRoster.filter((student) => {
                        const studentBlock = String(
                          student.section?.name || student.sectionName || "",
                        ).toUpperCase();
                        return (
                          studentBlock ===
                          String(task.sectionName || "").toUpperCase()
                        );
                      });
                      const latestByStudent = new Map<number, any>();
                      for (const s of task.submissions || []) {
                        const sid = Number(s.studentId);
                        const prev = latestByStudent.get(sid);
                        if (
                          !prev ||
                          new Date(s.createdAt).getTime() >
                            new Date(prev.createdAt).getTime()
                        )
                          latestByStudent.set(sid, s);
                      }
                      const submitted = latestByStudent.size;
                      const isClosed = Boolean(
                        task.dueAt &&
                        new Date(task.dueAt).getTime() < Date.now(),
                      );
                      return (
                        <div
                          key={task.id}
                          className="flex flex-col gap-2 p-3"
                        >
                          <p className="font-label text-sm font-bold text-primary">
                            {task.title}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {task.mode === "MANUAL" ? "Manual" : "File Upload"}
                            {task.dueAt
                              ? ` · Due ${new Date(task.dueAt).toLocaleString()}`
                              : ""}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {submitted} / {blockStudents.length} submissions
                          </p>
                          <span
                            className={`self-start rounded-full px-2 py-0.5 text-[10px] font-bold ${isClosed ? "bg-surface-container-high text-on-surface-variant" : "bg-emerald-100 text-emerald-700"}`}
                          >
                            {isClosed ? "Closed" : "Active"}
                          </span>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <button
                              className="rounded-lg border border-outline-variant/40 px-2.5 py-1.5 text-[11px] font-label hover:bg-surface-container"
                              onClick={() => setViewTaskId(task.id)}
                            >
                              View
                            </button>
                            <button
                              className="rounded-lg border border-outline-variant/40 px-2.5 py-1.5 text-[11px] font-label hover:bg-surface-container"
                              onClick={() => openEditTask(task)}
                            >
                              Edit
                            </button>
                            <button
                              className="rounded-lg border border-error-container px-2.5 py-1.5 text-[11px] font-label font-bold text-error hover:bg-error-container/30"
                              onClick={() => deleteTask(task.id, task.title)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <table className="hidden min-w-full text-left text-sm font-body sm:table">
                    <thead className="bg-surface-container text-on-surface-variant font-label">
                      <tr>
                        <th className="px-4 py-3 font-medium">Assignment</th>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium">Due Date</th>
                        <th className="px-4 py-3 font-medium">Submissions</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blockTasks.map((task) => {
                        const blockStudents = courseRoster.filter((student) => {
                          const studentBlock = String(
                            student.section?.name || student.sectionName || "",
                          ).toUpperCase();
                          return (
                            studentBlock ===
                            String(task.sectionName || "").toUpperCase()
                          );
                        });
                        const latestByStudent = new Map<number, any>();
                        for (const s of task.submissions || []) {
                          const sid = Number(s.studentId);
                          const prev = latestByStudent.get(sid);
                          if (
                            !prev ||
                            new Date(s.createdAt).getTime() >
                              new Date(prev.createdAt).getTime()
                          )
                            latestByStudent.set(sid, s);
                        }
                        const submitted = latestByStudent.size;
                        const isClosed = Boolean(
                          task.dueAt &&
                          new Date(task.dueAt).getTime() < Date.now(),
                        );
                        return (
                          <tr
                            key={task.id}
                            className="border-t border-outline-variant/20"
                          >
                            <td className="px-4 py-3 font-label font-medium text-primary">
                              {task.title}
                            </td>
                            <td className="px-4 py-3 text-on-surface-variant">
                              {task.mode === "MANUAL"
                                ? "Manual"
                                : "File Upload"}
                            </td>
                            <td className="px-4 py-3 text-on-surface-variant">
                              {task.dueAt
                                ? new Date(task.dueAt).toLocaleString()
                                : "-"}
                            </td>
                            <td className="px-4 py-3 text-on-surface-variant">
                              {submitted} / {blockStudents.length}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${isClosed ? "bg-surface-container-high text-on-surface-variant" : "bg-emerald-100 text-emerald-700"}`}
                              >
                                {isClosed ? "Closed" : "Active"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  className="rounded-lg border border-outline-variant/40 px-3 py-1.5 text-xs font-label hover:bg-surface-container transition-colors"
                                  onClick={() => setViewTaskId(task.id)}
                                >
                                  View Submissions
                                </button>
                                <button
                                  className="rounded-lg border border-outline-variant/40 px-3 py-1.5 text-xs font-label hover:bg-surface-container transition-colors"
                                  onClick={() => openEditTask(task)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="rounded-lg border border-error-container px-3 py-1.5 text-xs font-label font-bold text-error hover:bg-error-container/30 transition-colors"
                                  onClick={() =>
                                    deleteTask(task.id, task.title)
                                  }
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}

      {!isInstructor && (
        <div className="flex flex-wrap gap-1.5">
          <button
            className={`rounded-lg px-3 py-1.5 text-xs font-label font-bold transition-colors sm:px-4 sm:py-2 sm:text-sm ${studentTaskTab === "OPEN" ? "bg-primary text-on-primary" : "border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container"}`}
            onClick={() => setStudentTaskTab("OPEN")}
          >
            Open
          </button>
          <button
            className={`rounded-lg px-3 py-1.5 text-xs font-label font-bold transition-colors sm:px-4 sm:py-2 sm:text-sm ${studentTaskTab === "DONE" ? "bg-primary text-on-primary" : "border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container"}`}
            onClick={() => setStudentTaskTab("DONE")}
          >
            Done
          </button>
          <button
            className={`rounded-lg px-3 py-1.5 text-xs font-label font-bold transition-colors sm:px-4 sm:py-2 sm:text-sm ${studentTaskTab === "MISSING" ? "bg-primary text-on-primary" : "border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container"}`}
            onClick={() => setStudentTaskTab("MISSING")}
          >
            Missing
          </button>
        </div>
      )}

      {!isInstructor &&
        Object.entries(studentGroupedTasks).map(([blockName, blockTasks]) => (
          <section key={blockName} className="space-y-3">
            <div className="flex items-center gap-1.5 rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2.5 sm:px-4 sm:py-3">
              <span className="material-symbols-outlined text-secondary text-[1rem] sm:text-[1.125rem]">folder</span>
              <h4 className="font-headline text-sm font-bold text-primary sm:text-base">
                {blockName}
              </h4>
            </div>
            {blockTasks.map((task) => {
              const isClosedByDeadline = Boolean(
                task.dueAt && new Date(task.dueAt).getTime() < Date.now(),
              );
              const allowResubmit =
                Number(task.allowStudentResubmit ?? 1) === 1;
              const isGraded = Boolean(
                task.mySubmission &&
                  task.mySubmission.grade !== null &&
                  task.mySubmission.grade !== undefined,
              );
              const canSubmit =
                !isClosedByDeadline &&
                !isGraded &&
                (!task.mySubmission || allowResubmit);
              return (
                <article
                  key={task.id}
                  className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-3 shadow-sm sm:p-4"
                >
                  <p className="font-headline text-sm font-bold text-primary sm:text-base">
                    {task.title}
                  </p>
                  <p className="text-xs text-on-surface-variant font-label mt-1">
                    {task.mode === "MANUAL" ? "Manual" : "File Upload"}
                    {task.dueAt
                      ? ` · Due ${new Date(task.dueAt).toLocaleString()}`
                      : ""}
                    {isClosedByDeadline ? " · Closed" : ""}
                  </p>
                  {!allowResubmit && (
                    <p className="mt-2 text-xs font-label text-amber-700 rounded-lg bg-amber-50 px-3 py-2">
                      Resubmission disabled by instructor.
                    </p>
                  )}
                  {isGraded && (
                    <p className="mt-2 text-sm font-label font-bold text-emerald-700 rounded-lg bg-emerald-50 px-3 py-2 inline-block">
                      Graded: {Number(task.mySubmission?.grade || 0).toFixed(2)}
                    </p>
                  )}
                  {task.description && (
                    <p className="mt-3 text-sm text-on-surface font-body">
                      {task.description}
                    </p>
                  )}
                  {task.fileUrl && (
                    <a
                      className="mt-3 inline-flex items-center gap-2 rounded-lg border border-outline-variant/40 px-3 py-2 text-xs font-label hover:bg-surface-container transition-colors"
                      href={task.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="material-symbols-outlined text-[1rem]">open_in_new</span>
                      Open Attached File
                    </a>
                  )}
                  <div className="mt-4 rounded-xl border border-outline-variant/20 bg-surface-container p-4">
                    {isClosedByDeadline && !task.mySubmission && (
                      <p className="mb-3 text-sm font-label font-bold text-error rounded-lg bg-error-container/50 px-3 py-2">
                        Submission closed due to deadline. Marked as missing.
                      </p>
                    )}
                    <p className="text-sm font-label font-medium text-on-surface-variant">
                      Upload file
                    </p>
                    <input
                      type="file"
                      disabled={!canSubmit}
                      className="mt-2 block text-sm font-body disabled:opacity-60 rounded-lg border border-outline-variant/40 p-2"
                      onChange={(e) =>
                        setSubmitState((prev) => ({
                          ...prev,
                          [task.id]: { file: e.target.files?.[0] || null },
                        }))
                      }
                    />
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        data-keep-action-text="true"
                        disabled={!canSubmit}
                        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-label text-sm font-bold text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => submitTask(task.id)}
                      >
                        <span className="material-symbols-outlined text-[1rem]">upload</span>
                        Submit
                      </button>
                      {task.mySubmission &&
                        allowResubmit &&
                        !isGraded &&
                        !isClosedByDeadline && (
                          <button
                            data-keep-action-text="true"
                            className="flex items-center gap-2 rounded-lg border border-error-container px-4 py-2 font-label text-sm font-bold text-error hover:bg-error-container/30 transition-colors"
                            onClick={() => deleteMySubmission(task.id)}
                          >
                            <span className="material-symbols-outlined text-[1rem]">delete</span>
                            Delete submission
                          </button>
                        )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ))}

      {((isInstructor && !tasks.length) ||
        (!isInstructor && !studentFilteredTasks.length)) && (
        <div className="rounded-xl border border-dashed border-outline-variant/30 px-8 py-12 text-center">
          <span className="material-symbols-outlined text-4xl text-outline-variant/30 mb-3 block">
            {kind === "ASSIGNMENT" ? "assignment" : "sports_soccer"}
          </span>
          <p className="font-headline text-lg font-bold text-primary mb-1">
            {isInstructor
              ? `No ${kind === "ASSIGNMENT" ? "assignments" : "activities"} yet`
              : studentTaskTab === "OPEN"
                ? "No open tasks"
                : studentTaskTab === "DONE"
                  ? "No completed tasks"
                  : "No missing tasks"}
          </p>
          <p className="text-sm text-on-surface-variant">
            {isInstructor ? "Create one to get started." : "Check back later for new tasks."}
          </p>
        </div>
      )}

      {isInstructor && viewedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-5xl rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-xl md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-headline text-lg font-bold text-primary">
                  {viewedTask.title}
                </p>
                <p className="text-sm text-on-surface-variant mt-1">
                  {viewedTask.sectionName} ·{" "}
                  {viewedTask.dueAt
                    ? `Due ${new Date(viewedTask.dueAt).toLocaleString()}`
                    : "No due date"}
                </p>
              </div>
              <button
                className="rounded-lg border border-outline-variant/40 px-3 py-2 text-sm font-label hover:bg-surface-container transition-colors"
                onClick={() => setViewTaskId(null)}
              >
                Close
              </button>
            </div>
            <div className="mb-4 grid gap-3 md:grid-cols-4">
              <input
                value={submissionSearch}
                onChange={(e) => setSubmissionSearch(e.target.value)}
                className="rounded-lg border border-outline-variant/40 px-4 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary outline-none"
                placeholder="Search student"
              />
              <select
                value={submissionStatus}
                onChange={(e) =>
                  setSubmissionStatus(e.target.value as SubmissionFilter)
                }
                className="rounded-lg border border-outline-variant/40 px-4 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="ALL">All statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="MISSING">Missing</option>
                <option value="LATE">Late</option>
                <option value="UNGRADED">Ungraded</option>
                <option value="GRADED">Graded</option>
              </select>
              <select
                value={submissionSort}
                onChange={(e) =>
                  setSubmissionSort(e.target.value as "NEWEST" | "OLDEST")
                }
                className="rounded-lg border border-outline-variant/40 px-4 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="NEWEST">Newest</option>
                <option value="OLDEST">Oldest</option>
              </select>
              <button
                className="flex items-center gap-2 rounded-lg border border-outline-variant/40 px-4 py-2.5 text-sm font-label hover:bg-surface-container transition-colors"
                onClick={exportCsv}
              >
                <span className="material-symbols-outlined text-[1rem]">download</span>
                Export CSV
              </button>
            </div>
            <div className="max-h-[55vh] overflow-auto rounded-xl border border-outline-variant/20">
              <table className="min-w-full text-left text-sm font-body">
                <thead className="sticky top-0 bg-surface-container text-on-surface-variant font-label">
                  <tr>
                    <th className="px-4 py-3 font-medium">Student</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Submitted</th>
                    <th className="px-4 py-3 font-medium">Grade</th>
                    <th className="px-4 py-3 font-medium">File</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {viewedRows.map((row) => (
                    <tr
                      key={row.student.id}
                      className="border-t border-outline-variant/20"
                    >
                      <td className="px-4 py-3 font-medium text-primary">
                        {rosterStudentName(row.student)}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        {row.status === "NOT_SUBMITTED"
                          ? "Not submitted"
                          : row.status}
                        {row.isLate ? " · Late" : ""}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        {row.latest
                          ? new Date(row.latest.createdAt).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-4 py-3 font-medium text-on-surface">
                        {row.latest?.grade ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        {row.latest?.fileUrl ? (
                          <a
                            className="text-primary font-label font-bold hover:underline"
                            href={row.latest.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.latest ? (
                          <button
                            className="rounded-lg border border-outline-variant/40 px-3 py-1.5 text-xs font-label hover:bg-surface-container transition-colors"
                            onClick={() => {
                              const gradeText = prompt(
                                "Enter grade",
                                String(row.latest?.grade ?? ""),
                              );
                              if (gradeText === null) return;
                              const feedback =
                                prompt(
                                  "Feedback (optional)",
                                  String(row.latest?.feedback ?? ""),
                                ) || "";
                              const parsed = Number(gradeText);
                              if (Number.isNaN(parsed))
                                return setMessage("Invalid grade");
                              gradeSubmission(row.latest.id, parsed, feedback);
                            }}
                          >
                            Grade
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-xl md:p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-lg">add_circle</span>
              <p className="font-headline text-lg font-bold text-primary">
                New {kind === "ASSIGNMENT" ? "Assignment" : "Activity"}
              </p>
            </div>
            <div className="grid gap-3">
              <select
                value={composeSectionId}
                onChange={(e) => setComposeSectionId(Number(e.target.value))}
                className="rounded-lg border border-outline-variant/40 px-4 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary outline-none"
              >
                {selectedCourse.sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                value={composeMode}
                onChange={(e) =>
                  setComposeMode(e.target.value as "MANUAL" | "FILE")
                }
                className="rounded-lg border border-outline-variant/40 px-4 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="MANUAL">Manual</option>
                <option value="FILE">File Upload</option>
              </select>
              <input
                value={composeTitle}
                onChange={(e) => setComposeTitle(e.target.value)}
                className="rounded-lg border border-outline-variant/40 px-4 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary outline-none"
                placeholder="Title"
              />
              <textarea
                value={composeDescription}
                onChange={(e) => setComposeDescription(e.target.value)}
                className="rounded-lg border border-outline-variant/40 px-4 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary outline-none"
                rows={3}
                placeholder="Instructions"
              />
              <input
                type="datetime-local"
                value={composeDueAt}
                onChange={(e) => setComposeDueAt(e.target.value)}
                className="rounded-lg border border-outline-variant/40 px-4 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary outline-none"
              />
              <label className="flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={composeAllowResubmit}
                  onChange={(e) => setComposeAllowResubmit(e.target.checked)}
                />
                Allow students to edit/resubmit
              </label>
              {composeMode === "FILE" && (
                <input
                  type="file"
                  onChange={(e) => setComposeFile(e.target.files?.[0] || null)}
                  className="text-sm"
                />
              )}
            </div>
            <div className="mt-4 flex gap-3">
              <button
                className="rounded-lg bg-primary px-4 py-2.5 font-label text-sm font-bold text-on-primary hover:opacity-90 transition-opacity"
                onClick={createTask}
              >
                Create
              </button>
              <button
                className="rounded-lg border border-outline-variant/40 px-4 py-2.5 font-label text-sm hover:bg-surface-container transition-colors"
                onClick={() => setComposeOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-xl md:p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-lg">edit</span>
              <p className="font-headline text-lg font-bold text-primary">
                Edit {kind === "ASSIGNMENT" ? "Assignment" : "Activity"}
              </p>
            </div>
            <div className="grid gap-3">
              <select
                value={editMode}
                onChange={(e) =>
                  setEditMode(e.target.value as "MANUAL" | "FILE")
                }
                className="rounded-lg border border-outline-variant/40 px-4 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="MANUAL">Manual</option>
                <option value="FILE">File Upload</option>
              </select>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="rounded-lg border border-outline-variant/40 px-4 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary outline-none"
                placeholder="Title"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="rounded-lg border border-outline-variant/40 px-4 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary outline-none"
                rows={3}
                placeholder="Instructions"
              />
              <input
                type="datetime-local"
                value={editDueAt}
                onChange={(e) => setEditDueAt(e.target.value)}
                className="rounded-lg border border-outline-variant/40 px-4 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary outline-none"
              />
              <label className="flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={editAllowResubmit}
                  onChange={(e) => setEditAllowResubmit(e.target.checked)}
                />
                Allow students to edit/resubmit
              </label>
              {editMode === "FILE" && (
                <div className="space-y-1">
                  {editFileUrl && (
                    <p className="text-xs text-slate-500">
                      Current file attached
                    </p>
                  )}
                  <input
                    type="file"
                    onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                    className="text-sm"
                  />
                  {editFileUrl && (
                    <button
                      className="rounded border border-slate-300 px-2 py-1 text-xs"
                      onClick={() => setEditFileUrl("")}
                    >
                      Remove current file
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-3">
              <button
                className="rounded-lg bg-primary px-4 py-2.5 font-label text-sm font-bold text-on-primary hover:opacity-90 transition-opacity"
                onClick={updateTask}
              >
                Save
              </button>
              <button
                className="rounded-lg border border-outline-variant/40 px-4 py-2.5 font-label text-sm hover:bg-surface-container transition-colors"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
