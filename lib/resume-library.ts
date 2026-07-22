import type { ResumeVersion } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  deleteResumeFile,
  resumeLibraryObjectPath,
  uploadResumeToPath,
  validateResumeFile
} from "@/lib/resume-storage";
import { formatResumeUploadedAt } from "@/lib/resume-utils";

export type ResumeVersionRow = {
  id: string;
  name: string;
  version: number;
  originalFileName: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  uploadedLabel: string | null;
  label: string;
};

/** Per-application files promoted during the V3.1 migration — not library templates. */
export function isLegacyMigratedResume(id: string) {
  return id.startsWith("migrated_");
}

export function resumeVersionLabel(resume: Pick<ResumeVersion, "name" | "version">) {
  return `${resume.name} v${resume.version}`;
}

export function serializeResumeVersion(resume: ResumeVersion): ResumeVersionRow {
  return {
    id: resume.id,
    name: resume.name,
    version: resume.version,
    originalFileName: resume.originalFileName,
    archived: resume.archived,
    createdAt: resume.createdAt.toISOString(),
    updatedAt: resume.updatedAt.toISOString(),
    uploadedLabel: formatResumeUploadedAt(resume.createdAt),
    label: resumeVersionLabel(resume)
  };
}

export function defaultResumeNameFromFile(fileName: string) {
  const base = fileName.replace(/\.[^.]+$/, "").trim();
  return base || "Resume";
}

export async function nextResumeVersion(userId: string, name: string) {
  const latest = await prisma.resumeVersion.findFirst({
    where: {
      userId,
      name,
      // Version numbers only advance within the intentional library, not migrated app files.
      NOT: { id: { startsWith: "migrated_" } }
    },
    orderBy: { version: "desc" },
    select: { version: true }
  });
  return (latest?.version ?? 0) + 1;
}

export async function createResumeVersion(userId: string, file: File, name?: string) {
  const validationError = validateResumeFile(file);
  if (validationError) throw new Error(validationError);

  const resumeName = (name?.trim() || defaultResumeNameFromFile(file.name)).slice(0, 80);
  const version = await nextResumeVersion(userId, resumeName);

  const pending = await prisma.resumeVersion.create({
    data: {
      userId,
      name: resumeName,
      version,
      storagePath: "pending",
      originalFileName: file.name
    }
  });

  const storagePath = resumeLibraryObjectPath(userId, pending.id, file.name);

  try {
    await uploadResumeToPath(storagePath, file);
    return await prisma.resumeVersion.update({
      where: { id: pending.id },
      data: { storagePath }
    });
  } catch (error) {
    await prisma.resumeVersion.delete({ where: { id: pending.id } }).catch(() => undefined);
    await deleteResumeFile(storagePath);
    throw error;
  }
}

export async function listResumeVersions(
  userId: string,
  options?: { includeArchived?: boolean; includeLegacyMigrated?: boolean }
) {
  return prisma.resumeVersion.findMany({
    where: {
      userId,
      ...(options?.includeArchived ? {} : { archived: false }),
      // Hide one-off application uploads that were backfilled into ResumeVersion.
      ...(options?.includeLegacyMigrated ? {} : { NOT: { id: { startsWith: "migrated_" } } })
    },
    orderBy: [{ name: "asc" }, { version: "desc" }]
  });
}
