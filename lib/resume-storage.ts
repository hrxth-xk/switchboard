import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { resumeFileExtension } from "@/lib/resume-utils";

export const RESUME_BUCKET = "resumes";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".pdf", ".doc", ".docx"]);

export function resumeObjectPath(userId: string, applicationId: string, fileName: string) {
  const extension = resumeFileExtension(fileName) || ".pdf";
  return `${userId}/${applicationId}/resume${extension}`;
}

export function resumeContentType(fileName: string) {
  const extension = resumeFileExtension(fileName);
  if (extension === ".pdf") return "application/pdf";
  if (extension === ".doc") return "application/msword";
  if (extension === ".docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return "application/octet-stream";
}

export function validateResumeFile(file: File) {
  const extension = resumeFileExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return "Upload a PDF or Word resume (.pdf, .doc, .docx).";
  }
  if (file.size > MAX_BYTES) {
    return "Resume must be 5 MB or smaller.";
  }
  return null;
}

export async function saveResumeFile(userId: string, applicationId: string, file: File) {
  const error = validateResumeFile(file);
  if (error) throw new Error(error);

  const storagePath = resumeObjectPath(userId, applicationId, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  const supabase = getSupabaseAdmin();

  const { error: uploadError } = await supabase.storage.from(RESUME_BUCKET).upload(storagePath, buffer, {
    contentType: resumeContentType(file.name),
    upsert: true
  });

  if (uploadError) {
    throw new Error(uploadError.message || "Could not upload resume.");
  }

  return {
    resumeFileName: file.name,
    resumeStoragePath: storagePath,
    resumeFileSize: file.size,
    resumeUploadedAt: new Date()
  };
}

export async function readResumeFile(storagePath: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage.from(RESUME_BUCKET).download(storagePath);

  if (error || !data) {
    throw new Error("Resume file not found.");
  }

  return Buffer.from(await data.arrayBuffer());
}

export async function deleteResumeFile(storagePath: string | null | undefined) {
  if (!storagePath) return;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(RESUME_BUCKET).remove([storagePath]);

  if (error) {
    // File may already be gone.
    console.warn(`Could not delete resume at ${storagePath}:`, error.message);
  }
}
