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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuSessionId, setMenuSessionId] = useState(null);
  const [customTitles, setCustomTitles] = useState({});
  const [editingSessionId, setEditingSessionId] = useState(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  function obtenerFechaLegible(id) {
    const parte = id.split("_").pop();

    try {
      if (!isNaN(parte)) {
        // Es un timestamp
        return new Date(Number(parte)).toLocaleDateString();
      } else {
        // Es una fecha tipo ISO (ej. 2025-05-22T02:40:28.843492)
        return new Date(parte).toLocaleDateString();
      }
    } catch {
      return "Fecha desconocida";
    }
  }

  // Cargar historial al autenticarse
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/historial?email=${session.user.email}`,
    )
      .then((res) => res.json())
      .then((data) => {
        setHistoryData(data);
        const uniq = Array.from(new Set(data.map((e) => e.session_id)));
        setSessions(uniq);
        const last = uniq[uniq.length - 1];
        setSelectedSession(last || "");
        if (last) {
          const msgs = data
            .filter((e) => e.session_id === last)
            .flatMap((e) => {
              const time = new Date().toLocaleTimeString();
              return [
                { sender: "user", text: e.mensaje_usuario, timestamp: time },
                { sender: "bot", text: e.respuesta_asistente, timestamp: time },
              ];
            });
          setMessages(msgs);
        } else {
          setMessages([
            {
              sender: "bot",
              text: "¡Hola! ¿En qué puedo ayudarte hoy?",
              timestamp: new Date().toLocaleTimeString(),
            },
          ]);
        }
      })
      .catch(console.error);
  }, [status, session]);

  // Seleccionar sesión
  const selectSession = (id) => {
    setSelectedSession(id);
    const msgs = historyData
      .filter((e) => e.session_id === id)
      .flatMap((e) => {
        const time = new Date().toLocaleTimeString();
        return [
          { sender: "user", text: e.mensaje_usuario, timestamp: time },
          { sender: "bot", text: e.respuesta_asistente, timestamp: time },
        ];
      });
    setMessages(msgs);
  };

  // Nuevo chat
  const newChat = () => {
    const id = `${session.user.email}_${Date.now()}`;
    setSessions((prev) => [...prev, id]);
    setSelectedSession(id);
    setMessages([
      {
        sender: "bot",
        text: "¡Hola! ¿En qué puedo ayudarte hoy?",
        timestamp: new Date().toLocaleTimeString(),
      },
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
        body: JSON.stringify({ mensajes: updated.map((m) => m.text) }),
      });
      const { respuesta } = await res.json();
      if (respuesta) {
        const botMsg = {
          sender: "bot",
          text: respuesta,
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, botMsg]);
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/historial`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_email: session.user.email,
            mensaje_usuario: text,
            respuesta_asistente: respuesta,
            session_id: selectedSession,
          }),
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  //Carga los títulos personalizados
  useEffect(() => {
    if (status !== "authenticated") return;

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/titulos?email=${session.user.email}`,
    )
      .then((res) => res.json())
      .then((data) => {
        const titles = {};
        data.forEach(({ session_id, titulo }) => {
          titles[session_id] = titulo;
        });
        setCustomTitles(titles);
      })
      .catch(console.error);
  }, [status, session]);

  //Click fuera del icono "..."
  useEffect(() => {
    const handleClickOutside = (e) => {
      const menu = document.getElementById("session-menu");
      if (menu && !menu.contains(e.target)) {
        setMenuSessionId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // Mientras NextAuth valida
  if (loadingSession) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <p className="text-gray-500 text-xl">Cargando sesión…</p>
      </div>
    );
  }

  // Si no autenticado
  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold mb-4">Acceso Restringido</h1>
          <p className="mb-4">Inicia sesión con tu correo institucional</p>
          <button
            onClick={() => signIn("google")}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Iniciar Sesión con Google
          </button>
        </div>
      </div>
    );
  }

  const filtered = sessions.filter((id) => id.includes(searchTerm));

  return (
    <main className="flex h-screen">
      {/* Sidebar */}
      <aside
        className={`
          flex flex-col bg-gray-100 p-4 overflow-y-auto
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? "w-1/4" : "w-0"}
        `}
      >
        {sidebarOpen && (
          <>
            <input
              type="text"
              placeholder="Buscar chat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4 p-2 border rounded focus:ring"
            />
            <button
              onClick={newChat}
              className="mb-4 px-4 py-2 bg-white rounded shadow hover:shadow-md transition-shadow"
            >
              + Nuevo chat
            </button>
            {filtered.map((id) => {
              const first = historyData.find((e) => e.session_id === id);
              const snippet =
                customTitles[id] ||
                first?.mensaje_usuario.slice(0, 20) +
                  (first?.mensaje_usuario.length > 20 ? "…" : "");
              return (
                <div
                  key={id}
                  onClick={() => selectSession(id)}
                  className="mb-3 p-2 bg-white rounded hover:bg-gray-200 transition-colors cursor-pointer relative"
                >
                  {editingSessionId === id ? (
                    <input
                      autoFocus
                      type="text"
                      defaultValue={
                        customTitles[id] ||
                        historyData
                          .find((e) => e.session_id === id)
                          ?.mensaje_usuario.slice(0, 20) ||
                        ""
                      }
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const nuevo = e.target.value.trim();
                          if (nuevo) {
                            fetch(
                              `${process.env.NEXT_PUBLIC_API_URL}/titulos`,
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  session_id: id,
                                  titulo: nuevo,
                                  user_email: session.user.email,
                                }),
                              },
                            ).then(() => {
                              setCustomTitles((prev) => ({
                                ...prev,
                                [id]: nuevo,
                              }));
                              setEditingSessionId(null);
                            });
                          }
                        } else if (e.key === "Escape") {
                          setEditingSessionId(null);
                        }
                      }}
                      className="w-full p-1 border rounded text-sm"
                    />
                  ) : (
                    <>
                      <p className="font-medium">
                        {customTitles[id] ||
                          historyData
                            .find((e) => e.session_id === id)
                            ?.mensaje_usuario.slice(0, 20) ||
                          id.split("_").pop()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {obtenerFechaLegible(id)}
                      </p>
                    </>
                  )}

                  {/* Botón menú de sesión */}
                  <button
                    className="absolute top-1 right-2 text-lg font-bold text-gray-500 hover:text-black cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuSessionId((prev) => (prev === id ? null : id));
                    }}
                  >
                    …
                  </button>

                  {/* Menú si está activo */}
                  {menuSessionId === id && (
                    <div
                      id="session-menu"
                      className="absolute right-2 top-7 w-32 bg-white border rounded shadow-md z-10"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSessionId(id);
                          setMenuSessionId(null);
                          // Mostrar campo de edición en línea (ya se maneja con menuSessionId === id)
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Renombrar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm("¿Seguro que deseas eliminar este chat?")
                          ) {
                            Promise.all([
                              fetch(
                                `${process.env.NEXT_PUBLIC_API_URL}/titulos`,
                                {
                                  method: "DELETE",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    session_id: id,
                                    user_email: session.user.email,
                                  }),
                                },
                              ),
                              fetch(
                                `${process.env.NEXT_PUBLIC_API_URL}/conversaciones`,
                                {
                                  method: "DELETE",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    session_id: id,
                                    user_email: session.user.email,
                                  }),
                                },
                              ),
                            ]).then(() => {
                              setHistoryData((prev) =>
                                prev.filter((e) => e.session_id !== id),
                              );
                              setSessions((prev) =>
                                prev.filter((sid) => sid !== id),
                              );
                              setMenuSessionId(null);
                            });
                          }
                        }}
                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-100"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </aside>

      {/* Chat area */}
      <section className="flex flex-col flex-1">
        {/* Header con botón burger y logo a la izquierda */}
        <header className="relative flex items-center justify-between h-16 px-6 bg-gradient-to-b from-teal-200 to-teal-500">
          {/* Grupo burger + logo a la izquierda */}
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              className="p-2 mr-4 text-white focus:outline-none hover:cursor-pointer"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <Image
              src="/project-logo.png"
              width={64}
              height={64}
              alt="GalgoAI Logo"
              className="object-contain"
            />
          </div>

          {/* Título centrado */}
          <h1 className="absolute left-1/2 transform -translate-x-1/2 uppercase font-bold text-4xl md:text-5xl font-pixel">
            GALGOAI CHAT
          </h1>

          {/* Avatar a la derecha */}
          <div className="flex-shrink-0 mr-8 relative">
            <img
              src={session.user.image}
              alt="avatar"
              onClick={() => setMenuOpen((o) => !o)}
              className="w-12 h-12 rounded-full cursor-pointer"
            />
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded">
                <button
                  onClick={() =>
                    signOut({ callbackUrl: window.location.origin })
                  }
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
              "linear-gradient(rgba(255,255,255,0.1), rgba(255,255,255,0.1)), url('/fondofinal.jpg')",
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
                <div
                  className={`flex items-center ${
                    isUser ? "flex-row-reverse" : ""
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`mx-2 flex-shrink-0 ${
                      isUser ? "" : "bg-white p-1 rounded-full"
                    }`}
                  >
                    <img
                      src={avatarSrc}
                      alt={isUser ? "Tu perfil" : "Bot Galgo"}
                      className={`rounded-full object-contain ${
                        isUser ? "w-12 h-12" : "w-14 h-14"
                      }`}
                    />
                  </div>
                  {/* Globo de texto */}
                  <div
                    className={`
                      max-w-lg p-4 border text-black font-sans text-lg font-medium shadow-sm transition-shadow
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

        {/* Input */}
        <footer className="p-4 bg-white border-t flex">
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
