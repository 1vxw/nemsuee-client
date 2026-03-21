import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { DriveFile, Role } from "../../../shared/types/lms";

type SortMode = "NEWEST" | "OLDEST" | "NAME_ASC" | "NAME_DESC" | "SIZE_DESC";
type FolderOption = { id: string; name: string };

function toUserMessage(error: unknown) {
  const msg = (error as Error)?.message || "Request failed";
  if (msg.includes("Google Drive not linked")) {
    return "Google Drive is not linked yet. Click 'Link Google Account' first.";
  }
  if (msg.includes("Service account uploads require")) {
    return "Upload is disabled in service-account mode. Switch to OAuth user linking.";
  }
  if (msg.includes("Uploaded file is too large")) {
    return "File is too large. Please upload a smaller file.";
  }
  if (msg.includes("Forbidden")) {
    return "You do not have permission for this action.";
  }
  return msg;
}

function getExtension(name: string) {
  const idx = name.lastIndexOf(".");
  if (idx < 0) return "";
  return name.slice(idx + 1).toLowerCase();
}

function getFileTypeLabel(file: DriveFile) {
  const ext = getExtension(String(file.name || ""));
  const mime = String(file.mimeType || "");
  if (mime === "application/vnd.google-apps.folder") return "Folder";
  if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "Image";
  if (mime === "application/pdf" || ext === "pdf") return "PDF";
  if (mime.startsWith("video/") || ["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "Video";
  if (["xls", "xlsx", "csv"].includes(ext)) return "Spreadsheet";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "Archive";
  if (["doc", "docx", "txt", "rtf", "odt", "ppt", "pptx"].includes(ext)) return "Document";
  return "File";
}

function supportsPreview(file: DriveFile) {
  const ext = getExtension(String(file.name || ""));
  const mime = String(file.mimeType || "");
  if (mime.startsWith("image/")) return true;
  if (mime === "application/pdf") return true;
  if (mime.startsWith("video/")) return true;
  return ["png", "jpg", "jpeg", "gif", "webp", "pdf", "mp4", "webm", "mov"].includes(ext);
}

function toBytes(size: string | null | undefined) {
  const n = Number(size || 0);
  return Number.isFinite(n) ? n : 0;
}

function formatSize(size: string | null | undefined) {
  const bytes = toBytes(size);
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function FileTypeIcon({ type }: { type: string }) {
  const base = "h-4 w-4";
  if (type === "Image") {
    return (
      <svg viewBox="0 0 24 24" className={base} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="1.5" />
        <path d="M21 16l-5-5-7 7" />
      </svg>
    );
  }
  if (type === "PDF" || type === "Document") {
    return (
      <svg viewBox="0 0 24 24" className={base} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 3h7l5 5v13H7z" />
        <path d="M14 3v5h5" />
      </svg>
    );
  }
  if (type === "Spreadsheet") {
    return (
      <svg viewBox="0 0 24 24" className={base} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 7h8M8 11h8M8 15h8M12 7v10" />
      </svg>
    );
  }
  if (type === "Video") {
    return (
      <svg viewBox="0 0 24 24" className={base} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="5" width="14" height="14" rx="2" />
        <path d="M17 10l4-2v8l-4-2z" />
      </svg>
    );
  }
  if (type === "Archive") {
    return (
      <svg viewBox="0 0 24 24" className={base} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="5" y="4" width="14" height="16" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={base} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}

export function Storage({
  api,
  headers,
  setMessage,
  userRole,
}: {
  api: any;
  headers: any;
  setMessage: (m: string) => void;
  userRole: Role;
}) {
  const [linked, setLinked] = useState(false);
  const [mode, setMode] = useState<"oauth" | "service_account" | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("NEWEST");
  const [page, setPage] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "note">("file");
  const [name, setName] = useState("notes.txt");
  const [content, setContent] = useState("My notes");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);
  const [showDisconnectWarning, setShowDisconnectWarning] = useState(false);
  const [confirmDisconnectText, setConfirmDisconnectText] = useState("");
  const [folders, setFolders] = useState<FolderOption[]>([]);
  const [rootFolderId, setRootFolderId] = useState<string | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveTargetFile, setMoveTargetFile] = useState<DriveFile | null>(null);
  const [moveFolderId, setMoveFolderId] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canUpload = true;
  const canManage =
    userRole === "INSTRUCTOR" ||
    userRole === "ADMIN" ||
    userRole === "REGISTRAR" ||
    userRole === "DEAN";

  async function toBase64(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || "");
        const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }

  async function load(folderId?: string | null) {
    setLoading(true);
    try {
      const status = await api("/storage/google/status", { headers });
      setLinked(Boolean(status.linked));
      setMode((status.mode || null) as "oauth" | "service_account" | null);
      if (status.linked) {
        const requestedFolder =
          folderId === undefined ? currentFolderId : folderId;
        const filesPayload = await api(
          requestedFolder
            ? `/storage/google/files?folderId=${encodeURIComponent(requestedFolder)}`
            : "/storage/google/files",
          { headers },
        );
        setFiles(filesPayload?.files || []);
        setCurrentFolderId(filesPayload?.currentFolderId || null);
        setParentFolderId(filesPayload?.parentFolderId || null);
        setRootFolderId(filesPayload?.rootFolderId || null);
        const folderPayload = await api("/storage/google/folders", { headers });
        setFolders(folderPayload?.folders || []);
        if (!filesPayload?.rootFolderId) {
          setRootFolderId(folderPayload?.rootFolderId || null);
        }
      } else {
        setFiles([]);
        setFolders([]);
        setRootFolderId(null);
        setCurrentFolderId(null);
        setParentFolderId(null);
      }
    } catch (e) {
      setMessage(toUserMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredFiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = files.filter((file) =>
      !q ? true : String(file.name || "").toLowerCase().includes(q),
    );
    rows = [...rows].sort((a, b) => {
      const aName = String(a.name || "").toLowerCase();
      const bName = String(b.name || "").toLowerCase();
      const aTime = new Date(String(a.modifiedTime || 0)).getTime();
      const bTime = new Date(String(b.modifiedTime || 0)).getTime();
      const aSize = toBytes(a.size);
      const bSize = toBytes(b.size);
      if (sortMode === "NAME_ASC") return aName.localeCompare(bName);
      if (sortMode === "NAME_DESC") return bName.localeCompare(aName);
      if (sortMode === "OLDEST") return aTime - bTime;
      if (sortMode === "SIZE_DESC") return bSize - aSize;
      return bTime - aTime;
    });
    return rows;
  }, [files, search, sortMode]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredFiles.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedFiles = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredFiles.slice(start, start + pageSize);
  }, [filteredFiles, safePage]);

  useEffect(() => {
    setPage(1);
  }, [search, sortMode]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  async function handleUploadSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      if (!canUpload) return;
      if (uploadMode === "file") {
        if (!selectedFile) {
          setMessage("Please select a file first.");
          return;
        }
        const base64 = await toBase64(selectedFile);
        await api("/storage/google/upload", {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: selectedFile.name,
            contentBase64: base64,
            mimeType: selectedFile.type || "application/octet-stream",
          }),
        });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        if (!name.trim() || !content.trim()) {
          setMessage("Please provide both note filename and content.");
          return;
        }
        await api("/storage/google/upload", {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: name.trim(),
            content: content.trim(),
            mimeType: "text/plain",
          }),
        });
      }
      setShowUploadModal(false);
      await load();
    } catch (er) {
      setMessage(toUserMessage(er));
    }
  }

  function openFile(file: DriveFile) {
    if (String(file.mimeType || "") === "application/vnd.google-apps.folder") {
      const folderId = String(file.id || "");
      if (!folderId) return;
      setPage(1);
      void load(folderId);
      return;
    }
    if (supportsPreview(file)) {
      setPreviewFile(file);
      return;
    }
    const url = file.webViewLink || file.webContentLink;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  function downloadFile(file: DriveFile) {
    const url = file.webContentLink || file.webViewLink;
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function deleteFile(file: DriveFile) {
    if (!canManage) return;
    const fileId = String(file.id || "");
    if (!fileId) return;
    const ok = confirm(`Delete "${file.name}"?`);
    if (!ok) return;
    try {
      await api(`/storage/google/files/${fileId}`, {
        method: "DELETE",
        headers,
      });
      await load();
      setMessage("File deleted.");
    } catch (e) {
      setMessage(toUserMessage(e));
    }
  }

  async function handleDisconnectAccount() {
    if (confirmDisconnectText.trim().toUpperCase() !== "UNLINK") {
      setMessage("Type UNLINK to confirm disconnecting your Google account.");
      return;
    }
    try {
      await api("/storage/google/disconnect", { method: "DELETE", headers });
      setShowDisconnectWarning(false);
      setConfirmDisconnectText("");
      await load();
      setMessage("Google account unlinked.");
    } catch (e) {
      setMessage(toUserMessage(e));
    }
  }

  async function handleCreateFolderSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!folderName.trim()) {
      setMessage("Please enter a folder name.");
      return;
    }
    try {
      await api("/storage/google/folders", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: folderName.trim(),
          parentId: currentFolderId || rootFolderId || undefined,
        }),
      });
      setFolderName("");
      setShowFolderModal(false);
      await load();
      setMessage("Folder created.");
    } catch (e) {
      setMessage(toUserMessage(e));
    }
  }

  function openMoveModal(file: DriveFile) {
    setMoveTargetFile(file);
    setMoveFolderId(rootFolderId || "");
    setShowMoveModal(true);
  }

  async function handleMoveFile() {
    const fileId = String(moveTargetFile?.id || "");
    if (!fileId) return;
    try {
      await api(`/storage/google/files/${fileId}/move`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ folderId: moveFolderId || null }),
      });
      setShowMoveModal(false);
      setMoveTargetFile(null);
      await load();
      setMessage("File moved.");
    } catch (e) {
      setMessage(toUserMessage(e));
    }
  }

  const previewUrl = previewFile?.webViewLink || previewFile?.webContentLink || "";
  const previewMime = String(previewFile?.mimeType || "");
  const previewName = String(previewFile?.name || "File");

  return (
    <section className="space-y-4">
      <article className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-4">
        {!linked && (
          <button
            onClick={async () => {
              try {
                const data = await api("/storage/google/connect-url", { headers });
                window.location.href = data.url;
              } catch (e) {
                setMessage(toUserMessage(e));
              }
            }}
            className="rounded-lg bg-primary px-4 py-2.5 font-label text-sm font-bold text-on-primary hover:opacity-90 transition-opacity"
          >
            Link Google Account
          </button>
        )}
        {linked && mode === "oauth" && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setConfirmDisconnectText("");
                setShowDisconnectWarning(true);
              }}
              className="rounded-lg border border-outline-variant/40 bg-surface-container px-4 py-2.5 font-label text-sm font-bold text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Disconnect
            </button>
            <button
              data-keep-action-text="true"
              onClick={() => {
                void load();
              }}
              className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-4 py-2.5 font-label text-sm hover:bg-surface-container transition-colors"
            >
              Refresh
            </button>
          </div>
        )}
        {linked && mode === "service_account" && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-label font-bold text-emerald-700">
              Service Account Connected
            </span>
            <button
              data-keep-action-text="true"
              onClick={() => {
                void load();
              }}
              className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-4 py-2.5 font-label text-sm hover:bg-surface-container transition-colors"
            >
              Refresh
            </button>
          </div>
        )}
      </article>

      {linked && (
        <article className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowUploadModal(true)}
              disabled={!canUpload}
              className="rounded-lg bg-primary px-4 py-2.5 font-label text-sm font-bold text-on-primary hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
            >
              Upload File
            </button>
            <button
              onClick={() => {
                setFolderName("");
                setShowFolderModal(true);
              }}
              className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-4 py-2.5 font-label text-sm text-on-surface hover:bg-surface-container transition-colors"
            >
              Create Folder
            </button>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search files"
              className="h-9 min-w-[180px] rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 font-body text-sm text-on-surface placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary outline-none sm:min-w-[220px]"
            />
            <select
              value={sortMode}
              onChange={(e) => {
                setSortMode(e.target.value as SortMode);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 font-body text-sm text-on-surface"
            >
              <option value="NEWEST">Sort: Newest</option>
              <option value="OLDEST">Sort: Oldest</option>
              <option value="NAME_ASC">Sort: Name A-Z</option>
              <option value="NAME_DESC">Sort: Name Z-A</option>
              <option value="SIZE_DESC">Sort: Largest</option>
            </select>
            {currentFolderId && rootFolderId && currentFolderId !== rootFolderId && (
              <button
                onClick={() => {
                  setPage(1);
                  void load(parentFolderId || rootFolderId);
                }}
                className="h-9 rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 font-label text-sm text-on-surface hover:bg-surface-container transition-colors"
              >
                Back to Parent
              </button>
            )}
          </div>
        </article>
      )}

      {linked && (
        <article className="overflow-hidden rounded-lg border border-outline-variant/20 bg-surface-container-lowest">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm font-body">
              <thead className="bg-surface-container text-on-surface-variant font-label">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">File</th>
                  <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Type</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Size</th>
                  <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Uploaded Date</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedFiles.map((file) => {
                  const type = getFileTypeLabel(file);
                  return (
                    <tr key={file.id || `${file.name}`} className="border-t border-outline-variant/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-primary">
                          <span className="flex-shrink-0 text-on-surface-variant">
                            <FileTypeIcon type={type} />
                          </span>
                          <button
                            onClick={() => openFile(file)}
                            className="truncate text-left font-label font-medium hover:text-primary/80 transition-colors"
                            title={String(file.name || "")}
                          >
                            {file.name}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant hidden sm:table-cell">{type}</td>
                      <td className="px-4 py-3 text-on-surface-variant hidden md:table-cell">{formatSize(file.size)}</td>
                      <td className="px-4 py-3 text-on-surface-variant hidden lg:table-cell">
                        {file.modifiedTime
                          ? new Date(file.modifiedTime).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => openFile(file)}
                            className="rounded-lg border border-outline-variant/40 px-2.5 py-1.5 font-label text-xs hover:bg-surface-container transition-colors"
                          >
                            Open
                          </button>
                          <button
                            onClick={() => downloadFile(file)}
                            className="rounded-lg border border-outline-variant/40 px-2.5 py-1.5 font-label text-xs hover:bg-surface-container transition-colors"
                          >
                            Download
                          </button>
                          {canManage && (
                            <button
                              onClick={() => deleteFile(file)}
                              className="rounded-lg border border-error-container px-2.5 py-1.5 font-label text-xs font-bold text-error hover:bg-error-container/30 transition-colors"
                            >
                              Delete
                            </button>
                          )}
                          {canManage && (
                            <button
                              onClick={() => openMoveModal(file)}
                              className="rounded-lg border border-outline-variant/40 px-2.5 py-1.5 font-label text-xs hover:bg-surface-container transition-colors"
                            >
                              Move
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!filteredFiles.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center font-body text-sm text-on-surface-variant">
                      {loading ? "Loading files..." : "No files found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {!!filteredFiles.length && (
            <div className="flex items-center justify-between border-t border-outline-variant/20 bg-surface-container px-4 py-2.5 font-label text-xs text-on-surface-variant">
              <p>
                Showing {(safePage - 1) * pageSize + 1}-
                {Math.min(safePage * pageSize, filteredFiles.length)} of{" "}
                {filteredFiles.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="rounded-lg border border-outline-variant/40 px-2.5 py-1.5 disabled:opacity-50 hover:bg-surface-container-lowest transition-colors"
                >
                  Prev
                </button>
                <span>
                  Page {safePage} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="rounded-lg border border-outline-variant/40 px-2.5 py-1.5 disabled:opacity-50 hover:bg-surface-container-lowest transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </article>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleUploadSubmit}
            className="w-full max-w-lg rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-xl md:p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-headline text-base font-bold text-primary sm:text-lg">Upload Resource</h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="rounded-lg border border-outline-variant/40 px-3 py-1.5 font-label text-xs hover:bg-surface-container transition-colors"
              >
                Close
              </button>
            </div>

            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => setUploadMode("file")}
                className={`rounded-lg px-4 py-2 font-label text-sm font-bold transition-colors ${
                  uploadMode === "file" ? "bg-primary text-on-primary" : "border border-outline-variant/40 bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                File Upload
              </button>
              <button
                type="button"
                onClick={() => setUploadMode("note")}
                className={`rounded-lg px-4 py-2 font-label text-sm font-bold transition-colors ${
                  uploadMode === "note" ? "bg-primary text-on-primary" : "border border-outline-variant/40 bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                Quick Note
              </button>
            </div>

            {uploadMode === "file" ? (
              <>
                <label className="mb-2 block font-label text-sm font-medium text-on-surface">
                  Select file
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="mb-2 w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-2.5 font-body text-sm text-on-surface"
                />
                {selectedFile && (
                  <p className="mb-2 font-body text-xs text-on-surface-variant">
                    Selected: {selectedFile.name} ({Math.ceil(selectedFile.size / 1024)} KB)
                  </p>
                )}
              </>
            ) : (
              <>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mb-2 w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-2.5 font-body text-sm text-on-surface placeholder:text-on-surface-variant"
                  placeholder="Filename (e.g. notes.txt)"
                />
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="mb-2 w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-2.5 font-body text-sm text-on-surface placeholder:text-on-surface-variant"
                  rows={5}
                  placeholder="Write your note"
                />
              </>
            )}
            <div className="flex justify-end pt-2">
              <button
                className="rounded-lg bg-primary px-4 py-2.5 font-label text-sm font-bold text-on-primary hover:opacity-90 transition-opacity"
                data-keep-action-text="true"
              >
                {uploadMode === "file" ? "Upload File" : "Upload Note"}
              </button>
            </div>
          </form>
        </div>
      )}

      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-xl md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="truncate font-headline text-base font-bold text-primary sm:text-lg">{previewName}</h3>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="rounded-lg border border-outline-variant/40 px-3 py-1.5 font-label text-xs hover:bg-surface-container transition-colors"
              >
                Close
              </button>
            </div>
            {!previewUrl && (
              <p className="font-body text-sm text-on-surface-variant">Preview is not available for this file.</p>
            )}
            {!!previewUrl && previewMime.startsWith("image/") && (
              <div className="max-h-[70vh] overflow-auto rounded-lg border border-outline-variant/20 bg-surface-container p-2">
                <img src={previewUrl} alt={previewName} className="mx-auto max-h-[66vh] object-contain" />
              </div>
            )}
            {!!previewUrl && previewMime === "application/pdf" && (
              <iframe
                title={previewName}
                src={previewUrl}
                className="h-[70vh] w-full rounded-lg border border-outline-variant/20"
              />
            )}
            {!!previewUrl && previewMime.startsWith("video/") && (
              <video
                controls
                src={previewUrl}
                className="max-h-[70vh] w-full rounded-lg border border-outline-variant/20"
              />
            )}
            {!!previewUrl &&
              !previewMime.startsWith("image/") &&
              previewMime !== "application/pdf" &&
              !previewMime.startsWith("video/") && (
                <div className="rounded-lg border border-outline-variant/20 bg-surface-container p-4 font-body text-sm text-on-surface-variant">
                  Preview is not supported for this file type. Use Download.
                </div>
              )}
          </div>
        </div>
      )}

      {showDisconnectWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-xl">
            <h3 className="font-headline text-base font-bold text-error sm:text-lg">
              Unlink Google Account?
            </h3>
            <p className="mt-2 font-body text-sm text-on-surface-variant">
              You will lose access to Drive files from this app until you link again.
              Existing files in your Google Drive will not be deleted.
            </p>
            <p className="mt-3 rounded-md border border-error-container bg-error-container/20 px-3 py-2 font-body text-xs text-error">
              To continue, type <span className="font-bold">UNLINK</span> below.
            </p>
            <input
              value={confirmDisconnectText}
              onChange={(e) => setConfirmDisconnectText(e.target.value)}
              className="mt-2 w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 font-body text-sm text-on-surface placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary outline-none"
              placeholder="Type UNLINK"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDisconnectWarning(false);
                  setConfirmDisconnectText("");
                }}
                className="rounded-lg border border-outline-variant/40 px-3 py-2 font-label text-xs text-on-surface hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisconnectAccount}
                className="rounded-lg bg-error px-3 py-2 font-label text-xs font-bold text-on-error hover:opacity-90 transition-opacity"
              >
                Unlink Account
              </button>
            </div>
          </div>
        </div>
      )}

      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreateFolderSubmit}
            className="w-full max-w-md rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-xl"
          >
            <h3 className="font-headline text-base font-bold text-primary sm:text-lg">
              Create Folder
            </h3>
            <input
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="mt-3 w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 font-body text-sm text-on-surface placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary outline-none"
              placeholder="Folder name"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowFolderModal(false)}
                className="rounded-lg border border-outline-variant/40 px-3 py-2 font-label text-xs text-on-surface hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-primary px-3 py-2 font-label text-xs font-bold text-on-primary hover:opacity-90 transition-opacity"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {showMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-xl">
            <h3 className="font-headline text-base font-bold text-primary sm:text-lg">
              Move File
            </h3>
            <p className="mt-2 truncate font-body text-sm text-on-surface-variant">
              {moveTargetFile?.name || "Selected file"}
            </p>
            <select
              data-keep-action-text="true"
              value={moveFolderId}
              onChange={(e) => setMoveFolderId(e.target.value)}
              className="mt-3 w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 font-body text-sm text-on-surface"
            >
              {rootFolderId && <option value={rootFolderId}>Main folder</option>}
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowMoveModal(false);
                  setMoveTargetFile(null);
                }}
                className="rounded-lg border border-outline-variant/40 px-3 py-2 font-label text-xs text-on-surface hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMoveFile}
                className="rounded-lg bg-primary px-3 py-2 font-label text-xs font-bold text-on-primary hover:opacity-90 transition-opacity"
              >
                Move
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
