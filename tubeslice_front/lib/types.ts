export type UserRole = "user" | "admin" | "owner" | string;

export type User = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
};

export type AuthMode = "login" | "signup";

export type VideoMetadata = {
  title: string;
  duration: number;
  uploader: string;
  youtube_url: string;
  thumbnail?: string;
  formats?: VideoFormat[];
  raw?: string;
};

export type VideoFormat = {
  format_id: string;
  ext: string;
  resolution: string;
  note?: string;
};

export type SegmentDraft = {
  localId: string;
  start_time: number;
  end_time: number;
  format: "mp4";
  quality: string;
  format_id?: string;
};

export type SliceSegment = {
  id: string;
  download_id: string;
  start_time: number;
  end_time: number;
  status: JobStatus;
  format: string;
  createdAt: number;
};

export type SliceTask = {
  id: string;
  title: string;
  duration: number;
  uploader: string;
  youtube_url: string;
  status: JobStatus;
  createdAt: number;
  segments: SliceSegment[];
};

export type JobKind = "task";

export type JobStatus = "Idle" | "Accepted" | "Processing" | "Downloaded" | "Failed" | "Error";

export type DownloadJob = {
  id: string;
  kind: JobKind;
  status: JobStatus;
  label: string;
  message?: string;
  segments: SliceSegment[];
  downloadUrl?: string;
  thumbnail?: string;
  formatLabel?: string;
  rangeLabel?: string;
};

export type ApiErrorPayload = {
  message: string;
  status?: number;
};
