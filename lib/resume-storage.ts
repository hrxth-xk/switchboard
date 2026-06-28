import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { resumeFileExtension } from "@/lib/resume-utils";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads", "resumes");
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".pdf", ".doc", ".docx"]);

export function resumeStoragePath(userId: string, applicationId: string, fileName: string) {
  const safeName = fileName.replace(/[^\w.\-()+\s]/g, "_");
  return path.join(userId, applicationId, safeName);
}

export function absoluteResumePath(relativePath: string) {
  return path.join(UPLOAD_ROOT, relativePath);
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

  const relativePath = resumeStoragePath(userId, applicationId, file.name);
  const absolutePath = absoluteResumePath(relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);

  return {
    resumeFileName: file.name,
    resumeFilePath: relativePath.replace(/\\/g, "/"),
    resumeFileSize: file.size,
    resumeUploadedAt: new Date()
  };
}

export async function deleteResumeFile(relativePath: string | null | undefined) {
  if (!relativePath) return;
  try {
    await unlink(absoluteResumePath(relativePath));
  } catch {
    // File may already be gone.
  }
}
