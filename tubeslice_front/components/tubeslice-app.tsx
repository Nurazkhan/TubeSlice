"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  CheckCircle,
  Clock,
  FilmSlate,
  LinkSimple,
  LockKey,
  Plus,
  Scissors,
  SignOut,
  Trash,
  UserCircle,
  WarningCircle,
} from "@phosphor-icons/react";
import { api } from "@/lib/api";
import type { AuthMode, DownloadJob, JobStatus, SegmentDraft, SliceTask, User, VideoFormat, VideoMetadata } from "@/lib/types";

const fallbackFormats: VideoFormat[] = [
  { format_id: "360p", ext: "mp4", resolution: "640x360", note: "360p" },
  { format_id: "480p", ext: "mp4", resolution: "854x480", note: "480p" },
  { format_id: "720p", ext: "mp4", resolution: "1280x720", note: "720p" },
];

const iconWeight = "regular" as const;
const fieldClass =
  "w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-stone-950 focus:ring-2 focus:ring-stone-200";
const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-900 transition hover:bg-stone-100 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50";

function newSegmentId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
}

function makeSegment(index = 0, format?: VideoFormat): SegmentDraft {
  const start = index * 30;
  return {
    localId: `clip-${newSegmentId()}`,
    start_time: start,
    end_time: start + 30,
    format: "mp4",
    quality: format?.note || format?.resolution || "360p",
    format_id: format?.format_id || "360p",
  };
}

function formatTime(seconds?: number) {
  if (!seconds) return "unknown length";
  const value = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(value / 60);
  const remainder = value % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function formatLabel(format?: VideoFormat) {
  if (!format) return "backend default";
  const details = [format.resolution, format.ext?.toUpperCase()].filter(Boolean).join(" / ");
  return details ? `${format.note || format.format_id} · ${details}` : format.note || format.format_id;
}

function statusClass(status: JobStatus) {
  if (status === "Downloaded") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "Failed" || status === "Error") return "border-red-200 bg-red-50 text-red-800";
  if (status === "Accepted" || status === "Processing") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-stone-200 bg-stone-50 text-stone-600";
}

function getFormatPayload(formats: VideoFormat[], formatId: string, exactFormats: boolean) {
  const selected = formats.find((format) => format.format_id === formatId);
  if (!selected) return { quality: formatId || "360p" };

  const quality = selected.note || selected.resolution || selected.format_id;
  return exactFormats ? { quality, format_id: selected.format_id } : { quality };
}

function taskToJob(task: SliceTask, values: Partial<DownloadJob>): DownloadJob {
  return {
    id: task.id,
    kind: "task",
    status: task.status,
    label: task.title || values.label || "Untitled video",
    message: values.message,
    segments: task.segments,
    thumbnail: values.thumbnail,
    formatLabel: values.formatLabel,
    rangeLabel: values.rangeLabel,
  };
}

function FormatSelect({
  label,
  value,
  formats,
  onChange,
}: {
  label: string;
  value: string;
  formats: VideoFormat[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-stone-800">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass}>
        {formats.map((format) => (
          <option key={format.format_id} value={format.format_id}>
            {formatLabel(format)}
          </option>
        ))}
      </select>
    </label>
  );
}

function AuthPanel({
  user,
  token,
  onAuthenticated,
  onLogout,
}: {
  user: User | null;
  token: string | null;
  onAuthenticated: (token: string, user?: User) => void;
  onLogout: () => void;
}) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      if (mode === "signup") {
        const nextUser = await api.signup(form);
        const session = await api.login({ email: form.email, password: form.password });
        onAuthenticated(session.token, nextUser);
      } else {
        const session = await api.login({ email: form.email, password: form.password });
        onAuthenticated(session.token);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  };

  if (token) {
    return (
      <aside className="panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Session</p>
            <h2 className="mt-1 text-lg font-semibold text-stone-950">{user ? `${user.first_name} ${user.last_name}` : "Signed in"}</h2>
            <p className="mt-1 break-all text-sm text-stone-500">{user?.email ?? "Token saved in this browser"}</p>
          </div>
          <UserCircle size={26} weight={iconWeight} className="text-stone-500" />
        </div>
        <div className="mt-4 rounded-xl bg-stone-100 px-3 py-2 text-xs text-stone-600">
          API: <span className="font-mono text-stone-900">{api.baseUrl}</span>
        </div>
        <button type="button" onClick={onLogout} className={`${secondaryButton} mt-4 w-full`}>
          <SignOut size={17} weight={iconWeight} />
          Sign out
        </button>
      </aside>
    );
  }

  return (
    <aside className="panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Account</p>
          <h2 className="mt-1 text-lg font-semibold text-stone-950">{mode === "login" ? "Log in" : "Create account"}</h2>
        </div>
        <LockKey size={24} weight={iconWeight} className="text-stone-500" />
      </div>

      <form onSubmit={submit} className="mt-4 grid gap-3">
        {mode === "signup" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium text-stone-800">
              First name
              <input
                required
                value={form.first_name}
                onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))}
                className={fieldClass}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-stone-800">
              Last name
              <input
                required
                value={form.last_name}
                onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))}
                className={fieldClass}
              />
            </label>
          </div>
        ) : null}
        <label className="grid gap-1.5 text-sm font-medium text-stone-800">
          Email
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-stone-800">
          Password
          <input
            required
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            className={fieldClass}
          />
        </label>
        {error ? <InlineMessage tone="error" text={error} /> : null}
        <button disabled={busy} className={`${primaryButton} w-full`}>
          {busy ? "Working" : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode((current) => (current === "login" ? "signup" : "login"));
          setError("");
        }}
        className="mt-4 text-sm font-semibold text-stone-700 underline-offset-4 hover:underline"
      >
        {mode === "login" ? "Create an account" : "Use an existing account"}
      </button>
    </aside>
  );
}

function InlineMessage({ tone, text }: { tone: "error" | "success"; text: string }) {
  const classes =
    tone === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800";

  return (
    <p className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${classes}`}>
      {tone === "error" ? <WarningCircle size={18} weight={iconWeight} /> : <CheckCircle size={18} weight={iconWeight} />}
      <span>{text}</span>
    </p>
  );
}

function MetadataCard({ metadata }: { metadata: VideoMetadata | null }) {
  if (!metadata) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-5 text-sm leading-6 text-stone-500">
        Paste a URL and inspect it before creating a job. The backend returns title, duration, thumbnail, and formats.
      </div>
    );
  }

  return (
    <article className="grid gap-4 rounded-2xl bg-stone-100 p-4 sm:grid-cols-[11rem_1fr]">
      {metadata.thumbnail ? (
        <img
          src={metadata.thumbnail}
          alt={`Thumbnail for ${metadata.title}`}
          className="aspect-video w-full rounded-xl object-cover"
          loading="lazy"
        />
      ) : null}
      <div className="min-w-0">
        <p className="eyebrow text-emerald-700">Video found</p>
        <h2 className="mt-1 line-clamp-2 text-lg font-semibold text-stone-950">{metadata.title}</h2>
        <p className="mt-2 text-sm text-stone-600">
          {metadata.uploader} · {formatTime(metadata.duration)}
        </p>
        <p className="mt-3 break-all font-mono text-xs text-stone-500">{metadata.youtube_url}</p>
      </div>
    </article>
  );
}

function SegmentEditor({
  segments,
  formats,
  thumbnail,
  onAdd,
  onRemove,
  onTimeChange,
  onFormatChange,
}: {
  segments: SegmentDraft[];
  formats: VideoFormat[];
  thumbnail?: string;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onTimeChange: (id: string, key: "start_time" | "end_time", value: number) => void;
  onFormatChange: (id: string, value: string) => void;
}) {
  return (
    <section className="panel">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Segments</p>
          <h2 className="mt-1 text-xl font-semibold text-stone-950">Timestamps</h2>
        </div>
        <button type="button" onClick={onAdd} className="icon-button" aria-label="Add segment">
          <Plus size={18} weight={iconWeight} />
        </button>
      </div>

      <div className="mt-5 grid gap-3">
        {segments.map((segment, index) => (
          <article key={segment.localId} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                {thumbnail ? <img src={thumbnail} alt="" className="h-10 w-16 rounded-lg object-cover" loading="lazy" /> : null}
                <div>
                  <p className="font-mono text-xs text-stone-500">Clip {index + 1}</p>
                  <p className="text-sm font-medium text-stone-900">
                    {formatTime(segment.start_time)} to {formatTime(segment.end_time)}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => onRemove(segment.localId)} className="icon-button muted" aria-label={`Remove clip ${index + 1}`}>
                <Trash size={16} weight={iconWeight} />
              </button>
            </div>

            <div className="grid gap-3">
              <FormatSelect label="Format" value={segment.format_id || segment.quality} formats={formats} onChange={(value) => onFormatChange(segment.localId, value)} />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-medium text-stone-800">
                  Start
                  <input
                    type="number"
                    min={0}
                    value={segment.start_time}
                    onChange={(event) => onTimeChange(segment.localId, "start_time", Number(event.target.value))}
                    className={`${fieldClass} font-mono`}
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-medium text-stone-800">
                  End
                  <input
                    type="number"
                    min={segment.start_time + 1}
                    value={segment.end_time}
                    onChange={(event) => onTimeChange(segment.localId, "end_time", Number(event.target.value))}
                    className={`${fieldClass} font-mono`}
                  />
                </label>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function JobList({ jobs, onPoll }: { jobs: DownloadJob[]; onPoll: (job: DownloadJob) => void }) {
  return (
    <section className="panel min-h-[28rem]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Queue</p>
          <h2 className="mt-1 text-xl font-semibold text-stone-950">Jobs</h2>
        </div>
        <p className="font-mono text-sm text-stone-500">{jobs.length} records</p>
      </div>

      {jobs.length === 0 ? (
        <div className="mt-6 grid min-h-72 place-items-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
          <div>
            <FilmSlate size={34} weight={iconWeight} className="mx-auto text-stone-400" />
            <h3 className="mt-3 font-semibold text-stone-950">Nothing queued</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-stone-500">Jobs appear here after the backend accepts a download or slice request.</p>
          </div>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-stone-200">
          {jobs.map((job) => (
            <JobRow key={job.id} job={job} onPoll={onPoll} />
          ))}
        </div>
      )}
    </section>
  );
}

function JobRow({ job, onPoll }: { job: DownloadJob; onPoll: (job: DownloadJob) => void }) {
  const readySegments = job.status === "Downloaded" ? job.segments : [];

  return (
    <article className="grid gap-4 py-4 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="flex min-w-0 gap-3">
        {job.thumbnail ? <img src={job.thumbnail} alt={`Thumbnail for ${job.label}`} className="h-14 w-24 rounded-xl object-cover" loading="lazy" /> : null}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(job.status)}`}>{job.status}</span>
            {job.rangeLabel ? <span className="font-mono text-xs text-stone-500">{job.rangeLabel}</span> : null}
          </div>
          <h3 className="mt-2 truncate text-sm font-semibold text-stone-950">{job.label}</h3>
          {job.message ? <p className="mt-1 line-clamp-2 text-sm text-stone-500">{job.message}</p> : null}
          {job.formatLabel ? <p className="mt-1 font-mono text-xs text-stone-500">{job.formatLabel}</p> : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 lg:justify-end">
        <button type="button" onClick={() => onPoll(job)} className={secondaryButton}>
          <Clock size={17} weight={iconWeight} />
          Check
        </button>
        {readySegments.map((segment, index) => (
          <a key={segment.id} href={api.downloadUrl(segment.id)} download={`${segment.id}.mp4`} className={primaryButton}>
            <ArrowDown size={17} weight={iconWeight} />
            {readySegments.length > 1 ? `Clip ${index + 1}` : "Save"}
          </a>
        ))}
      </div>
    </article>
  );
}

export default function TubeSliceApp() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [url, setUrl] = useState("");
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [segments, setSegments] = useState<SegmentDraft[]>([makeSegment()]);
  const [fullFormatId, setFullFormatId] = useState("360p");
  const [jobs, setJobs] = useState<DownloadJob[]>([]);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const hasUrl = url.trim().length > 8;
  const formats = useMemo(() => {
    const backendFormats = metadata?.formats?.filter((format) => format.format_id) ?? [];
    return backendFormats.length ? backendFormats : fallbackFormats;
  }, [metadata]);
  const exactFormats = Boolean(metadata?.formats?.some((format) => format.format_id));

  useEffect(() => {
    const savedToken = window.localStorage.getItem("tubeslice_token");
    if (!savedToken) return;

    setToken(savedToken);
    api.dashboard(savedToken).catch(() => window.localStorage.removeItem("tubeslice_token"));
  }, []);

  useEffect(() => {
    const activeJobs = jobs.filter((job) => job.status === "Accepted" || job.status === "Processing");
    if (!activeJobs.length) return;

    const timer = window.setInterval(() => {
      activeJobs.forEach((job) => refreshJob(job, false));
    }, 2000);

    return () => window.clearInterval(timer);
  }, [jobs, token]);

  const authenticate = (nextToken: string, nextUser?: User) => {
    window.localStorage.setItem("tubeslice_token", nextToken);
    setToken(nextToken);
    if (nextUser) setUser(nextUser);
  };

  const logout = () => {
    window.localStorage.removeItem("tubeslice_token");
    setToken(null);
    setUser(null);
  };

  const inspectVideo = async () => {
    setIsInspecting(true);
    setError("");
    setNotice("");

    try {
      const result = await api.info(url.trim(), token);
      const firstFormat = result.formats?.find((format) => format.format_id);

      setMetadata(result);
      setFullFormatId(firstFormat?.format_id || "360p");
      setSegments((current) => current.map((segment, index) => ({ ...makeSegment(index, firstFormat), localId: segment.localId })));
      setNotice("Metadata loaded.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not inspect this URL");
    } finally {
      setIsInspecting(false);
    }
  };

  const queueFullVideo = async () => {
    setIsSubmitting(true);
    setError("");
    setNotice("");

    try {
      const selectedFormat = formats.find((format) => format.format_id === fullFormatId);
      const task = await api.slice({ url: url.trim(), ...getFormatPayload(formats, fullFormatId, exactFormats) }, token);

      setJobs((current) => [
        taskToJob(task, {
          label: metadata?.title,
          thumbnail: metadata?.thumbnail,
          formatLabel: formatLabel(selectedFormat),
          rangeLabel: metadata ? `0:00 to ${formatTime(metadata.duration)}` : "full video",
          message: "Full video queued.",
        }),
        ...current,
      ]);
      setNotice("Full video queued.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not queue the download");
    } finally {
      setIsSubmitting(false);
    }
  };

  const queueClips = async () => {
    setIsSubmitting(true);
    setError("");
    setNotice("");

    try {
      const tasks = await Promise.all(
        segments.map((segment) => {
          const formatId = segment.format_id || segment.quality;
          return api.slice(
            {
              url: url.trim(),
              ...getFormatPayload(formats, formatId, exactFormats),
              segments: [{ start_time: segment.start_time, end_time: segment.end_time }],
            },
            token,
          );
        }),
      );

      setJobs((current) => [
        ...tasks.map((task, index) => {
          const segment = segments[index];
          const selectedFormat = formats.find((format) => format.format_id === (segment.format_id || segment.quality));

          return taskToJob(task, {
            label: metadata?.title || `Clip ${index + 1}`,
            thumbnail: metadata?.thumbnail,
            formatLabel: formatLabel(selectedFormat),
            rangeLabel: `${formatTime(segment.start_time)} to ${formatTime(segment.end_time)}`,
            message: `Clip ${index + 1} queued.`,
          });
        }),
        ...current,
      ]);
      setNotice(`${tasks.length} clip${tasks.length === 1 ? "" : "s"} queued.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not queue clips");
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshJob = async (job: DownloadJob, showErrors = true) => {
    if (showErrors) setError("");

    try {
      const task = await api.status(job.id, token);
      setJobs((current) =>
        current.map((item) =>
          item.id === job.id
            ? {
                ...item,
                status: task.status,
                label: task.title || item.label,
                segments: task.segments,
                message:
                  task.status === "Downloaded"
                    ? "Ready to save."
                    : task.status === "Failed"
                      ? "The backend marked this job as failed."
                      : `Status: ${task.status}.`,
              }
            : item,
        ),
      );
    } catch (caught) {
      setJobs((current) =>
        current.map((item) =>
          item.id === job.id ? { ...item, status: "Error", message: caught instanceof Error ? caught.message : "Could not refresh status" } : item,
        ),
      );
    }
  };

  const addSegment = () => {
    setSegments((current) => [...current, makeSegment(current.length, formats[0])]);
  };

  const removeSegment = (id: string) => {
    setSegments((current) => current.filter((segment) => segment.localId !== id));
  };

  const updateSegmentTime = (id: string, key: "start_time" | "end_time", value: number) => {
    setSegments((current) => current.map((segment) => (segment.localId === id ? { ...segment, [key]: Math.max(0, value) } : segment)));
  };

  const updateSegmentFormat = (id: string, value: string) => {
    const selectedFormat = formats.find((format) => format.format_id === value);
    setSegments((current) =>
      current.map((segment) =>
        segment.localId === id
          ? {
              ...segment,
              format_id: value,
              quality: selectedFormat?.note || selectedFormat?.resolution || value,
            }
          : segment,
      ),
    );
  };

  return (
    <main className="min-h-[100dvh] px-4 py-5 text-stone-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1360px]">
        <nav className="flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <Image src="/logo_without_background.png" alt="TubeSlice" width={70} height={44} priority />
            <div>
              <p className="text-base font-semibold">TubeSlice</p>
              <p className="font-mono text-xs text-stone-500">YouTube cutter</p>
            </div>
          </div>
          <p className="hidden rounded-full border border-stone-200 bg-white px-3 py-1.5 font-mono text-xs text-stone-500 sm:block">{api.baseUrl}</p>
        </nav>

        <div className="grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="panel">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
              <div>
                <p className="eyebrow">Download workbench</p>
                <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight text-stone-950 sm:text-5xl">
                  Cut YouTube videos without leaving the browser.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600">
                  Inspect a URL, choose a format, then send a full download or exact timestamp clips to the backend worker.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <label className="relative block">
                    <span className="sr-only">YouTube URL</span>
                    <LinkSimple size={18} weight={iconWeight} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className={`${fieldClass} py-3 pl-10`}
                    />
                  </label>
                  <button type="button" disabled={!hasUrl || isInspecting} onClick={inspectVideo} className={primaryButton}>
                    <FilmSlate size={18} weight={iconWeight} />
                    {isInspecting ? "Inspecting" : "Inspect"}
                  </button>
                </div>
              </div>

              <MetadataCard metadata={metadata} />
            </div>

            <div className="mt-6 grid gap-4 border-t border-stone-200 pt-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
              <FormatSelect label="Full video format" value={fullFormatId} formats={formats} onChange={setFullFormatId} />
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={!hasUrl || isSubmitting} onClick={queueFullVideo} className={primaryButton}>
                  <ArrowDown size={18} weight={iconWeight} />
                  Queue full video
                </button>
                <button type="button" disabled={!hasUrl || isSubmitting || segments.length === 0} onClick={queueClips} className={secondaryButton}>
                  <Scissors size={18} weight={iconWeight} />
                  Queue clips
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {notice ? <InlineMessage tone="success" text={notice} /> : null}
              {error ? <InlineMessage tone="error" text={error} /> : null}
            </div>
          </section>

          <AuthPanel user={user} token={token} onAuthenticated={authenticate} onLogout={logout} />
        </div>

        <div className="grid gap-6 pb-10 lg:grid-cols-[24rem_minmax(0,1fr)]">
          <SegmentEditor
            segments={segments}
            formats={formats}
            thumbnail={metadata?.thumbnail}
            onAdd={addSegment}
            onRemove={removeSegment}
            onTimeChange={updateSegmentTime}
            onFormatChange={updateSegmentFormat}
          />
          <JobList jobs={jobs} onPoll={(job) => refreshJob(job)} />
        </div>
      </div>
    </main>
  );
}
