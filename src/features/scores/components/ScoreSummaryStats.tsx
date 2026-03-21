type ScoreSummaryStatsProps = {
  totalSubmissions: number;
  passedCount: number;
  failedCount: number;
  averageScore: number;
};

export function ScoreSummaryStats({
  totalSubmissions,
  passedCount,
  failedCount,
  averageScore,
}: ScoreSummaryStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      <div className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-2.5 sm:px-4 sm:py-3">
        <p className="text-[11px] font-label font-bold uppercase tracking-wider text-on-surface-variant">
          Total Submissions
        </p>
        <p className="font-headline text-base font-bold text-primary sm:text-lg">{totalSubmissions}</p>
      </div>
      <div className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-2.5 sm:px-4 sm:py-3">
        <p className="text-[11px] font-label font-bold uppercase tracking-wider text-on-surface-variant">Passed</p>
        <p className="font-headline text-base font-bold text-emerald-700 sm:text-lg">{passedCount}</p>
      </div>
      <div className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-2.5 sm:px-4 sm:py-3">
        <p className="text-[11px] font-label font-bold uppercase tracking-wider text-on-surface-variant">Failed</p>
        <p className="font-headline text-base font-bold text-error sm:text-lg">{failedCount}</p>
      </div>
      <div className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-2.5 sm:px-4 sm:py-3">
        <p className="text-[11px] font-label font-bold uppercase tracking-wider text-on-surface-variant">Average Score</p>
        <p className="font-headline text-base font-bold text-primary sm:text-lg">{averageScore}%</p>
      </div>
    </div>
  );
}
