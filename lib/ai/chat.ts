import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

// Provider-agnostic chat used by the server-side /api/ai route only.
// The API key never leaves the server. Prototype on OpenAI, flip PROVIDER=claude later.

function loadDotEnv(p: string) {
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}
loadDotEnv(path.join(process.cwd(), ".env"));
loadDotEnv(path.join(process.cwd(), "spike", ".env"));

const PROVIDER = process.env.PROVIDER || "openai";

/** The model id currently in use — stored alongside cached results so the
 *  server can refresh them when a different (better) model is configured. */
export function currentModel(): string {
  return PROVIDER === "claude"
    ? process.env.CLAUDE_MODEL || "claude-sonnet-4-6"
    : process.env.OPENAI_MODEL || "gpt-4o-mini";
}

export async function chat(opts: {
  system: string;
  user: string;
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  return PROVIDER === "claude" ? claude(opts) : openai(opts);
}

async function openai(opts: {
  system: string;
  user: string;
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 700,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content as string;
}

async function claude(opts: {
  system: string;
  user: string;
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
      max_tokens: opts.maxTokens ?? 700,
      temperature: opts.temperature ?? 0.4,
      system: opts.system,
      messages: [
        { role: "user", content: opts.json ? `${opts.user}\n\nReturn ONLY the JSON object.` : opts.user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = (data.content as { text?: string }[]).map((b) => b.text || "").join("");
  return text.replace(/^```json\s*|\s*```$/g, "");
}
