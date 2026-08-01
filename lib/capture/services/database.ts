import type {
  CaptureDatabaseService,
  CapturePersistInput,
  CapturePersistResult,
  NormalizedApplication,
  NormalizedProblem
} from "@/lib/capture/types";

/**
 * Persistence boundary for the capture pipeline.
 *
 * Extractors / normalizers / validators must NOT import Prisma.
 * TODO: Implement create/upsert against Application and Problem models,
 * reusing existing progress/API rules (dedupe, activity logging, etc.).
 */
export const captureDatabaseService: CaptureDatabaseService = {
  async persistApplication(
    _userId: string,
    _capture: NormalizedApplication
  ): Promise<CapturePersistResult> {
    // TODO: prisma.application.create / dedupe via applicationDuplicateWhere
    return {
      ok: false,
      error: "Capture persistence is not implemented yet."
    };
  },

  async persistProblem(_userId: string, _capture: NormalizedProblem): Promise<CapturePersistResult> {
    // TODO: prisma.problem.create / upsert by name or slug
    return {
      ok: false,
      error: "Capture persistence is not implemented yet."
    };
  },

  async persist(input: CapturePersistInput): Promise<CapturePersistResult> {
    if (input.capture.kind === "application") {
      return captureDatabaseService.persistApplication(input.userId, input.capture);
    }
    return captureDatabaseService.persistProblem(input.userId, input.capture);
  }
};
