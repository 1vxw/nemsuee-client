export function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
      {text}
    </p>
  );
}
