import type { Attempt } from "../../../shared/types/lms";
import { Empty } from "../../../app/layout/Ui";

export function Scores({ attempts }: { attempts: Attempt[] }) {
  return (
    <section className="space-y-2">
      {attempts.map((a) => (
        <article
          key={a.id}
          className="rounded-md border border-slate-200 p-3 text-sm"
        >
          <p className="font-semibold">
            {a.quiz.lesson.course.title} / {a.quiz.lesson.title}
          </p>
          <p className="text-blue-700">
            {a.score}/{a.total}
          </p>
          {a.student && <p>{a.student.fullName}</p>}
        </article>
      ))}
      {!attempts.length && <Empty text="No scores yet." />}
    </section>
  );
}
