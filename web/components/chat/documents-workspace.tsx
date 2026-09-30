"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import {
  FileIcon,
  FileImageIcon,
  FileVideoIcon,
  FilesIcon,
  FolderUpIcon,
  ImageIcon,
  PlusIcon,
  DownloadIcon,
  Trash2Icon,
  VideoIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FileKind = "image" | "video" | "document";
type WorkspaceFile = { id: string; file: File; kind: FileKind; url: string };
type Filter = "all" | FileKind;

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = new Set([
  "pdf", "doc", "docx", "txt", "md", "rtf", "csv", "xls", "xlsx", "ppt", "pptx",
  "json", "xml", "png", "jpg", "jpeg", "gif", "webp", "bmp", "mp4", "mov", "webm", "m4v",
]);

function kindOf(file: File): FileKind | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (file.type.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "bmp"].includes(extension)) return "image";
  if (file.type.startsWith("video/") || ["mp4", "mov", "webm", "m4v"].includes(extension)) return "video";
  return ACCEPTED_EXTENSIONS.has(extension) ? "document" : null;
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FilePreview({ item }: { item: WorkspaceFile }) {
  if (item.kind === "image") {
    return <img src={item.url} alt={item.file.name} className="h-full w-full object-cover" />;
  }
  if (item.kind === "video") {
    return <video src={item.url} controls preload="metadata" className="h-full w-full object-cover" />;
  }
  if (item.file.type === "application/pdf") {
    return <iframe src={item.url} title={`Preview of ${item.file.name}`} className="h-full w-full bg-white" />;
  }
  const Icon = item.file.name.toLowerCase().endsWith(".docx") || item.file.name.toLowerCase().endsWith(".doc")
    ? FileIcon
    : FilesIcon;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 bg-muted/45 text-muted-foreground">
      <Icon className="size-9 stroke-[1.4]" />
      <span className="text-[11px] font-medium uppercase">{item.file.name.split(".").pop()}</span>
    </div>
  );
}

export function DocumentsWorkspace() {
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [dragging, setDragging] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  const urls = useRef<string[]>([]);

  useEffect(() => () => urls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const addFiles = (incoming: FileList | File[]) => {
    const accepted: WorkspaceFile[] = [];
    for (const file of Array.from(incoming)) {
      const kind = kindOf(file);
      if (!kind) {
        toast.error(`${file.name} isn't a supported file type.`);
      } else if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is over the 50 MB limit.`);
      } else {
        const url = URL.createObjectURL(file);
        urls.current.push(url);
        accepted.push({ id: `${file.name}-${file.lastModified}-${Math.random()}`, file, kind, url });
      }
    }
    if (accepted.length) setFiles((current) => [...accepted, ...current]);
  };

  const openPicker = (kind: Filter) => {
    if (picker.current) {
      picker.current.accept = kind === "image" ? "image/*" : kind === "video" ? "video/*" : kind === "document" ? ".pdf,.doc,.docx,.txt,.md,.rtf,.csv,.xls,.xlsx,.ppt,.pptx,.json,.xml" : "*/*";
      picker.current.click();
    }
  };

  const visibleFiles = files.filter((item) => filter === "all" || item.kind === filter);
  const counts = {
    all: files.length,
    image: files.filter((item) => item.kind === "image").length,
    video: files.filter((item) => item.kind === "video").length,
    document: files.filter((item) => item.kind === "document").length,
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Workspace</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Documents</h1>
        </div>
        <Button onClick={() => openPicker("all")}><PlusIcon /> Add files</Button>
      </header>

      <div className="mx-auto w-full max-w-5xl px-5 pb-8 sm:px-8">
        <div
          onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }}
          onDrop={(event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }}
          className={cn(
            "rounded-xl border border-dashed bg-muted/20 px-5 py-7 transition-colors sm:px-8",
            dragging && "border-foreground/50 bg-accent",
          )}
        >
          <div className="mx-auto flex max-w-xl flex-col items-center text-center">
            <span className="grid size-12 place-items-center rounded-xl border bg-background shadow-sm">
              <FolderUpIcon className="size-5 text-muted-foreground" />
            </span>
            <h2 className="mt-4 text-sm font-semibold">Bring your files into the conversation</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">Drop files here or choose what you want to add. Up to 50 MB per file.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => openPicker("image")}><ImageIcon /> Images</Button>
              <Button variant="outline" size="sm" onClick={() => openPicker("video")}><VideoIcon /> Videos</Button>
              <Button variant="outline" size="sm" onClick={() => openPicker("document")}><FileIcon /> Documents</Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">PDF, DOCX, TXT, CSV, XLSX, PPTX, images and common video formats</p>
          </div>
          <input
            ref={picker}
            type="file"
            multiple
            className="sr-only"
            onChange={(event) => { if (event.target.files) addFiles(event.target.files); event.target.value = ""; }}
          />
        </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-3 border-b pb-3">
          <div>
            <h2 className="font-semibold">Your files <span className="ml-1 font-normal text-muted-foreground">{files.length}</span></h2>
            <p className="mt-1 text-xs text-muted-foreground">Files stay in this browser session and are not sent to the AI service.</p>
          </div>
          {files.length > 0 && <Button variant="ghost" size="sm" onClick={() => {
            files.forEach((item) => URL.revokeObjectURL(item.url));
            urls.current = [];
            setFiles([]);
          }}><Trash2Icon /> Clear all</Button>}
        </div>

        <nav aria-label="Filter files" className="flex gap-1 overflow-x-auto py-3">
          {(["all", "document", "image", "video"] as Filter[]).map((value) => {
            const label = value === "all" ? "All files" : value === "image" ? "Images" : `${value[0].toUpperCase()}${value.slice(1)}s`;
            return (
              <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value}
                className={cn("shrink-0 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground", filter === value && "bg-accent font-medium text-foreground")}>
                {label} <span className="ml-1 text-xs opacity-65">{counts[value]}</span>
              </button>
            );
          })}
        </nav>

        {visibleFiles.length ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleFiles.map((item) => {
              const TypeIcon = item.kind === "image" ? FileImageIcon : item.kind === "video" ? FileVideoIcon : FileIcon;
              return (
                <article key={item.id} className="group overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md">
                  <div className="relative aspect-[16/9] overflow-hidden bg-muted/40"><FilePreview item={item} />
                    <a href={item.url} download={item.file.name} aria-label={`Download ${item.file.name}`} className="absolute right-2 top-2 grid size-8 place-items-center rounded-md border bg-background/90 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus:opacity-100"><DownloadIcon className="size-4" /></a>
                  </div>
                  <div className="flex items-center gap-3 p-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted"><TypeIcon className="size-4 text-muted-foreground" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" title={item.file.name}>{item.file.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{formatSize(item.file.size)} · Preview ready</p>
                    </div>
                    <Button variant="ghost" size="icon-sm" aria-label={`Remove ${item.file.name}`} onClick={() => {
                      URL.revokeObjectURL(item.url);
                      urls.current = urls.current.filter((url) => url !== item.url);
                      setFiles((current) => current.filter((file) => file.id !== item.id));
                    }}><XIcon /></Button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-48 flex-col items-center justify-center text-center">
            <span className="grid size-11 place-items-center rounded-full bg-muted"><FilesIcon className="size-5 text-muted-foreground" /></span>
            <p className="mt-3 text-sm font-medium">{files.length ? "No files in this view" : "No files yet"}</p>
            <p className="mt-1 text-sm text-muted-foreground">{files.length ? "Choose another category above." : "Add documents, images or video to see them here."}</p>
          </div>
        )}

        <aside className="mt-8 flex items-start gap-3 rounded-lg border bg-muted/20 p-4 text-sm">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-background"><FileVideoIcon className="size-4 text-muted-foreground" /></span>
          <div><p className="font-medium">AI file analysis is not connected yet</p><p className="mt-1 text-muted-foreground">Uploads and previews work locally. Document extraction, image understanding, video analysis and generation need corresponding backend/provider support.</p></div>
        </aside>
      </div>
    </section>
  );
}