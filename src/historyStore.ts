import * as fs from "fs";
import * as path from "path";
import { DailyReportHistory } from "./types";

const HISTORY_PATH = path.resolve(__dirname, "../history.json");

const INITIAL_HISTORY: DailyReportHistory[] = [
  {
    date: "2026-05-26",
    reportText: `【2026/05/26 日報】
■ 本日の作業
- APIクライアントの設計レビューに参加。インターフェース定義の修正点を持ち帰り。
- レビュー指摘を受けてエラーハンドリングを全面的に見直し、カスタム例外クラスを追加。
- 結合テスト環境のDockerfile修正。CIパイプラインが通るようになった。

■ 翌日の予定
- エラーハンドリング修正のPRレビュー依頼
- 新機能の基本設計着手

■ 所感
設計レビューで視点が広がった。明日は腰を据えて設計フェーズに入れそう。`,
  },
  {
    date: "2026-05-27",
    reportText: `【2026/05/27 日報】
■ 本日の作業
- 新機能（認証モジュール）の基本設計ドキュメント作成。
- チームMTGでフィードバックをもらい、セッション管理周りの方針を確定。
- ユニットテストのカバレッジが低い箇所をリストアップし、優先度付け。

■ 翌日の予定
- 認証モジュールのユニットテスト追加
- PRレビュー対応

■ 所感
方針が固まったので実装に集中できる。テストを先に充実させてから実装を進める方針にした。`,
  },
];

export function loadHistory(): DailyReportHistory[] {
  if (!fs.existsSync(HISTORY_PATH)) {
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(INITIAL_HISTORY, null, 2), "utf-8");
    console.log(`[historyStore] history.json を新規作成しました: ${HISTORY_PATH}`);
    return INITIAL_HISTORY;
  }

  const raw = fs.readFileSync(HISTORY_PATH, "utf-8");
  return JSON.parse(raw) as DailyReportHistory[];
}

export function saveReport(entry: DailyReportHistory): void {
  const history = loadHistory();
  const existingIndex = history.findIndex((h) => h.date === entry.date);

  if (existingIndex >= 0) {
    history[existingIndex] = entry;
  } else {
    history.push(entry);
  }

  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2), "utf-8");
}
