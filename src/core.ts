import { CalendarEvent, TeamsMessage, DailyInput, ReportHints } from "./types";
import { loadHistory, saveReport } from "./historyStore";
import { buildPrompt } from "./promptBuilder";
import { generateReport } from "./llmClient";

export async function generateDailyReport(
  events: CalendarEvent[],
  messages: TeamsMessage[],
  dailyInput: DailyInput,
  employeeName: string,
  today: string,
  hints?: ReportHints,
  referenceText?: string,
): Promise<string> {
  const history = loadHistory();
  const prompt = buildPrompt(today, events, messages, dailyInput, history, employeeName, hints, referenceText);
  const reportText = await generateReport(prompt);
  saveReport({ date: today, reportText });
  return reportText;
}
