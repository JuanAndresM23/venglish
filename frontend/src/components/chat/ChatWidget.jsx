import { useEffect, useRef, useState } from "react";
import { Box, Fab, IconButton, InputBase, Paper, Typography } from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";

import { sendChatMessages } from "../../api/chat";

// Evento que avisa a las páginas del estudiante que el asistente reservó o canceló una clase.
export const BOOKINGS_CHANGED_EVENT = "venglish:bookings-changed";

const GREETING = {
  role: "assistant",
  content: "¡Hola! Soy el asistente de VEnglish. Puedo mostrarte tus clases, reservar o cancelar.",
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const history = [...messages, { role: "user", content: text }];
    setMessages(history);
    setInput("");
    setLoading(true);

    try {
      // El saludo inicial es solo de la interfaz; la API espera que el historial empiece con el usuario.
      const { reply, changed } = await sendChatMessages(history.slice(1));
      setMessages([...history, { role: "assistant", content: reply }]);
      if (changed) window.dispatchEvent(new Event(BOOKINGS_CHANGED_EVENT));
    } catch (error) {
      setMessages([
        ...history,
        { role: "assistant", content: error.message || "No pude responder. Intenta de nuevo." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {open && (
        <Paper
          elevation={8}
          sx={{
            position: "fixed",
            right: { xs: 8, sm: 24 },
            bottom: { xs: 80, sm: 96 },
            width: { xs: "calc(100vw - 16px)", sm: 380 },
            height: { xs: "70vh", sm: 520 },
            display: "flex",
            flexDirection: "column",
            borderRadius: "16px",
            overflow: "hidden",
            zIndex: 1300,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              py: 1,
              color: "#fff",
              background: "var(--venglish-gradient, linear-gradient(90deg, #e91e8c, #ff6fb5))",
            }}
          >
            <Typography fontWeight={700}>Asistente VEnglish</Typography>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: "#fff" }} aria-label="Cerrar chat">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  alignSelf: message.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  px: 1.5,
                  py: 1,
                  borderRadius: "12px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontSize: 14,
                  bgcolor: message.role === "user" ? "#fde7f3" : "#f3f4f6",
                }}
              >
                {message.content}
              </Box>
            ))}
            {loading && (
              <Typography variant="caption" color="text.secondary">
                Escribiendo…
              </Typography>
            )}
            <div ref={bottomRef} />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderTop: "1px solid #eee" }}>
            <InputBase
              fullWidth
              multiline
              maxRows={3}
              placeholder="Escribe tu mensaje…"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              inputProps={{ maxLength: 1000 }}
              sx={{ px: 1 }}
            />
            <IconButton color="primary" onClick={handleSend} disabled={loading || !input.trim()} aria-label="Enviar">
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      )}

      <Fab
        color="primary"
        onClick={() => setOpen((value) => !value)}
        aria-label="Abrir asistente"
        sx={{ position: "fixed", right: { xs: 16, sm: 24 }, bottom: { xs: 16, sm: 24 }, zIndex: 1300 }}
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </Fab>
    </>
  );
}
