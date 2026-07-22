export type JobImportResult = {
  company: string;
  role: string;
  jobId: string | null;
  location: string | null;
  jobUrl: string;
  description: string | null;
};

/** Partial draft returned by a board-specific importer before normalization. */
export type JobImportDraft = {
  company?: string | null;
  role?: string | null;
  jobId?: string | null;
  location?: string | null;
  jobUrl?: string | null;
  description?: string | null;
};

export type JobImporter = {
  id: string;
  matches: (url: URL) => boolean;
  importJob: (url: URL, html: string | null) => Promise<JobImportDraft | null>;
};

export type JobImportResponse = {
  ok: true;
  job: JobImportResult;
} | {
  ok: false;
  error: string;
};
