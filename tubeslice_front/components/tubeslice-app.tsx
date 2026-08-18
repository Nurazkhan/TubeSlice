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
import type { AuthMode, DownloadJob, JobStatus, SegmentDraft, User, VideoFormat, VideoMetadata } from "@/lib/types";

const iconWeight = "regular" as const;
const fallbackFormats: VideoFormat[] = [
  { format_id: "360p", ext: "mp4", resolution: "640x360", note: "360p" },
  { format_id: "480p", ext: "mp4", resolution: "854x480", note: "480p" },
  { format_id: "720p", ext: "mp4", resolution: "1280x720", note: "720p" },
];

const createId = (prefix: string) => {
  const suffix = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`;
  return `${prefix}-${suffix}`;
};

const formatDuration = (seconds?: number) => {
  if (!seconds) return "Duration unavailable";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds.toString().padStart(2, "0")}s`;
};

const formatTimestamp = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const getStatusStyle = (status: JobStatus) => {
  if (status === "Downloaded") return "border-blue-200 bg-blue-50 text-blue-800";
  if (status === "Error" || status === "Failed") return "border-rose-200 bg-rose-50 text-rose-800";
  if (status === "Processing" || status === "Accepted") return "border-zinc-200 bg-white text-zinc-700";
  return "border-zinc-200 bg-zinc-50 text-zinc-500";
};

const getFormatLabel = (format?: VideoFormat) => {
  if (!format) return "Default backend quality";
  const detail = [format.resolution, format.ext.toUpperCase()].filter(Boolean).join(" / ");
  return `${format.note || format.format_id}${detail ? ` - ${detail}` : ""}`;
};

const getFormatPayload = (formats: VideoFormat[], formatId: string, supportsExactFormats: boolean) => {
  const selected = formats.find((format) => format.format_id === formatId);
  if (!selected) return { quality: formatId || "360p" };
  if (!supportsExactFormats) return { quality: selected.note || selected.resolution || selected.format_id };
  return {
    quality: selected.note || selected.resolution || selected.format_id,
    format_id: selected.format_id,
  };
};

const isStoryboardFormat = (format?: VideoFormat) => {
  if (!format) return false;
  return [format.format_id, format.ext, format.resolution, format.note].some((value) => value?.toLowerCase().includes("storyboard"));
};

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
    <label className="grid gap-2 text-sm font-semibold text-zinc-900">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition duration-300 focus:border-blue-700"
      >
        {formats.map((format) => (
          <option key={format.format_id} value={format.format_id}>
            {getFormatLabel(format)}
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
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
      setError(caught instanceof Error ? caught.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (token) {
    return (
      <section className="rounded-[2rem] border border-zinc-200/70 bg-white/88 p-6 shadow-diffusion backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Signed in</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">
              {user ? `${user.first_name} ${user.last_name}` : "Authenticated workspace"}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">{user?.email ?? "Token stored locally for protected endpoints."}</p>
          </div>
          <UserCircle size={28} weight={iconWeight} className="text-zinc-500" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-zinc-500">Role</p>
            <p className="mt-1 font-mono text-zinc-950">{user?.role ?? "token"}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-zinc-500">Backend</p>
            <p className="mt-1 truncate font-mono text-zinc-950">{api.baseUrl}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-800 transition duration-300 hover:bg-zinc-50 active:translate-y-[1px]"
        >
          <SignOut size={18} weight={iconWeight} />
          Sign out
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-zinc-200/70 bg-white/88 p-6 shadow-diffusion backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Account</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">
            {mode === "login" ? "Log in to keep jobs attached" : "Create your TubeSlice account"}
          </h2>
        </div>
        <LockKey size={26} weight={iconWeight} className="text-zinc-500" />
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === "signup" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-zinc-800">
              First name
              <input
                required
                value={form.first_name}
                onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))}
                className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-zinc-800">
              Last name
              <input
                required
                value={form.last_name}
                onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))}
                className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600"
              />
            </label>
          </div>
        ) : null}
        <label className="grid gap-2 text-sm font-medium text-zinc-800">
          Email
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600"
          />
          <span className="text-xs font-normal text-zinc-500">Used only for the backend JWT session.</span>
        </label>
        <label className="grid gap-2 text-sm font-medium text-zinc-800">
          Password
          <input
            required
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600"
          />
        </label>
        {error ? (
          <p className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <WarningCircle size={18} weight={iconWeight} />
            {error}
          </p>
        ) : null}
        <button
          disabled={isLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:bg-zinc-800 active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Working" : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>
      <button
        type="button"
        onClick={() => {
          setMode((current) => (current === "login" ? "signup" : "login"));
          setError("");
        }}
        className="mt-4 text-sm font-semibold text-blue-800 transition hover:text-blue-700"
      >
        {mode === "login" ? "Need an account? Sign up" : "Already registered? Log in"}
      </button>
    </section>
  );
}

function JobRow({ job, onPoll }: { job: DownloadJob; onPoll: (job: DownloadJob) => void }) {
  const readySegments = job.status === "Downloaded" ? job.segments : [];

  return (
    <div className="grid gap-4 border-t border-zinc-200 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="flex min-w-0 gap-3">
        {job.thumbnail ? (
          <img
            src={job.thumbnail}
            alt=""
            className="h-16 w-24 shrink-0 rounded-2xl border border-zinc-200 object-cover"
            loading="lazy"
          />
        ) : null}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(job.status)}`}>{job.status}</span>
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-zinc-500">{job.kind}</span>
          </div>
          <p className="mt-2 truncate text-sm font-semibold text-zinc-950">{job.label}</p>
          <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{job.message ?? job.id}</p>
          {job.rangeLabel ? <p className="mt-1 font-mono text-xs text-zinc-700">{job.rangeLabel}</p> : null}
          {job.formatLabel ? <p className="mt-1 font-mono text-xs text-zinc-500">{job.formatLabel}</p> : null}
          {readySegments.length > 1 ? (
            <p className="mt-1 font-mono text-xs text-zinc-500">{readySegments.length} MP4 segments ready</p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        <button
          type="button"
          onClick={() => onPoll(job)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition duration-300 hover:bg-zinc-50 active:translate-y-[1px]"
        >
          <Clock size={17} weight={iconWeight} />
          Check
        </button>
        {readySegments.map((segment, index) => (
          <a
            key={segment.id}
            href={api.downloadUrl(segment.id)}
            download={`${segment.id}.mp4`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition duration-300 hover:bg-blue-800 active:translate-y-[1px]"
          >
            <ArrowDown size={17} weight={iconWeight} />
            {readySegments.length > 1 ? `Clip ${index + 1}` : "Save"}
          </a>
        ))}
      </div>
    </div>
  );
}

export default function TubeSliceApp() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [url, setUrl] = useState("");
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [segments, setSegments] = useState<SegmentDraft[]>([
    { localId: createId("clip"), start_time: 0, end_time: 30, format: "mp4", quality: "360p", format_id: "360p" },
  ]);
  const [fullFormatId, setFullFormatId] = useState("360p");
  const [jobs, setJobs] = useState<DownloadJob[]>([]);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    const savedToken = window.localStorage.getItem("tubeslice_token");
    if (savedToken) {
      setToken(savedToken);
      api.dashboard(savedToken).catch(() => window.localStorage.removeItem("tubeslice_token"));
    }
  }, []);

  const hasUrl = useMemo(() => url.trim().length > 8, [url]);
  const availableFormats = useMemo(() => {
    const formats = metadata?.formats?.filter((format) => format.format_id) ?? [];
    return formats.length > 0 ? formats : fallbackFormats;
  }, [metadata]);
  const segmentFormats = useMemo(() => {
    const formats = availableFormats.filter((format) => !isStoryboardFormat(format));
    return formats.length > 0 ? formats : fallbackFormats;
  }, [availableFormats]);
  const supportsExactFormats = Boolean(metadata?.formats?.some((format) => format.format_id));

  const showError = (message: string) => {
    setError(message);
    setToast(message);
  };

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => setToast(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

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
      const nextFormats = result.formats?.filter((format) => format.format_id) ?? [];
      const nextFormatId = nextFormats[0]?.format_id ?? "360p";
      const nextSegmentFormats = nextFormats.filter((format) => !isStoryboardFormat(format));
      const nextSegmentFormat = nextSegmentFormats[0] ?? fallbackFormats[0];
      setMetadata(result);
      setFullFormatId(nextFormatId);
      setSegments((current) =>
        current.map((segment) => ({
          ...segment,
          quality: nextSegmentFormat.note || nextSegmentFormat.resolution || "360p",
          format_id: nextSegmentFormat.format_id,
        })),
      );
      setNotice("Video metadata loaded from the backend.");
    } catch (caught) {
      showError(caught instanceof Error ? caught.message : "Could not inspect this URL");
    } finally {
      setIsInspecting(false);
    }
  };

  const queueDownload = async () => {
    setIsSubmitting(true);
    setError("");
    setNotice("");

    try {
      const payload = getFormatPayload(availableFormats, fullFormatId, supportsExactFormats);
      const selectedFormat = availableFormats.find((format) => format.format_id === fullFormatId);
      const result = await api.slice({ url: url.trim(), ...payload }, token);
      setJobs((current) => [
        {
          id: result.id,
          kind: "task",
          status: result.status,
          label: result.title || metadata?.title || "Full video download",
          message: `Queued full video. Polling /status/${result.id}.`,
          segments: result.segments,
          thumbnail: metadata?.thumbnail,
          formatLabel: getFormatLabel(selectedFormat),
          rangeLabel: metadata?.duration ? `Full video: 0:00 to ${formatTimestamp(metadata.duration)}` : "Full video",
        },
        ...current,
      ]);
      setNotice("Full video request accepted by the backend.");
    } catch (caught) {
      showError(caught instanceof Error ? caught.message : "Download request failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const queueSegments = async () => {
    setIsSubmitting(true);
    setError("");
    setNotice("");

    try {
      const storyboardSegment = segments.find((segment) =>
        isStoryboardFormat(availableFormats.find((format) => format.format_id === (segment.format_id || segment.quality))),
      );

      if (storyboardSegment) {
        throw new Error("Storyboard formats cannot be used for segment downloads.");
      }

      const results = await Promise.all(
        segments.map((segment) => {
          const payload = getFormatPayload(availableFormats, segment.format_id || segment.quality, supportsExactFormats);
          return api.slice(
            {
              url: url.trim(),
              ...payload,
              segments: [{ start_time: segment.start_time, end_time: segment.end_time }],
            },
            token,
          );
        }),
      );

      setJobs((current) => [
        ...results.map((result, index) => {
          const segment = segments[index];
          const selectedFormat = availableFormats.find((format) => format.format_id === (segment.format_id || segment.quality));
          return {
            id: result.id,
            kind: "task" as const,
            status: result.status,
            label: result.title || metadata?.title || `Clip ${index + 1}`,
            message: `Clip ${index + 1}: ${segment.start_time}s to ${segment.end_time}s.`,
            segments: result.segments,
            thumbnail: metadata?.thumbnail,
            formatLabel: getFormatLabel(selectedFormat),
            rangeLabel: `Range: ${formatTimestamp(segment.start_time)} to ${formatTimestamp(segment.end_time)}`,
          };
        }),
        ...current,
      ]);
      setNotice(`${results.length} segment request${results.length === 1 ? "" : "s"} accepted by the backend.`);
    } catch (caught) {
      showError(caught instanceof Error ? caught.message : "Segment request failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pollJob = async (job: DownloadJob) => {
    setError("");
    setJobs((current) =>
      current.map((item) => (item.id === job.id ? { ...item, status: "Processing", message: "Downloading..." } : item)),
    );

    try {
      const result = await api.status(job.id, token);
      setJobs((current) =>
        current.map((item) =>
          item.id === job.id
            ? {
                ...item,
                status: result.status,
                label: result.title || item.label,
                segments: result.segments,
                message:
                  result.status === "Downloaded"
                    ? "Ready. Use the segment download link from /download/{segment_id}."
                    : result.status === "Failed"
                      ? "Backend marked this task as failed."
                      : `Current backend status: ${result.status}.`,
              }
            : item,
        ),
      );
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Polling failed";
      setJobs((current) =>
        current.map((item) =>
          item.id === job.id ? { ...item, status: "Error", message } : item,
        ),
      );
      showError(message);
    }
  };

  useEffect(() => {
    const activeJobs = jobs.filter((job) => job.status === "Accepted" || job.status === "Processing");
    if (activeJobs.length === 0) return;

    const interval = window.setInterval(() => {
      activeJobs.forEach((job) => {
        api
          .status(job.id, token)
          .then((result) => {
            setJobs((current) =>
              current.map((item) =>
                item.id === job.id
                  ? {
                      ...item,
                      status: result.status,
                      label: result.title || item.label,
                      segments: result.segments,
                      message:
                        result.status === "Downloaded"
                          ? "Ready. Use the segment download link from /download/{segment_id}."
                          : result.status === "Failed"
                            ? "Backend marked this task as failed."
                            : `Current backend status: ${result.status}.`,
                    }
                  : item,
              ),
            );
          })
          .catch((caught) => {
            const message = caught instanceof Error ? caught.message : "Polling failed";
            setJobs((current) =>
              current.map((item) =>
                item.id === job.id
                  ? { ...item, status: "Error", message }
                  : item,
              ),
            );
            showError(message);
          });
      });
    }, 2000);

    return () => window.clearInterval(interval);
  }, [jobs, token]);

  const updateSegment = (localId: string, key: "start_time" | "end_time", value: number) => {
    setSegments((current) =>
      current.map((segment) => (segment.localId === localId ? { ...segment, [key]: Math.max(0, value) } : segment)),
    );
  };

  const updateSegmentFormat = (localId: string, formatId: string) => {
    const selectedFormat = segmentFormats.find((format) => format.format_id === formatId);
    setSegments((current) =>
      current.map((segment) =>
        segment.localId === localId
          ? {
              ...segment,
              format_id: formatId,
              quality: selectedFormat?.note || selectedFormat?.resolution || formatId,
            }
          : segment,
      ),
    );
  };

  return (
    <main className="relative min-h-[100dvh] overflow-hidden px-4 py-5 text-zinc-950 sm:px-6 lg:px-8">
      <div className="surface-grid pointer-events-none absolute inset-0" />
      {toast ? (
        <div className="fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm text-rose-800 shadow-diffusion">
          <WarningCircle size={18} weight={iconWeight} className="mt-0.5 shrink-0" />
          <span>{toast}</span>
        </div>
      ) : null}

      <div className="relative mx-auto max-w-[1400px]">
        <nav className="flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <Image src="/logo_without_background.png" alt="TubeSlice logotype" width={78} height={49} priority />
            <div>
              <p className="text-base font-semibold tracking-tight">TubeSlice</p>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-zinc-500">Download desk</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-4 py-2 text-sm text-zinc-600 shadow-sm backdrop-blur sm:flex">
            <span className="relative flex size-2 rounded-full bg-blue-700">
              <span className="pulse-dot absolute inset-0 rounded-full bg-red-500" />
            </span>
            API {api.baseUrl}
          </div>
        </nav>

        <section className="grid min-h-[calc(100dvh-92px)] grid-cols-1 gap-8 py-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)] lg:items-center lg:py-12">
          <div className="max-w-4xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/86 px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm backdrop-blur">
              <Scissors size={17} weight={iconWeight} className="text-red-700" />
              Full downloads and timestamp clips
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-none tracking-tighter text-zinc-950 md:text-6xl">
              Paste a video URL. Choose the slice you actually need.
            </h1>
            <p className="mt-6 max-w-[65ch] text-base leading-relaxed text-zinc-600">
              TubeSlice connects to the FastAPI backend for account sessions, video inspection, slicing tasks, status
              polling, and direct MP4 delivery. The current workflow is narrow by design and ready for format, batch,
              billing, and role modules.
            </p>

            <section className="mt-8 rounded-[2.25rem] border border-zinc-200/70 bg-white/92 p-5 shadow-diffusion backdrop-blur sm:p-7">
              <div className="grid gap-5">
                <label className="grid gap-2 text-sm font-semibold text-zinc-900">
                  Video URL
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <div className="relative">
                      <LinkSimple size={19} weight={iconWeight} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        value={url}
                        onChange={(event) => setUrl(event.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-4 pl-12 pr-4 text-base outline-none transition duration-300 placeholder:text-zinc-400 focus:border-blue-700 focus:bg-white"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!hasUrl || isInspecting}
                      onClick={inspectVideo}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-6 py-4 text-sm font-semibold text-white transition duration-300 hover:bg-zinc-800 active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FilmSlate size={18} weight={iconWeight} />
                      {isInspecting ? "Inspecting" : "Inspect"}
                    </button>
                  </div>
                  <span className="text-xs font-normal text-zinc-500">Calls `POST /info` before queueing work.</span>
                </label>

                {isInspecting ? (
                  <div className="grid gap-3 rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
                    <div className="h-5 w-2/3 rounded-full shimmer" />
                    <div className="h-4 w-1/2 rounded-full shimmer" />
                    <div className="h-4 w-5/6 rounded-full shimmer" />
                  </div>
                ) : metadata ? (
                  <div className="grid gap-4 rounded-3xl border border-zinc-200 bg-zinc-50 p-4 sm:grid-cols-[160px_1fr_auto] sm:p-5">
                    {metadata.thumbnail ? (
                      <img
                        src={metadata.thumbnail}
                        alt=""
                        className="aspect-video w-full rounded-2xl border border-zinc-200 object-cover sm:w-40"
                        loading="lazy"
                      />
                    ) : null}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Video loaded</p>
                      <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">
                        {metadata.title ?? "Metadata received"}
                      </h2>
                      <p className="mt-1 text-sm text-zinc-600">
                        {metadata.uploader ?? "Uploader unavailable"} - {formatDuration(metadata.duration)}
                      </p>
                      {metadata.thumbnail ? <p className="mt-2 truncate font-mono text-xs text-zinc-500">{metadata.thumbnail}</p> : null}
                      {metadata.raw ? <p className="mt-2 line-clamp-2 font-mono text-xs text-zinc-500">{metadata.raw}</p> : null}
                    </div>
                    <CheckCircle size={31} weight={iconWeight} className="text-blue-700" />
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-500">
                    Inspect a URL to preview title, duration, and uploader before creating a backend job.
                  </div>
                )}

                {notice ? <p className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">{notice}</p> : null}
                {error ? (
                  <p className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                    <WarningCircle size={18} weight={iconWeight} />
                    {error}
                  </p>
                ) : null}

                <div className="grid gap-4 rounded-3xl border border-zinc-200 bg-white p-4">
                  <FormatSelect label="Full video format" value={fullFormatId} formats={availableFormats} onChange={setFullFormatId} />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Available formats</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {availableFormats.map((format) => (
                        <span key={format.format_id} className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-700">
                          {getFormatLabel(format)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={!hasUrl || isSubmitting}
                    onClick={queueDownload}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 py-4 text-sm font-semibold text-white transition duration-300 hover:bg-blue-800 active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowDown size={18} weight={iconWeight} />
                    Queue full download
                  </button>
                  <button
                    type="button"
                    disabled={!hasUrl || isSubmitting || segments.length === 0}
                    onClick={queueSegments}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-300 bg-white px-5 py-4 text-sm font-semibold text-zinc-900 transition duration-300 hover:bg-zinc-50 active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Scissors size={18} weight={iconWeight} />
                    Queue selected segments
                  </button>
                </div>
              </div>
            </section>
          </div>

          <div className="grid gap-5 lg:translate-y-8">
            <AuthPanel user={user} token={token} onAuthenticated={authenticate} onLogout={logout} />
            <section className="float-slow rounded-[2rem] border border-zinc-200/70 bg-white/88 p-6 shadow-diffusion backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-700">Roadmap slots</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">Built for expansion</h2>
                </div>
                <FilmSlate size={27} weight={iconWeight} className="text-zinc-500" />
              </div>
              <div className="mt-5 grid gap-3 text-sm text-zinc-600">
                {["Quality and format selectors", "Multiple clips per request", "Payment plans and subscriptions", "Role based access controls"].map(
                  (item) => (
                    <div key={item} className="flex items-center gap-3 border-t border-zinc-200 pt-3">
                      <span className="size-2 rounded-full bg-red-600" />
                      {item}
                    </div>
                  ),
                )}
              </div>
            </section>
          </div>
        </section>

        <section className="grid gap-8 pb-14 lg:grid-cols-[minmax(340px,0.7fr)_minmax(0,1.3fr)]">
          <div className="min-w-0 rounded-[2rem] border border-zinc-200/70 bg-white/90 p-5 shadow-diffusion sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Segments</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Choose timestamps</h2>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSegments((current) => [
                    ...current,
                    {
                      localId: createId("clip"),
                      start_time: current.length * 30,
                      end_time: current.length * 30 + 30,
                      format: "mp4",
                      quality: segmentFormats[0]?.note || segmentFormats[0]?.resolution || "360p",
                      format_id: segmentFormats[0]?.format_id || "360p",
                    },
                  ])
                }
                className="inline-flex size-11 items-center justify-center rounded-2xl bg-zinc-950 text-white transition duration-300 hover:bg-zinc-800 active:translate-y-[1px]"
                aria-label="Add segment"
              >
                <Plus size={19} weight={iconWeight} />
              </button>
            </div>

            <div className="mt-5 grid min-w-0 gap-4">
              {segments.map((segment, index) => (
                <div key={segment.localId} className="min-w-0 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {metadata?.thumbnail ? (
                        <img
                          src={metadata.thumbnail}
                          alt=""
                          className="h-12 w-[72px] shrink-0 rounded-xl border border-zinc-200 object-cover"
                          loading="lazy"
                        />
                      ) : null}
                      <div className="min-w-0">
                        <p className="font-mono text-xs uppercase tracking-[0.16em] text-zinc-500">Clip {index + 1}</p>
                        {metadata?.thumbnail ? (
                          <p className="mt-1 hidden truncate font-mono text-[11px] text-zinc-400 sm:block">{metadata.thumbnail}</p>
                        ) : null}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSegments((current) => current.filter((item) => item.localId !== segment.localId))}
                      className="inline-flex size-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition hover:text-rose-700 active:translate-y-[1px]"
                      aria-label={`Remove clip ${index + 1}`}
                    >
                      <Trash size={16} weight={iconWeight} />
                    </button>
                  </div>
                  <div className="mb-3 min-w-0">
                    <FormatSelect
                      label="Segment format"
                      value={segment.format_id || segment.quality}
                      formats={segmentFormats}
                      onChange={(value) => updateSegmentFormat(segment.localId, value)}
                    />
                  </div>
                  <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="grid gap-2 text-sm font-medium text-zinc-800">
                      Start
                      <input
                        type="number"
                        min={0}
                        value={segment.start_time}
                        onChange={(event) => updateSegment(segment.localId, "start_time", Number(event.target.value))}
                        className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 font-mono text-sm outline-none focus:border-blue-700"
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-zinc-800">
                      End
                      <input
                        type="number"
                        min={segment.start_time + 1}
                        value={segment.end_time}
                        onChange={(event) => updateSegment(segment.localId, "end_time", Number(event.target.value))}
                        className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 font-mono text-sm outline-none focus:border-blue-700"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-200/70 bg-white/90 p-6 shadow-diffusion">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-700">Jobs</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Download queue</h2>
              </div>
              <p className="font-mono text-sm text-zinc-500">{jobs.length} active records</p>
            </div>

            <div className="mt-5">
              {jobs.length === 0 ? (
                <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
                  <div>
                    <FilmSlate size={36} weight={iconWeight} className="mx-auto text-zinc-400" />
                    <h3 className="mt-4 text-lg font-semibold tracking-tight text-zinc-950">No queued downloads yet</h3>
                    <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                      Inspect a URL, then queue a full file or selected segments. Processing status appears here and ready
                      files become local save links.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  {jobs.map((job) => (
                    <JobRow key={job.id} job={job} onPoll={pollJob} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
