export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-md bg-gradient-to-r from-blue-700 to-blue-900 p-3 text-white">
      <p className="text-xs uppercase tracking-wide text-slate-200">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </article>
  );
}
