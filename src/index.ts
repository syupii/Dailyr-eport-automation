import * as dotenv from "dotenv";
import { CalendarEvent, TeamsMessage, DailyInput } from "./types";
import { todayEvents as mockEvents, todayMessages as mockMessages, mockDailyInput } from "./mockData";
import { readCsv } from "./csvReader";
import { generateDailyReport } from "./core";

dotenv.config();

const USE_REAL_DATA = process.env.USE_REAL_DATA === "true";
const TODAY = new Date().toISOString().slice(0, 10);

function fetchTodayData(): { events: CalendarEvent[]; messages: TeamsMessage[]; dailyInput: DailyInput } {
  if (USE_REAL_DATA) {
    console.log("[main] input_data.csv からデータを読み込み中...");
    const { events, messages, dailyInput } = readCsv();
    return { events, messages, dailyInput };
  }

  console.log("[main] モックデータを使用します（USE_REAL_DATA=true で CSV に切り替え可能）");
  return { events: mockEvents, messages: mockMessages, dailyInput: mockDailyInput };
}

async function main(): Promise<void> {
  console.log("=== 日報自動化 ===\n");

  const employeeName = process.env.EMPLOYEE_NAME ?? "（未設定）";
  const { events, messages, dailyInput } = fetchTodayData();

  console.log(`[main] 予定: ${events.length} 件 / メモ: ${messages.length} 件`);
  console.log(`[main] 今日の目標: ${dailyInput.todayGoal}\n`);
  console.log("[main] Groq API に日報生成をリクエスト中...\n");

  const reportText = await generateDailyReport(events, messages, dailyInput, employeeName, TODAY);

  console.log("=== 生成された日報 ===\n");
  console.log(reportText);
  console.log("\n=== 生成完了 ===");
  console.log(`\n[main] 日報を history.json に保存しました（日付: ${TODAY}）`);
}

main().catch((err) => {
  console.error("[エラー]", err.message);
  process.exit(1);
});
