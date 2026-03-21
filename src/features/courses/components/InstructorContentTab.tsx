import type { Course, Lesson } from "../../../shared/types/lms";
import {
  matchesResourceScope,
  stripResourceScope,
  type ResourceScope,
} from "../utils/resourceScope";

type InstructorContentTabProps = {
  selectedCourse: Course;
  collapsedBlocks: Record<number, boolean>;
  setCollapsedBlocks: (
    updater: (prev: Record<number, boolean>) => Record<number, boolean>,
  ) => void;
  groupForLesson: (lesson: Lesson) => string;
  setEditingLesson: (
    value: { sectionId: number; lesson: Lesson } | null,
  ) => void;
  setEditLessonInput: (value: {
    title: string;
    content: string;
    fileUrl: string;
  }) => void;
  lessonMenuOpenId: number | null;
  setLessonMenuOpenId: (
    updater: (prev: number | null) => number | null,
  ) => void;
  deleteLesson: (
    courseId: number,
    sectionId: number,
    lessonId: number,
  ) => Promise<void>;
  resourceScope: ResourceScope;
};

export function InstructorContentTab(props: InstructorContentTabProps) {
  const {
    selectedCourse,
    collapsedBlocks,
    setCollapsedBlocks,
    groupForLesson,
    setEditingLesson,
    setEditLessonInput,
    lessonMenuOpenId,
    setLessonMenuOpenId,
    deleteLesson,
    resourceScope,
  } = props;

  return (
    <div className="space-y-6 lg:space-y-5">
      {selectedCourse.sections.map((s) => (
        <section
          key={s.id}
          id={`section-${s.id}`}
          className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-outline-variant/20 bg-surface-container px-4 py-3 sm:px-5 sm:py-4">
            <button
              onClick={() =>
                setCollapsedBlocks((prev) => ({
                  ...prev,
                  [s.id]: !prev[s.id],
                }))
              }
              className="flex items-center gap-2 text-left"
            >
              <span className={`material-symbols-outlined text-[1rem] text-on-surface-variant transition-transform ${collapsedBlocks[s.id] ? "rotate-0" : "rotate-90"}`}>chevron_right</span>
              <p className="font-headline text-sm font-bold text-primary sm:text-base">{s.name}</p>
            </button>
            <div />
          </div>
          {!collapsedBlocks[s.id] && (
            <div className="space-y-4 p-5">
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
                  (l) =>
                    groupForLesson(l) === group &&
                    matchesResourceScope(l.title || "", resourceScope),
                );
                if (!items.length) return null;
                return (
                  <div key={group}>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-[11px] font-medium text-on-surface-variant">
                        {group}
                      </span>
                    </div>
                    <div className="divide-y divide-outline-variant/15 rounded-lg border border-outline-variant/20">
                      {items.map((l) => (
                        <article
                          key={l.id}
                          className="flex items-center justify-between gap-3 overflow-visible px-4 py-3 hover:bg-surface-container-low"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-on-surface">
                              {l.quiz ? "Quiz" : l.fileUrl ? "Resource" : "Lesson"}{" "}
                              {stripResourceScope(l.title || "")}
                            </p>
                            {l.content &&
                              l.content.trim().toLowerCase() !==
                                l.title.trim().toLowerCase() && (
                                <p className="truncate text-xs text-on-surface-variant">
                                  {l.content}
                                </p>
                              )}
                          </div>
                          <div className="relative flex shrink-0 items-center gap-1">
                            {l.fileUrl && (
                              <a
                                className="rounded border border-outline-variant/40 bg-surface-container-lowest px-2 py-1 text-xs text-on-surface hover:bg-surface-container"
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
                              className="rounded border border-outline-variant/40 bg-surface-container-lowest px-2 py-1 text-xs text-on-surface hover:bg-surface-container"
                              aria-label={`More actions for ${l.title}`}
                            >
                              <span className="material-symbols-outlined text-[1rem]" aria-hidden="true">
                                more_vert
                              </span>
                            </button>
                            {lessonMenuOpenId === l.id && (
                              <div className="absolute right-0 top-9 z-40 w-20 rounded-md border border-outline-variant/30 bg-surface-container-lowest p-1 shadow-lg">
                                <button
                                  onClick={() => {
                                    setEditingLesson({
                                      sectionId: s.id,
                                      lesson: l,
                                    });
                                    setEditLessonInput({
                                      title: stripResourceScope(l.title || ""),
                                      content: l.content || "",
                                      fileUrl: l.fileUrl || "",
                                    });
                                    setLessonMenuOpenId(() => null);
                                  }}
                                  className="mx-auto block w-full rounded p-1.5 text-xs text-on-surface hover:bg-surface-container"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!confirm(`Delete lesson "${l.title}"?`))
                                      return;
                                    await deleteLesson(
                                      selectedCourse.id,
                                      s.id,
                                      l.id,
                                    );
                                    setLessonMenuOpenId(() => null);
                                  }}
                                  className="mx-auto block w-full rounded p-1.5 text-xs text-error hover:bg-error-container"
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
                <div className="rounded-lg border border-dashed border-outline-variant/40 bg-surface-container-low px-6 py-8 text-center">
                  <p className="text-sm font-medium text-on-surface">
                    No lessons yet.
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Add your first lesson to this block.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

