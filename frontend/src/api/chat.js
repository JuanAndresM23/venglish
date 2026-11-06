import { apiFetch } from "./client";

export const sendChatMessages = (messages) =>
  apiFetch("/api/chat", { method: "POST", body: JSON.stringify({ messages }) });
