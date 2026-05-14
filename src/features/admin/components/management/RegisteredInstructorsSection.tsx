import { useMemo, useState } from "react";
import type { Instructor } from "./types";

export function RegisteredInstructorsSection(props: {
  instructors: Instructor[];
  onRefresh: () => void;
}) {
  const { instructors, onRefresh } = props;
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return instructors;
    return instructors.filter((instructor) => {
      const bag = `${instructor.fullName} ${instructor.email}`.toLowerCase();
      return bag.includes(q);
    });
  }, [instructors, query]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-800">
            Registered Instructors
          </p>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
            {filtered.length} shown
          </span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email..."
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 sm:w-64"
          />
          <button
            onClick={onRefresh}
            data-keep-action-text="true"
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <span className="material-symbols-outlined text-[1rem]">refresh</span>
            Refresh List
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">ID</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((instructor) => (
              <tr key={instructor.id} className="border-t border-slate-200">
                <td className="px-3 py-2 font-medium text-slate-800">
                  {instructor.fullName}
                </td>
                <td className="px-3 py-2 text-slate-700">{instructor.email}</td>
                <td className="px-3 py-2 text-slate-600">{instructor.id}</td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={3} className="px-3 py-3 text-center text-slate-500">
                  No instructors found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

