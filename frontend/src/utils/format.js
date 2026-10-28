export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return [hours ? `${hours} h` : "", rest ? `${rest} min` : ""].filter(Boolean).join(" ");
}

// "08:00:00" → "08:00"
export const shortTime = (time) => String(time || "").slice(0, 5);

// ("08:00:00", 90) → "08:00 - 09:30"
export function formatTimeRange(time, minutes = 60) {
  const start = shortTime(time);
  if (!start) return "";
  const [h, m] = start.split(":").map(Number);
  const end = h * 60 + m + minutes;
  const pad = (n) => String(n).padStart(2, "0");
  return `${start} - ${pad(Math.floor(end / 60) % 24)}:${pad(end % 60)}`;
}
