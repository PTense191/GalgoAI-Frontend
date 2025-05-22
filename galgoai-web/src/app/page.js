// File: src/app/page.js
"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();
  const loadingSession = status === "loading";

  const [historyData, setHistoryData] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [messages, setMessages] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Cargar historial al autenticarse
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/historial?email=${session.user.email}`)
      .then(res => res.json())
      .then(data => {
        setHistoryData(data);
        const uniq = Array.from(new Set(data.map(e => e.session_id)));
        setSessions(uniq);
        const last = uniq[uniq.length - 1];
        setSelectedSession(last || "");
        if (last) {
          const msgs = data
            .filter(e => e.session_id === last)
            .flatMap(e => {
              const time = new Date().toLocaleTimeString();
              return [
                { sender: "user", text: e.mensaje_usuario,    timestamp: time },
                { sender: "bot",  text: e.respuesta_asistente, timestamp: time }
              ];
            });
          setMessages(msgs);
        } else {
          setMessages([
            { sender: "bot", text: "¡Hola! ¿En qué puedo ayudarte hoy?", timestamp: new Date().toLocaleTimeString() }
          ]);
        }
      })
      .catch(console.error);
  }, [status, session]);

  // Seleccionar sesión
  const selectSession = id => {
    setSelectedSession(id);
    const msgs = historyData
      .filter(e => e.session_id === id)
      .flatMap(e => {
        const time = new Date().toLocaleTimeString();
        return [
          { sender: "user", text: e.mensaje_usuario,    timestamp: time },
          { sender: "bot",  text: e.respuesta_asistente, timestamp: time }
        ];
      });
    setMessages(msgs);
  };

  // Nuevo chat
  const newChat = () => {
    const id = `${session.user.email}_${Date.now()}`;
    setSessions(prev => [...prev, id]);
    setSelectedSession(id);
    setMessages([
      { sender: "bot", text: "¡Hola! ¿En qué puedo ayudarte hoy?", timestamp: new Date().toLocaleTimeString() }
    ]);
  };

  // Enviar mensaje
  const sendMessage = async () => {
    const text = inputRef.current.value.trim();
    if (!text) return;
    const time = new Date().toLocaleTimeString();
    const updated = [...messages, { sender: "user", text, timestamp: time }];
    setMessages(updated);
    inputRef.current.value = "";

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/consultar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensajes: updated.map(m => m.text) })
      });
      const { respuesta } = await res.json();
      if (respuesta) {
        const botMsg = { sender: "bot", text: respuesta, timestamp: new Date().toLocaleTimeString() };
        setMessages(prev => [...prev, botMsg]);
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/historial`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_email:          session.user.email,
            mensaje_usuario:     text,
            respuesta_asistente: respuesta,
            session_id:          selectedSession
          })
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Auto-scroll
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

  // Validación de sesión
  if (loadingSession) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <p className="text-gray-500 text-xl">Cargando sesión…</p>
      </div>
    );
  }
  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold mb-4 font-pixel uppercase text-4xl">GALGOAI CHAT</h1>
          <div className="flex justify-center mb-6">
              <div className="w-28 h-28 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                <Image
                  src="/bot.png"
                  width={128}
                  height={128}
                  alt="GalgoAI Logo"
                  className="object-contain"
                />
              </div>
            </div>
          <button
            onClick={() => signIn("google", {prompt: "select_account"})}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Iniciar Sesión con Google
          </button>
        </div>
      </div>
    );
  }

  const filtered = sessions.filter(id => id.includes(searchTerm));

  return (
    <main className="flex h-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-1/4 bg-gray-100 p-4 overflow-y-auto">
        <input
          type="text"
          placeholder="Buscar chat..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="mb-4 p-2 border rounded focus:ring"
        />
        <button
          onClick={newChat}
          className="mb-4 px-4 py-2 bg-white rounded shadow hover:shadow-md transition-shadow"
        >
          + Nuevo chat
        </button>
        {filtered.map(id => {
          const first = historyData.find(e => e.session_id === id);
          const mensaje = first?.mensaje_usuario || "";
          const snippet = mensaje.slice(0, 20) + (mensaje.length > 20 ? "…" : "");
          return (
            <div
              key={id}
              onClick={() => selectSession(id)}
              className="mb-3 p-2 bg-white rounded hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <p className="font-medium">{snippet || id.split("_").pop()}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(Number(id.split("_").pop())).toLocaleDateString()}
              </p>
            </div>
          );
        })}
      </aside>

      {/* Chat area */}
      <section className="flex flex-col flex-1">
        <header className="relative flex items-center justify-between h-16 px-6 bg-gradient-to-b from-teal-200 to-teal-500">
          <div className="flex-shrink-0 ml-8">
            <Image
              src="/project-logo.png"
              width={64}
              height={64}
              alt="GalgoAI Logo"
              className="object-contain"
            />
          </div>
          <h1 className="absolute left-1/2 transform -translate-x-1/2 uppercase font-bold text-4xl md:text-5xl font-pixel">
            GALGOAI CHAT
          </h1>
          <div className="flex-shrink-0 mr-8 relative">
            <img
              src={session.user.image}
              alt="avatar"
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-12 h-12 rounded-full cursor-pointer"
            />
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded">
                <button
                  onClick={() => signOut({ callbackUrl: window.location.origin })}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Mensajes con avatars y burbujas */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-4 scroll-bg"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.4), rgba(255,255,255,0.4)), url('/wallpaper.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {messages.map((msg, i) => {
            const isUser = msg.sender === "user";
            const avatarSrc = isUser ? session.user.image : "/bot.png";
            return (
              <div
                key={i}
                className={`mb-4 flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex items-center ${isUser ? "flex-row-reverse" : ""}`}>
                  {/* Avatar */}
                  <div className={isUser ? "mx-2 flex-shrink-0" : "bg-white p-1 rounded-full mx-2 flex-shrink-0"}>
                    <img
                      src={avatarSrc}
                      alt={isUser ? "Tu perfil" : "Bot Galgo"}
                      className={`${isUser ? "w-10 h-10" : "w-12 h-12"} rounded-full object-contain`}
                    />
                  </div>
                  {/* Globo de texto */}
                  <div
                    className={`
                      max-w-lg p-4 border text-black font-sans text-lg font-medium shadow-sm
                      ${
                        isUser
                          ? "bg-green-100 border-green-300 rounded-tl-lg rounded-bl-lg rounded-br-none"
                          : "bg-gray-100 border-gray-300 rounded-tr-lg rounded-br-lg rounded-bl-none"
                      }
                    `}
                  >
                    {msg.text}
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <footer className="p-4 bg-white border-t flex">
          <textarea
            ref={inputRef}
            rows={2}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Escribe un mensaje…"
            className="
              flex-1 border border-gray-300 rounded-full shadow-lg
              px-6 py-3 mr-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300
              text-black font-sans text-lg font-medium
            "
          />
          <button
            onClick={sendMessage}
            className="w-12 h-12 p-2 rounded-full bg-green-200 active:ring-2 active:ring-green-400 flex items-center justify-center transition-colors hover:bg-green-300"
          >
            <img
              src="/send-icon.png"
              alt="Enviar"
              className="w-full h-full object-contain"
            />
          </button>
        </footer>
      </section>
    </main>
  );
}
