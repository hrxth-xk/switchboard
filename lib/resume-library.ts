import type { ResumeVersion } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  deleteResumeFile,
  resumeLibraryObjectPath,
  resumeOneOffObjectPath,
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
  oneOff: boolean;
  /** Only present when the resume was loaded with application counts. */
  applicationCount?: number;
};

type ResumeVersionWithCount = ResumeVersion & { _count?: { applications: number } };

/** Per-application files promoted during the V3.1 migration — not library templates. */
export function isLegacyMigratedResume(id: string) {
  return id.startsWith("migrated_");
}

export const ONE_OFF_RESUME_LABEL = "Custom resume · this application only";

export function resumeVersionLabel(resume: Pick<ResumeVersion, "name" | "version">) {
  return `${resume.name} v${resume.version}`;
}

/** One-offs have no meaningful version, so name them by what they are. */
export function resumeDisplayLabel(resume: Pick<ResumeVersion, "name" | "version" | "oneOff">) {
  return resume.oneOff ? ONE_OFF_RESUME_LABEL : resumeVersionLabel(resume);
}

export function serializeResumeVersion(resume: ResumeVersionWithCount): ResumeVersionRow {
  return {
    id: resume.id,
    name: resume.name,
    version: resume.version,
    originalFileName: resume.originalFileName,
    archived: resume.archived,
    createdAt: resume.createdAt.toISOString(),
    updatedAt: resume.updatedAt.toISOString(),
    uploadedLabel: formatResumeUploadedAt(resume.createdAt),
    label: resumeDisplayLabel(resume),
    oneOff: resume.oneOff,
    ...(resume._count ? { applicationCount: resume._count.applications } : {})
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
      // Version numbers only advance within the intentional library, not migrated app
      // files or one-offs tied to a single application.
      oneOff: false,
      NOT: { id: { startsWith: "migrated_" } }
    },
    orderBy: { version: "desc" },
    select: { version: true }
  });
  return (latest?.version ?? 0) + 1;
}

export async function createResumeVersion(
  userId: string,
  file: File,
  name?: string,
  options?: { oneOff?: boolean }
) {
  const validationError = validateResumeFile(file);
  if (validationError) throw new Error(validationError);

  const oneOff = options?.oneOff === true;
  const resumeName = (name?.trim() || defaultResumeNameFromFile(file.name)).slice(0, 80);
  // A one-off belongs to one application, so it never joins a version sequence.
  const version = oneOff ? 1 : await nextResumeVersion(userId, resumeName);

  const pending = await prisma.resumeVersion.create({
    data: {
      userId,
      name: resumeName,
      version,
      oneOff,
      storagePath: "pending",
      originalFileName: file.name
    }
  });

  const storagePath = oneOff
    ? resumeOneOffObjectPath(userId, pending.id, file.name)
    : resumeLibraryObjectPath(userId, pending.id, file.name);

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

type ListResumeOptions = { includeArchived?: boolean; includeLegacyMigrated?: boolean };

function resumeLibraryWhere(userId: string, options?: ListResumeOptions) {
  return {
    userId,
    // Resumes tailored to a single application are never library templates.
    oneOff: false,
    ...(options?.includeArchived ? {} : { archived: false }),
    // Hide per-application uploads that were backfilled into ResumeVersion.
    ...(options?.includeLegacyMigrated ? {} : { NOT: { id: { startsWith: "migrated_" } } })
  };
}

const RESUME_LIBRARY_ORDER = [{ name: "asc" as const }, { version: "desc" as const }];

export async function listResumeVersions(userId: string, options?: ListResumeOptions) {
  return prisma.resumeVersion.findMany({
    where: resumeLibraryWhere(userId, options),
    orderBy: RESUME_LIBRARY_ORDER
  });
}

/** Same list, plus how many applications each version is attached to. */
export async function listResumeVersionsWithApplicationCounts(
  userId: string,
  options?: ListResumeOptions
) {
  return prisma.resumeVersion.findMany({
    where: resumeLibraryWhere(userId, options),
    orderBy: RESUME_LIBRARY_ORDER,
    include: { _count: { select: { applications: true } } }
  });
}

/**
 * Discard a one-off resume once its application no longer points at it — the row
 * and the stored file both go, since nothing else can ever reach them.
 * No-op for library versions.
 */
export async function deleteOneOffResume(resumeVersionId: string | null | undefined) {
  if (!resumeVersionId) return;

  const resume = await prisma.resumeVersion.findUnique({ where: { id: resumeVersionId } });
  if (!resume?.oneOff) return;

  await prisma.resumeVersion.delete({ where: { id: resume.id } }).catch(() => undefined);
  await deleteResumeFile(resume.storagePath);
}

/**
 * A one-off may only ever be attached to the application it was uploaded for.
 * Returns an error message when the attachment should be refused.
 */
export async function oneOffAttachError(
  resume: Pick<ResumeVersion, "id" | "oneOff">,
  applicationId?: string
) {
  if (!resume.oneOff) return null;

  const holder = await prisma.application.findFirst({
    where: { resumeVersionId: resume.id, ...(applicationId ? { NOT: { id: applicationId } } : {}) },
    select: { company: true }
  });

  return holder
    ? `That custom resume is already used by your ${holder.company} application.`
    : null;
}

/** One version with every application sent using it, newest first. */
export async function getResumeVersionWithApplications(userId: string, id: string) {
  return prisma.resumeVersion.findFirst({
    where: { id, userId },
    include: {
      applications: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }]
      }
    }
  });
}
