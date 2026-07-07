export type UserGoalsData = {
  dailyDsaGoal: number;
  dailyApplicationsGoal: number;
  dailyProjectSessionsGoal: number;
};

export const DEFAULT_GOALS: UserGoalsData = {
  dailyDsaGoal: 3,
  dailyApplicationsGoal: 2,
  dailyProjectSessionsGoal: 1
};

export function serializeGoals(goals: UserGoalsData | null) {
  if (!goals) return null;
  return {
    dailyDsaGoal: goals.dailyDsaGoal,
    dailyApplicationsGoal: goals.dailyApplicationsGoal,
    dailyProjectSessionsGoal: goals.dailyProjectSessionsGoal
  };
}
