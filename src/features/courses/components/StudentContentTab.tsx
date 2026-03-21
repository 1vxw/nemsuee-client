import type { Course, Lesson, Section } from "../../../shared/types/lms";
import {
  matchesResourceScope,
  stripResourceScope,
  type ResourceScope,
} from "../utils/resourceScope";

type StudentContentTabProps = {
  selectedCourse: Course;
  groupForLesson: (lesson: Lesson) => string;
  api: any;
  headers: any;
  refreshCore: () => Promise<void>;
  setMessage: (m: string) => void;
  resourceScope: ResourceScope;
  academicYear?: string;
};

export function StudentContentTab({
  selectedCourse,
  groupForLesson,
  api,
  headers,
  refreshCore,
  setMessage,
  resourceScope,
  academicYear = "--",
}: StudentContentTabProps) {
  const getContentIcon = (lesson: Lesson) => {
    if (lesson.quiz) return "quiz";
    if (lesson.fileUrl) return "description";
    return "play_circle";
  };

  const lessonItems: { lesson: Lesson; section: Section }[] = [];
  for (const section of selectedCourse.sections) {
    for (const lesson of section.lessons) {
      if (matchesResourceScope(lesson.title || "", resourceScope)) {
        lessonItems.push({ lesson, section });
      }
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6 lg:col-span-2 lg:space-y-6">
      <div className="mb-3 flex items-center justify-between sm:mb-4">
        <h2 className="font-headline text-base font-bold text-primary sm:text-lg md:text-xl">Curriculum</h2>
        <span className="max-w-[7rem] truncate px-2 py-1 bg-tertiary-container text-tertiary-fixed text-[10px] font-bold uppercase tracking-widest rounded-full md:max-w-none" title={`Academic Year ${academicYear}`}>
          AY {academicYear}
        </span>
      </div>

      <div className="space-y-4 md:space-y-5 lg:space-y-5">
        {lessonItems.map(({ lesson, section }, index) => {
          const icon = getContentIcon(lesson);
          const group = groupForLesson(lesson);

          return (
            <article
              key={lesson.id}
              className="flex flex-col gap-3 rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-3 transition-all hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4 md:gap-4 md:p-5 lg:gap-5 lg:p-5"
            >
              <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4 md:gap-5">
                <span className="flex-shrink-0 font-headline text-base font-bold italic text-secondary sm:text-xl md:text-2xl">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-primary truncate sm:text-base">
                      {stripResourceScope(lesson.title || "")}
                    </h4>
                  </div>
                  <p className="text-xs text-on-surface-variant font-label mt-0.5 sm:mt-1 sm:text-sm">
                    {section.name}
                  </p>
                  {lesson.content && (
                    <p className="text-xs text-on-surface-variant mt-1.5 line-clamp-2 sm:text-sm sm:mt-2">
                      {lesson.content}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-start gap-2 flex-shrink-0 sm:items-end">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-label text-on-surface-variant">
                    {group}
                  </span>
                  {lesson.fileUrl && (
                    <a
                      className="flex-shrink-0 px-2.5 py-1 text-primary rounded text-xs font-bold hover:opacity-90 transition-opacity font-label border border-outline-variant/40 hover:bg-surface-container"
                      href={lesson.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      data-keep-action-text="true"
                    >
                      Open
                    </a>
                  )}
                </div>

                {lesson.quiz && (
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      const quiz = lesson.quiz;
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
                    className="px-3 py-1.5 bg-secondary-container text-on-secondary-container rounded text-xs font-bold hover:opacity-90 transition-opacity font-label flex items-center gap-1.5"
                    data-keep-action-text="true"
                  >
                    <span className="material-symbols-outlined text-[1rem]" style={lesson.quiz ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                      {icon}
                    </span>
                    Attempt
                  </button>
                )}
              </div>
            </article>
          );
        })}

        {lessonItems.length === 0 && (
          <p className="rounded-xl border border-dashed border-outline-variant/30 px-8 py-14 text-center text-sm text-on-surface-variant lg:py-10">
            No lessons in this course.
          </p>
        )}
      </div>
    </div>
  );
}

