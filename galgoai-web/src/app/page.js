"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useSession, signIn } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  const [messages, setMessages] = useState([]);

  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);

  // Cargar historial al iniciar sesión
 useEffect(() => {
  if (!session?.user?.email) return;

  fetch(`${process.env.NEXT_PUBLIC_API_URL}/historial?email=${session.user.email}`)
    .then(res => res.json())
    .then(data => {
      const historial = data.map((entry) => [
        { sender: "user", text: entry.mensaje_usuario },
        { sender: "bot", text: entry.respuesta_asistente }
      ]).flat();

      if (historial.length > 0) {
        setMessages(historial);
      } else {
        setMessages([
          {
            sender: "bot",
            text: "¡Hola! Soy el asistente virtual del Instituto Tecnológico de Tijuana. ¿En qué puedo ayudarte hoy?"
          }
        ]);
      }
    })
    .catch(err => console.error("Error cargando historial:", err))
    .finally(() => setLoading(false)); // 🔥 IMPORTANTE
}, [session]);

  const sendMessage = async () => {
    const text = inputRef.current.value.trim();
    if (!text) return;

    const updated = [...messages, { sender: "user", text }];
    const mensajesFiltrados = updated.filter(m => m.sender && m.text);

    setMessages(updated);
    inputRef.current.value = "";

    try {
      const res = await fetch("https://galgoai-backend.onrender.com/consultar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensajes: mensajesFiltrados }), // Enviamos todos los mensajes
      });
      const data = await res.json();
      if (data.respuesta) {
        setMessages((prev) => [...prev, { sender: "bot", text: data.respuesta }]);

        // Guardar conversación en el historial
        if (session?.user?.email) {
          const today = new Date().toISOString().split("T")[0]; // "2025-05-16"
          const session_id = `${session.user.email}_${today}`;

      fetch(`${process.env.NEXT_PUBLIC_API_URL}/historial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: session.user.email,
          mensaje_usuario: text,
          respuesta_asistente: data.respuesta,
          session_id: session_id,
        }),
      }).catch(err => console.error("Error guardando historial:", err));
    }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

 if (loading) {
  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <p className="text-gray-500 text-xl">Cargando chat...</p>
    </div>
  );
}

if (!session) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-gray-800">
      <div className="p-8 bg-white rounded-lg shadow-lg text-center text-gray-800">
        <h1 className="text-2xl font-bold mb-4">Acceso Restringido</h1>
        <p className="mb-4">Debes iniciar sesión con tu correo institucional</p>
        <button
          onClick={() => signIn("google")}
          className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600"
        >
          Iniciar Sesión con Google
        </button>
      </div>
    </div>
  );
}

  return (
    <main className="flex flex-col h-screen max-w-screen-md mx-auto">
      <header className="p-4 bg-blue-500 shadow flex items-center justify-between relative">
        <Image src="/uni-logo.png" width={200} height={200} alt="Logo Instituto" />
        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-2xl font-serif font-bold text-black">
          GalgoAI Chat
        </h1>
        <Image src="/project-logo.png" width={75} height={75} alt="Logo GalgoAI" />
      </header>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 rounded-lg shadow-lg bg-[url('/wallpaper.png')] bg-cover bg-center scroll-bg"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-2 flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`animate-fade-in break-words text-justify overflow-hidden p-2 rounded-lg max-w-md border ${
                msg.sender === "user"
                  ? "bg-green-100 border-green-300 text-black"
                  : "bg-gray-200 border-gray-400 text-black font-courier text-sm"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white border-t flex">
        <textarea
          ref={inputRef}
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Escribe un mensaje…"
          className="flex-1 border border-gray-300 rounded-full shadow-lg px-6 py-3 mr-2 resize-none overflow-y-auto focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800"
        />
        <button
          onClick={sendMessage}
          className="w-12 h-12 p-2 rounded-full bg-green-200 active:ring-2 active:ring-green-400 focus:outline-none flex items-center justify-center"
        >
          <img src="/send-icon.png" alt="Enviar" className="w-full h-full object-contain" />
        </button>
      </div>
    </main>
  );
}
