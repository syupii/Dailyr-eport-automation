import express, { NextFunction, Request, Response } from "express";
import * as path from "path";
import * as dotenv from "dotenv";
import multer from "multer";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const openBrowser = (require("open").default ?? require("open")) as (url: string) => Promise<void>;
import { CalendarEvent, TeamsMessage, DailyInput, ReportHints, AchievementLevel, UnderstandingLevel } from "./types";
import { generateDailyReport } from "./core";
import { generateReportStream } from "./llmClient";
import { buildPrompt } from "./promptBuilder";
import { loadHistory, saveReport } from "./historyStore";

dotenv.config();

const app = express();
const PORT = 8080;
const VALID_LEVELS = [1, 2, 3, 4];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
});

app.use(express.static(path.join(process.cwd(), "public")));

interface EventInput { title: string; startTime: string; endTime: string; }

function toISO(time: string, today: string): string {
  return `${today}T${time}:00+09:00`;
}

function toValidLevel<T extends number>(value: unknown, fallback: T): T {
  const n = Number(value);
  return (VALID_LEVELS.includes(n) ? n : fallback) as T;
}

async function extractFileText(file: Express.Multer.File): Promise<string> {
  const isPdf = file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");
  const isText = file.mimetype.startsWith("text/") || /\.(txt|md|csv|json|log)$/i.test(file.originalname);
  if (isPdf) { const d = await pdfParse(file.buffer); return d.text.trim(); }
  if (isText) return file.buffer.toString("utf-8").trim();
  return "";
}

function parseFormBody(body: Record<string, string>, files: Express.Multer.File[], today: string) {
  const todayGoal = (body.todayGoal ?? "").trim();
  const employeeName = process.env.EMPLOYEE_NAME ?? "（未設定）";
  const rawEvents: EventInput[] = JSON.parse(body.events || "[]");
  const rawMemos: string[] = JSON.parse(body.memos || "[]");

  const events: CalendarEvent[] = rawEvents
    .filter((e) => e.title && e.startTime && e.endTime)
    .map((e) => ({ title: e.title, startTime: toISO(e.startTime, today), endTime: toISO(e.endTime, today) }));

  const messages: TeamsMessage[] = rawMemos
    .filter((m) => m.trim() !== "")
    .map((text, i) => ({ timestamp: toISO(`${String(9 + i).padStart(2, "0")}:00`, today), text }));

  const dailyInput: DailyInput = {
    todayGoal,
    achievementLevel: toValidLevel<AchievementLevel>(body.achievementLevel, 3),
    understandingLevel: toValidLevel<UnderstandingLevel>(body.understandingLevel, 3),
  };

  const hints: ReportHints = {
    impression: (body.hintImpression ?? "").trim(),
    reason: (body.hintReason ?? "").trim(),
    difficulty: (body.hintDifficulty ?? "").trim(),
    tomorrowGoal: (body.hintTomorrowGoal ?? "").trim(),
  };

  return { todayGoal, employeeName, events, messages, dailyInput, hints };
}

// ---- API エンドポイント ----

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.get("/api/history", (_req: Request, res: Response) => {
  try {
    res.json([...loadHistory()].reverse());
  } catch {
    res.json([]);
  }
});

app.get("/api/last-tomorrow-goal", (_req: Request, res: Response) => {
  try {
    const history = loadHistory();
    if (history.length === 0) { res.json({ tomorrowGoal: "" }); return; }
    const last = history[history.length - 1];
    const match = last.reportText.match(/明日の目標[:：]\s*(.+)/);
    res.json({ tomorrowGoal: match ? match[1].trim() : "" });
  } catch {
    res.json({ tomorrowGoal: "" });
  }
});

// 通常生成（後方互換）
app.post("/api/generate", upload.array("files", 5), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as Record<string, string>;
    const { todayGoal, employeeName, events, messages, dailyInput, hints } = parseFormBody(
      body, (req.files ?? []) as Express.Multer.File[], new Date().toISOString().slice(0, 10)
    );
    if (!todayGoal) { res.status(400).json({ error: "今日の目標を入力してください。" }); return; }

    const today = new Date().toISOString().slice(0, 10);
    const files = (req.files ?? []) as Express.Multer.File[];
    let referenceText = "";
    for (const file of files) { const t = await extractFileText(file); if (t) referenceText += `\n\n--- ${file.originalname} ---\n${t}`; }

    const report = await generateDailyReport(events, messages, dailyInput, employeeName, today, hints, referenceText || undefined);
    res.json({ report });
  } catch (err) { next(err); }
});

// ストリーミング生成
app.post("/api/generate-stream", upload.array("files", 5), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as Record<string, string>;
    const today = new Date().toISOString().slice(0, 10);
    const { todayGoal, employeeName, events, messages, dailyInput, hints } = parseFormBody(
      body, (req.files ?? []) as Express.Multer.File[], today
    );
    if (!todayGoal) { res.status(400).json({ error: "今日の目標を入力してください。" }); return; }

    const files = (req.files ?? []) as Express.Multer.File[];
    let referenceText = "";
    for (const file of files) { const t = await extractFileText(file); if (t) referenceText += `\n\n--- ${file.originalname} ---\n${t}`; }

    const history = loadHistory();
    const prompt = buildPrompt(today, events, messages, dailyInput, history, employeeName, hints, referenceText || undefined);

    console.log(`[server] ストリーミング生成: 予定${events.length}件 / メモ${messages.length}件 / ファイル${files.length}件`);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let fullText = "";
    try {
      for await (const chunk of generateReportStream(prompt)) {
        fullText += chunk;
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }
      saveReport({ date: today, reportText: fullText });
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    } catch (streamErr) {
      res.write(`data: ${JSON.stringify({ error: (streamErr as Error).message })}\n\n`);
    }
    res.end();
  } catch (err) {
    if (!res.headersSent) next(err);
    else res.end();
  }
});

// グローバルエラーハンドラー
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[server] エラー:", err.message);
  res.status(500).json({ error: err.message ?? "サーバーエラーが発生しました。" });
});

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n=== 日報自動化 GUI ===`);
  console.log(`サーバー起動: ${url}`);
  console.log("ブラウザを自動で開きます...\n");
  void openBrowser(url);
});
