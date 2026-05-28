export interface CalendarEvent {
  title: string;
  startTime: string;
  endTime: string;
}

export interface TeamsMessage {
  timestamp: string;
  text: string;
}

export interface DailyReportHistory {
  date: string;
  reportText: string;
}

export type AchievementLevel = 1 | 2 | 3 | 4;
export type UnderstandingLevel = 1 | 2 | 3 | 4;

export interface DailyInput {
  todayGoal: string;
  achievementLevel: AchievementLevel;
  understandingLevel: UnderstandingLevel;
}

export const ACHIEVEMENT_LABELS: Record<AchievementLevel, string> = {
  1: "達成できなかった",
  2: "あまり達成できなかった",
  3: "概ね達成できた",
  4: "達成できた",
};

export const UNDERSTANDING_LABELS: Record<UnderstandingLevel, string> = {
  1: "理解できなかった",
  2: "あまり理解できなかった",
  3: "概ね理解できた",
  4: "理解できた",
};

export interface ReportHints {
  impression: string;
  reason: string;
  difficulty: string;
  tomorrowGoal: string;
}
