"use client";

import { useState, useCallback } from "react";
import type { MensajeChat } from "@/types/app";
import { toast } from "sonner";

export function useChat() {
  const [messages, setMessages] = useState<MensajeChat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (
    texto: string,
    proyectoId: string,
    documentoId?: string | null
  ) => {
    if (!texto.trim() || !proyectoId || isLoading) return;

    setIsLoading(true);
    setError(null);

    const userMessage: MensajeChat = {
      id: `u-${Date.now()}`,
      rol: "user",
      contenido: texto,
      timestamp: new Date(),
    };

    const aiMessageId = `a-${Date.now()}`;
    const aiInitialMessage: MensajeChat = {
      id: aiMessageId,
      rol: "assistant",
      contenido: "",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, aiInitialMessage]);

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensaje: texto,
          proyecto_id: proyectoId,
          documento_id: documentoId,
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "Error de conexión con DocuMente IA");
      }

      if (!resp.body) throw new Error("No ReadableStream desde la API");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";       // buffer para líneas SSE incompletas
      let textoFinal = "";   // texto acumulado visible al usuario

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decodificar el chunk y acumularlo en el buffer
        buffer += decoder.decode(value, { stream: true });

        // Procesar todas las líneas completas del buffer
        const lineas = buffer.split("\n");

        // La última línea puede estar incompleta → guardarla en buffer
        buffer = lineas.pop() ?? "";

        for (const linea of lineas) {
          const trimmed = linea.trim();

          // Ignorar líneas vacías o comentarios SSE
          if (!trimmed || trimmed.startsWith(":")) continue;

          // Formato SSE estándar: "data: <payload>"
          if (trimmed.startsWith("data:")) {
            const payload = trimmed.slice(5).trim();

            // Señal de fin de stream
            if (payload === "[DONE]") break;

            // Intentar parsear JSON → extraer el texto
            try {
              const parsed = JSON.parse(payload);

              // Groq devuelve { text: "..." } o { content: "..." }
              const chunk =
                parsed.text ??
                parsed.content ??
                parsed.choices?.[0]?.delta?.content ??
                "";

              if (chunk) {
                textoFinal += chunk;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, contenido: textoFinal }
                      : msg
                  )
                );
              }
            } catch {
              // Si no es JSON válido, tratar como texto plano directo
              if (payload && payload !== "[DONE]") {
                textoFinal += payload;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, contenido: textoFinal }
                      : msg
                  )
                );
              }
            }
          } else {
            // El backend devuelve texto plano sin prefijo "data:" → usarlo directo
            textoFinal += trimmed;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? { ...msg, contenido: textoFinal }
                  : msg
              )
            );
          }
        }
      }

    } catch (err: any) {
      console.error("Chat Flow Exception:", err);
      toast.error(err.message || "Fallo inesperado del chat RAG.");
      setError("No pudimos analizar tus documentos. Inténtalo de nuevo.");
      setMessages((prev) => prev.filter((m) => m.id !== aiMessageId));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const sendQuickAction = useCallback(
    (
      tipo: "resumen" | "riesgos" | "acciones",
      proyectoId: string,
      documentoId?: string | null
    ) => {
      const prompts: Record<typeof tipo, string> = {
        resumen:
          "Genera un resumen ejecutivo de máximo tres párrafos con los puntos clave y temas vitales del documento seleccionado.",
        riesgos:
          "Detecta riesgos, cláusulas problemáticas, multas, intereses altos y fechas críticas en este documento.",
        acciones:
          "Extrae una lista de tareas, requerimientos futuros y pasos a seguir obligatorios según este documento.",
      };

      sendMessage(prompts[tipo] ?? "Analiza el documento.", proyectoId, documentoId);
    },
    [sendMessage]
  );

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    sendQuickAction,
    setMessages,
  };
}