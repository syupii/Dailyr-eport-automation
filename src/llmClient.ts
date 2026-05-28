import Groq from "groq-sdk";

const MODEL = "llama-3.3-70b-versatile";

export async function generateReport(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY が .env に設定されていません。");
  }

  const client = new Groq({ apiKey });

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1024,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Groq から空のレスポンスが返されました。");
  }
  return content;
}
