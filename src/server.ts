import express, { NextFunction, Request, Response } from "express";
import * as path from "path";
import * as dotenv from "dotenv";
import multer from "multer";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
import { CalendarEvent, TeamsMessage, DailyInput, ReportHints, AchievementLevel, UnderstandingLevel } from "./types";
import { generateDailyReport } from "./core";

dotenv.config();

const app = express();
const PORT = 8080;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
});

app.use(express.static(path.join(process.cwd(), "public")));

interface EventInput {
  title: string;
  startTime: string;
  endTime: string;
}

function toISO(time: string, today: string): string {
  return `${today}T${time}:00+09:00`;
}

async function extractFileText(file: Express.Multer.File): Promise<string> {
  const isPdf = file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");
  const isText =
    file.mimetype.startsWith("text/") ||
    /\.(txt|md|csv|json|log)$/i.test(file.originalname);

  if (isPdf) {
    const data = await pdfParse(file.buffer);
    return data.text.trim();
  }
  if (isText) {
    return file.buffer.toString("utf-8").trim();
  }
  return "";
}

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.post("/api/generate", upload.array("files", 5), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as Record<string, string>;

    const todayGoal = (body.todayGoal ?? "").trim();
    if (!todayGoal) {
      res.status(400).json({ error: "今日の目標を入力してください。" });
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const employeeName = process.env.EMPLOYEE_NAME ?? "（未設定）";

    const rawEvents: EventInput[] = JSON.parse(body.events || "[]");
    const rawMemos: string[] = JSON.parse(body.memos || "[]");

    const events: CalendarEvent[] = rawEvents
      .filter((e) => e.title && e.startTime && e.endTime)
      .map((e) => ({
        title: e.title,
        startTime: toISO(e.startTime, today),
        endTime: toISO(e.endTime, today),
      }));

    const messages: TeamsMessage[] = rawMemos
      .filter((m) => m.trim() !== "")
      .map((text, i) => ({
        timestamp: toISO(`${String(9 + i).padStart(2, "0")}:00`, today),
        text,
      }));

    const dailyInput: DailyInput = {
      todayGoal,
      achievementLevel: (Number(body.achievementLevel) as AchievementLevel) || 3,
      understandingLevel: (Number(body.understandingLevel) as UnderstandingLevel) || 3,
    };

    const hints: ReportHints = {
      impression: (body.hintImpression ?? "").trim(),
      reason: (body.hintReason ?? "").trim(),
      difficulty: (body.hintDifficulty ?? "").trim(),
      tomorrowGoal: (body.hintTomorrowGoal ?? "").trim(),
    };

    let referenceText = "";
    const files = (req.files ?? []) as Express.Multer.File[];
    for (const file of files) {
      const text = await extractFileText(file);
      if (text) {
        referenceText += `\n\n--- ${file.originalname} ---\n${text}`;
      }
    }

    console.log(`[server] 日報生成: 予定${events.length}件 / メモ${messages.length}件 / ファイル${files.length}件`);
    const report = await generateDailyReport(
      events, messages, dailyInput, employeeName, today, hints, referenceText || undefined
    );
    res.json({ report });

  } catch (err) {
    next(err);
  }
});

// すべてのエラーをJSONで返すグローバルエラーハンドラー
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[server] エラー:", err.message);
  res.status(500).json({ error: err.message ?? "サーバーエラーが発生しました。" });
});

app.listen(PORT, () => {
  console.log(`\n=== 日報自動化 GUI ===`);
  console.log(`サーバー起動: http://localhost:${PORT}`);
  console.log(`ブラウザで上記 URL を開いてください。\n`);
});
