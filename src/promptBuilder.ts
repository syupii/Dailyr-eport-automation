import {
  CalendarEvent,
  TeamsMessage,
  DailyReportHistory,
  DailyInput,
  ReportHints,
  ACHIEVEMENT_LABELS,
  UNDERSTANDING_LABELS,
} from "./types";

function formatEvents(events: CalendarEvent[]): string {
  if (events.length === 0) return "  （予定なし）";
  return events
    .map((e) => {
      const start = new Date(e.startTime).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
      const end = new Date(e.endTime).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
      return `  - ${start}〜${end} ${e.title}`;
    })
    .join("\n");
}

function formatMessages(messages: TeamsMessage[]): string {
  if (messages.length === 0) return "  （メモなし）";
  return messages
    .map((m) => {
      const time = new Date(m.timestamp).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
      return `  - [${time}] ${m.text}`;
    })
    .join("\n");
}

function formatHistory(history: DailyReportHistory[], maxEntries: number = 3): string {
  if (history.length === 0) return "  （履歴なし）";
  return history
    .slice(-maxEntries)
    .map((h) => `--- ${h.date} の日報 ---\n${h.reportText}`)
    .join("\n\n");
}

function hasHints(hints: ReportHints): boolean {
  return !!(hints.impression || hints.reason || hints.difficulty || hints.tomorrowGoal);
}

function formatHints(hints: ReportHints): string {
  const lines: string[] = [];
  if (hints.impression) lines.push(`  【印象に残ったこと】: ${hints.impression}`);
  if (hints.reason)     lines.push(`  【その理由】: ${hints.reason}`);
  if (hints.difficulty) lines.push(`  【難しいと感じたこと】: ${hints.difficulty}`);
  if (hints.tomorrowGoal) lines.push(`  【明日の目標】: ${hints.tomorrowGoal}`);
  return lines.length > 0 ? lines.join("\n") : "  （ヒントなし）";
}

export function buildPrompt(
  today: string,
  events: CalendarEvent[],
  messages: TeamsMessage[],
  dailyInput: DailyInput,
  history: DailyReportHistory[],
  employeeName: string,
  hints?: ReportHints,
  referenceText?: string,
): string {
  const date = new Date(today);
  const monthDay = `${date.getMonth() + 1}月${date.getDate()}日`;
  const activeHints = hints && hasHints(hints) ? hints : null;

  return `あなたは日報作成を補助するアシスタントです。
以下の情報をもとに、指定されたテンプレートの【AI記入欄】のみを日本語で埋めてください。

=====================================
■ 日報テンプレート（【AI記入欄】のみ埋めること）
=====================================
月日: ${monthDay}
氏名: ${employeeName}
今日の目標: ${dailyInput.todayGoal}
今日の目標の達成度: ${ACHIEVEMENT_LABELS[dailyInput.achievementLevel]}
今日の研修の理解度: ${UNDERSTANDING_LABELS[dailyInput.understandingLevel]}
本日学んだことで特に印象に残っていること: 【AI記入欄】
その理由: 【AI記入欄】
本日の内容で難しいと感じたこと: 【AI記入欄】
明日の目標: 【AI記入欄】
その他（伝えたいこと・質問・相談など）: 【AI記入欄】

=====================================
■ 本日（${today}）の活動データ
=====================================
【カレンダー予定】
${formatEvents(events)}

【作業メモ】
${formatMessages(messages)}
${activeHints ? `
=====================================
■ 各欄のユーザーメモ（キーワードや箇条書きを自然な文章に膨らませること）
=====================================
${formatHints(activeHints)}
` : ""}${referenceText ? `
=====================================
■ 参考資料（添付ファイル）
=====================================
${referenceText.trim()}
` : ""}
=====================================
■ 過去の日報（文体・表現の参考）
=====================================
${formatHistory(history)}

=====================================
■ 出力指示
=====================================
上記テンプレートの【AI記入欄】を埋めた日報を、テンプレートと同じ形式で出力してください。
- 【AI記入欄】という文字列は出力しないこと
- ユーザーのメモがある場合はそれを核にして、自然な報告文に膨らませること
- 参考資料がある場合はその内容を踏まえて具体的に記述すること
- 過去の日報の文体・語尾・表現を参考にすること
- 本日の活動データを根拠に具体的な内容を記述すること
- 「その他」欄は特に伝えることがなければ「特になし」と記載すること
- 余計な説明文は出力せず、テンプレートを埋めた結果だけを出力すること
`;
}
