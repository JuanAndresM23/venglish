// Duraciones que un estudiante puede elegir al reservar (debe coincidir con ALLOWED_DURATIONS del backend).
export const DURATION_OPTIONS = [
  { value: 60, label: "1 hora" },
  { value: 90, label: "1 hora y media" },
  { value: 120, label: "2 horas" },
  { value: 150, label: "2 horas y media" },
  { value: 180, label: "3 horas" },
];

export const DEFAULT_DURATION = 60;
