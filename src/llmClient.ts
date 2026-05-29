import Groq from "groq-sdk";

const MODEL = "llama-3.3-70b-versatile";
const TIMEOUT_MS = 60_000;

function createClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY が .env に設定されていません。");
  return new Groq({ apiKey, timeout: TIMEOUT_MS });
}

export async function generateReport(prompt: string): Promise<string> {
  const client = createClient();
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1024,
  });
  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) throw new Error("Groq から空のレスポンスが返されました。");
  return content;
}

export async function* generateReportStream(prompt: string): AsyncGenerator<string> {
  const client = createClient();
  const stream = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1024,
    stream: true,
  });
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? "";
    if (text) yield text;
  }
}
