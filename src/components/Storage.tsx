import { useEffect, useState } from "react";
import type { DriveFile } from "../types/lms";

export function Storage({
  api,
  headers,
  setMessage,
}: {
  api: any;
  headers: any;
  setMessage: (m: string) => void;
}) {
  const [linked, setLinked] = useState(false);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [name, setName] = useState("notes.txt");
  const [content, setContent] = useState("My notes");

  async function load() {
    try {
      const s = await api("/storage/google/status", { headers });
      setLinked(s.linked);
      setFiles(s.linked ? await api("/storage/google/files", { headers }) : []);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="space-y-3">
      <article className="rounded-md border border-slate-200 p-3">
        {!linked && (
          <button
            onClick={async () => {
              try {
                const d = await api("/storage/google/connect-url", { headers });
                window.location.href = d.url;
              } catch (e) {
                setMessage((e as Error).message);
              }
            }}
            className="rounded bg-blue-700 px-3 py-2 text-white"
          >
            Link Google Account
          </button>
        )}
        {linked && (
          <div className="flex gap-2">
            <button
              onClick={async () => {
                await api("/storage/google/disconnect", {
                  method: "DELETE",
                  headers,
                });
                await load();
              }}
              className="rounded bg-slate-900 px-3 py-2 text-white"
            >
              Disconnect
            </button>
            <button
              onClick={load}
              className="rounded border border-slate-300 px-3 py-2"
            >
              Refresh
            </button>
          </div>
        )}
      </article>
      {linked && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api("/storage/google/upload", {
                method: "POST",
                headers,
                body: JSON.stringify({ name, content, mimeType: "text/plain" }),
              });
              await load();
            } catch (er) {
              setMessage((er as Error).message);
            }
          }}
          className="rounded-md border border-slate-200 p-3"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-2 w-full rounded border border-slate-300 p-2"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mb-2 w-full rounded border border-slate-300 p-2"
            rows={4}
          />
          <button className="rounded bg-slate-900 px-3 py-2 text-white">
            Upload
          </button>
        </form>
      )}
      <div className="space-y-2">
        {files.map((f) => (
          <article
            key={f.id || `${Math.random()}`}
            className="rounded border border-slate-200 bg-slate-50 p-2 text-sm"
          >
            <p className="font-medium">{f.name}</p>
            {f.webViewLink && (
              <a
                href={f.webViewLink}
                target="_blank"
                rel="noreferrer"
                className="text-blue-700 underline"
              >
                Open
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
