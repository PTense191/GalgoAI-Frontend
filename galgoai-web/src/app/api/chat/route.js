import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { messages } = await request.json();
    const userMessage = messages.find((m) => m.sender === "user")?.text;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/consultar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pregunta: userMessage }),
    });

    if (!res.ok) throw new Error("Error en el backend");

    const data = await res.json();
    return NextResponse.json({ text: data.respuesta });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al contactar al backend" }, { status: 500 });
  }
}