import { CalendarEvent, TeamsMessage, DailyInput } from "./types";

export const todayEvents: CalendarEvent[] = [
  {
    title: "週次チームMTG",
    startTime: "2026-05-28T10:00:00+09:00",
    endTime: "2026-05-28T11:00:00+09:00",
  },
  {
    title: "新機能レビュー（認証モジュール）",
    startTime: "2026-05-28T14:00:00+09:00",
    endTime: "2026-05-28T15:00:00+09:00",
  },
  {
    title: "1on1（上長）",
    startTime: "2026-05-28T17:00:00+09:00",
    endTime: "2026-05-28T17:30:00+09:00",
  },
];

export const todayMessages: TeamsMessage[] = [
  {
    timestamp: "2026-05-28T09:15:00+09:00",
    text: "認証モジュールのユニットテスト追加。カバレッジ80%→92%に改善。",
  },
  {
    timestamp: "2026-05-28T13:30:00+09:00",
    text: "レビュー指摘のリファクタリング対応完了。PRにコメント返信済み。",
  },
  {
    timestamp: "2026-05-28T16:45:00+09:00",
    text: "明日の仕様確認MTGに向けて要件ドキュメント読み込み。不明点2点をチームチャットに投稿。",
  },
];

export const mockDailyInput: DailyInput = {
  todayGoal: "認証モジュールのユニットテストを追加し、カバレッジ90%以上を達成する",
  achievementLevel: 3,
  understandingLevel: 3,
};
