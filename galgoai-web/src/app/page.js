// src/app/page.js
"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";

export default function Home() {
  const initialMessages = [
    {
      sender: "bot",
      text: "¡Hola! Soy el asistente virtual del Instituto Tecnológico de Tijuana. ¿En qué puedo ayudarte hoy?"
    }
  ];
  const [messages, setMessages] = useState(initialMessages);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const sendMessage = async () => {
    const text = inputRef.current.value.trim();
    if (!text) return;

    // 1. Añade tu mensaje
    const updated = [...messages, { sender: "user", text }];
    setMessages(updated);
    inputRef.current.value = "";

    // 2. Llama a nuestra API
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();
      if (data.text) {
        setMessages((prev) => [...prev, { sender: "bot", text: data.text }]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Auto‑scroll al final
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [messages]);

  return (
    <main className="flex flex-col h-screen max-w-screen-md mx-auto">
      <header className="p-4 bg-blue-500 shadow flex items-center justify-between relative">
        {/* Logo de la universidad */}
        <Image
          src="/uni-logo.png"
          width={200}
          height={200}
          alt="Logo Instituto"
        />

        {/* Título */}
        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-2xl font-serif font-bold text-black">
          GalgoAI Chat
        </h1>

        {/* Logo del proyecto */}
        <Image
          src="/project-logo.png"
          width={75}
          height={75}
          alt="Logo GalgoAI"
        />
      </header>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 rounded-lg shadow-lg bg-[url('/wallpaper.png')] bg-cover bg-center scroll-bg"

      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={
              "mb-2 flex " +
              (msg.sender === "user" ? "justify-end" : "justify-start")
            }
          >
            <div
              className={`animate-fade-in break-words text-justify overflow-hidden p-2 rounded-lg max-w-md border ${msg.sender === "user"
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
              e.preventDefault()
              sendMessage()
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
