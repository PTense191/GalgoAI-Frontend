import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { messages } = await request.json();
    const userMessage = messages.find((m) => m.sender === "user")?.text;

    // DEBUG 1: Verifica si el mensaje existe
    if (!userMessage) {
      console.warn("No se encontró mensaje del usuario.");
      return NextResponse.json({ error: "Mensaje vacío." }, { status: 400 });
    }

    // DEBUG 2: Verifica si la URL del backend existe
    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      console.error("❌ API_URL no está definido en el entorno del servidor.");
      return NextResponse.json({ error: "API_URL no definido" }, { status: 500 });
    }

    const url = `${apiUrl}/consultar`;
    console.log("📡 Haciendo fetch a:", url);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pregunta: userMessage }),
    });

    // DEBUG 3: Verifica si el backend respondió correctamente
    if (!res.ok) {
      console.error("❌ Error en respuesta del backend:", res.status, res.statusText);
      return NextResponse.json({ error: "Error en el backend" }, { status: res.status });
    }

    const data = await res.json();

    // DEBUG 4: Mostrar la respuesta que regresó el backend
    console.log("✅ Respuesta del backend:", data);

    return NextResponse.json({ text: data.respuesta });

  } catch (error) {
    // DEBUG 5: Captura errores de red, formato u otros
    console.error("❌ Error general al contactar al backend:", error.message);
    return NextResponse.json(
      { error: "Error al contactar al backend" },
      { status: 500 }
    );
  }
}
