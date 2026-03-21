import type { Course } from "../../../../shared/types/lms";

export function CourseConfigurationSection(props: {
  courses: Course[];
  selectedCourse: Course | null;
  selectedCourseId: number | null;
  courseFilter: string;
  onChangeCourseFilter: (value: string) => void;
  onSelectCourse: (courseId: number) => void;
  onEditCourse: () => void;
  onDeleteCourse: () => void;
}) {
  const {
    courses,
    selectedCourse,
    selectedCourseId,
    courseFilter,
    onChangeCourseFilter,
    onSelectCourse,
    onEditCourse,
    onDeleteCourse,
  } = props;
  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-[1fr_320px]">
        <input
          value={courseFilter}
          onChange={(e) => onChangeCourseFilter(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Search course"
        />
        <select
          value={selectedCourseId || ""}
          onChange={(e) => onSelectCourse(Number(e.target.value))}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>
      {selectedCourse ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-900">{selectedCourse.title}</p>
          <p className="mt-1 text-sm text-slate-600">
            {selectedCourse.description || "No description."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={onEditCourse}
              data-keep-action-text="true"
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs"
            >
              <span className="material-symbols-outlined text-[0.9rem]">edit</span>
              Edit Course
            </button>
            <button
              onClick={onDeleteCourse}
              data-keep-action-text="true"
              className="inline-flex items-center gap-1 rounded-md border border-rose-300 px-3 py-1.5 text-xs text-rose-700"
            >
              <span className="material-symbols-outlined text-[0.9rem]">delete</span>
              Delete Course
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Select a course.</p>
      )}
    </div>
  );
}

export function EditCourseModal(props: {
  open: boolean;
  title: string;
  description: string;
  onChangeTitle: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const {
    open,
    title,
    description,
    onChangeTitle,
    onChangeDescription,
    onClose,
    onSubmit,
  } = props;
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <article className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit Course</h3>
          <button
            onClick={onClose}
            data-keep-action-text="true"
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs"
          >
            <span className="material-symbols-outlined text-[0.9rem]">close</span>
            Close
          </button>
        </div>
        <div className="grid gap-2">
          <input
            value={title}
            onChange={(e) => onChangeTitle(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Course title"
          />
          <textarea
            value={description}
            onChange={(e) => onChangeDescription(e.target.value)}
            className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Course description"
          />
          <button
            onClick={onSubmit}
            data-keep-action-text="true"
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white"
          >
            <span className="material-symbols-outlined text-[1rem]">save</span>
            Save Course Changes
          </button>
        </div>
      </article>
    </div>
  );
}
