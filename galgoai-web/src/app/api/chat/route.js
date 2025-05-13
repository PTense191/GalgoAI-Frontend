// src/app/api/chat/route.js
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { messages } = await request.json();
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages.map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      })),
    });
    const botReply = response.choices[0].message.content;
    return NextResponse.json({ text: botReply });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al contactar a la API" }, { status: 500 });
  }
}
