import * as fs from "fs";
import * as path from "path";
import { CalendarEvent, TeamsMessage, DailyInput, AchievementLevel, UnderstandingLevel } from "./types";

const CSV_PATH = path.resolve(process.cwd(), "input_data.csv");

function parseLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export interface CsvData {
  events: CalendarEvent[];
  messages: TeamsMessage[];
  dailyInput: DailyInput;
}

/**
 * input_data.csv を読み込む。
 *
 * フォーマット（1行目はヘッダー）:
 *   type,col1,col2,col3
 *   meta,today_goal,{今日の目標},
 *   meta,achievement,{1〜4},      ← 1=達成できなかった 〜 4=達成できた
 *   meta,understanding,{1〜4},    ← 1=理解できなかった 〜 4=理解できた
 *   calendar,{予定名},{開始時刻},{終了時刻}
 *   teams,{タイムスタンプ},{メモ内容},
 */
export function readCsv(): CsvData {
  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(
      `input_data.csv が見つかりません: ${CSV_PATH}\n` +
        "USE_REAL_DATA=false にするかファイルを作成してください。"
    );
  }

  const lines = fs.readFileSync(CSV_PATH, "utf-8").split(/\r?\n/);
  const events: CalendarEvent[] = [];
  const messages: TeamsMessage[] = [];
  const meta: Record<string, string> = {};

  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;

    const [type, col1, col2] = parseLine(line);

    if (type === "meta") {
      meta[col1] = col2;
    } else if (type === "calendar") {
      const [, title, startTime, endTime] = parseLine(line);
      events.push({ title, startTime, endTime });
    } else if (type === "teams") {
      messages.push({ timestamp: col1, text: col2 });
    }
  }

  if (!meta["today_goal"]) {
    throw new Error("input_data.csv に today_goal が設定されていません。");
  }

  const achievementLevel = (Number(meta["achievement"] ?? 3)) as AchievementLevel;
  const understandingLevel = (Number(meta["understanding"] ?? 3)) as UnderstandingLevel;

  return {
    events,
    messages,
    dailyInput: {
      todayGoal: meta["today_goal"],
      achievementLevel,
      understandingLevel,
    },
  };
}
