import type { AcademicTerm } from "./types";

export function AcademicTermsSection(props: {
  terms: AcademicTerm[];
  onCreateTerm: () => void;
  onEditTerm: (term: AcademicTerm) => void;
  onActivateTerm: (termId: number) => void;
  onToggleArchiveTerm: (term: AcademicTerm) => void;
  onDeleteTerm: (term: AcademicTerm) => void;
}) {
  const {
    terms,
    onCreateTerm,
    onEditTerm,
    onActivateTerm,
    onToggleArchiveTerm,
    onDeleteTerm,
  } = props;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={onCreateTerm}
          data-keep-action-text="true"
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white"
        >
          <span className="material-symbols-outlined text-[1rem]">add_circle</span>
          Create Term
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-3 py-2 text-left">Academic Year</th>
              <th className="px-3 py-2 text-left">Term</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {terms.map((term) => {
              const status = Number(term.isActive)
                ? "Active"
                : Number(term.isArchived)
                  ? "Archived"
                  : "Inactive";
              return (
                <tr key={term.id} className="border-t border-slate-200">
                  <td className="px-3 py-2">{term.academicYear}</td>
                  <td className="px-3 py-2">{term.name}</td>
                  <td className="px-3 py-2">{status}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEditTerm(term)}
                        data-keep-action-text="true"
                        className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs"
                      >
                        <span className="material-symbols-outlined text-[0.9rem]">edit</span>
                        Edit Term
                      </button>
                      {!Number(term.isActive) && (
                        <button
                          onClick={() => onActivateTerm(term.id)}
                          data-keep-action-text="true"
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-300 px-2 py-1 text-xs text-emerald-700"
                        >
                          <span className="material-symbols-outlined text-[0.9rem]">bolt</span>
                          Activate Term
                        </button>
                      )}
                      <button
                        onClick={() => onToggleArchiveTerm(term)}
                        data-keep-action-text="true"
                        className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs"
                      >
                        <span className="material-symbols-outlined text-[0.9rem]">
                          {Number(term.isArchived) ? "unarchive" : "archive"}
                        </span>
                        {Number(term.isArchived) ? "Unarchive Term" : "Archive Term"}
                      </button>
                      {!Number(term.isActive) && (
                        <button
                          onClick={() => onDeleteTerm(term)}
                          data-keep-action-text="true"
                          className="inline-flex items-center gap-1 rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700"
                        >
                          <span className="material-symbols-outlined text-[0.9rem]">delete</span>
                          Delete Term
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!terms.length && (
              <tr>
                <td colSpan={4} className="px-3 py-3 text-center text-slate-500">
                  No academic terms found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
