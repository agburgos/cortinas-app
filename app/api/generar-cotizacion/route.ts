import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { apiKey, prompt } = await req.json();

  if (!apiKey || typeof apiKey !== "string") {
    return NextResponse.json({ error: "Falta la API Key de Anthropic" }, { status: 400 });
  }
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Falta el prompt" }, { status: 400 });
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }
    const texto = (data.content ?? []).map((b: { text?: string }) => b.text || "").join("");
    return NextResponse.json({ texto });
  } catch {
    return NextResponse.json({ error: "Error al conectar con la API de Anthropic" }, { status: 500 });
  }
}
