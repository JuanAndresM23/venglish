import React, { useState, useEffect } from "react";
import {
  Box, Typography, Button, Paper,
  MenuItem, Select, InputLabel, FormControl, TextField, Alert
} from "@mui/material";
import { useNavigate } from "react-router-any";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SchoolIcon from "@mui/icons-material/School";
import "../css/index.css";
import API_URL from "../config";

const STATUS_CONFIG = {
  available:   { color: "#43a047", label: "Disponible",    emoji: "🟢" },
  unavailable: { color: "#e53935", label: "No disponible", emoji: "🔴" },
  busy:        { color: "#fb8c00", label: "Ocupado",       emoji: "🟡" },
};

export default function ReserveClass() {
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({ teacher_id: "", date: "", time: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Cargar disponibilidad cuando cambia fecha u hora
  useEffect(() => {
    if (form.date && form.time) {
      fetch(`${API_URL}/api/teachers/availability?date=${form.date}&time=${form.time}`, {
        credentials: "include"
      })
        .then(res => res.json())
        .then(data => setTeachers(Array.isArray(data) ? data : []))
        .catch(() => setError("No se pudieron cargar los profesores."));
    } else {
      fetch(`${API_URL}/api/teachers`, { credentials: "include" })
        .then(res => res.json())
        .then(data => setTeachers(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [form.date, form.time]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validar 48h de anticipación
    const selectedDateTime = new Date(`${form.date}T${form.time}`);
    const now = new Date();
    const diffHours = (selectedDateTime - now) / (1000 * 60 * 60);

    if (diffHours < 48) {
      setError("Debes agendar con mínimo 48 horas de anticipación.");
      return;
    }

    // Validar disponibilidad del profesor
    const selectedTeacher = teachers.find(t => String(t.id) === String(form.teacher_id));
    if (selectedTeacher && selectedTeacher.status !== "available") {
      setError("Este profesor no está disponible en el horario seleccionado.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess("¡Clase reservada con éxito! 🎉 Redirigiendo...");
        setTimeout(() => navigate("/dashboard"), 2000);
      } else {
        setError(data.error || "Error al reservar. Intenta de nuevo.");
      }
    } catch (err) {
      setError("Hubo un fallo de conexión. Intenta de nuevo.");
    }
  };

  // Fecha mínima = hoy + 48 horas
  const minDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split("T")[0];

  return (
    <Box sx={{ minHeight: "100vh", background: "var(--venglish-bg-gradient)", display: "flex", justifyContent: "center", alignItems: "center", p: 3 }}>
      <Paper elevation={4} sx={{ p: { xs: 3, md: 5 }, borderRadius: "25px", maxWidth: "500px", width: "100%", backgroundColor: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(10px)" }}>
        
        <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
          <CalendarMonthIcon sx={{ fontSize: 50, color: "var(--venglish-pink)", mb: 1 }} />
          <Typography variant="h5" fontWeight="bold" color="textPrimary">Agendar Nueva Clase</Typography>
          <Typography variant="body2" color="textSecondary">Elige fecha, hora y profesora</Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>⚠️ {error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

        <form onSubmit={handleSubmit}>
          <Box display="flex" flexDirection="column" gap={3}>

            {/* Fecha y Hora */}
            <Box display="flex" gap={2}>
              <TextField
                label="Fecha" type="date" fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: minDate }}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
              />
              <TextField
                label="Hora" type="time" fullWidth
                InputLabelProps={{ shrink: true }}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                required
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
              />
            </Box>

            {/* Selector de Profesora con semáforo */}
            <FormControl fullWidth variant="outlined">
              <InputLabel id="teacher-label">Selecciona tu Profesora</InputLabel>
              <Select
                labelId="teacher-label"
                label="Selecciona tu Profesora"
                value={form.teacher_id}
                onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                required
                sx={{ borderRadius: "12px" }}
              >
                {teachers.map((t) => {
                  const status = STATUS_CONFIG[t.status] || STATUS_CONFIG.unavailable;
                  return (
                    <MenuItem
                      key={t.id}
                      value={t.id}
                      disabled={t.status !== "available"}
                    >
                      <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                        <Box display="flex" alignItems="center">
                          <SchoolIcon sx={{ mr: 1, fontSize: 20, color: "gray" }} />
                          {t.name}
                        </Box>
                        {form.date && form.time && (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <span>{status.emoji}</span>
                            <Typography variant="caption" sx={{ color: status.color, fontWeight: "bold" }}>
                              {status.label}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            {/* Leyenda */}
            {form.date && form.time && (
              <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
                {Object.values(STATUS_CONFIG).map(s => (
                  <Typography key={s.label} variant="caption" sx={{ color: s.color }}>
                    {s.emoji} {s.label}
                  </Typography>
                ))}
              </Box>
            )}

            {/* Nota de política */}
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              📋 Las clases deben agendarse con mínimo <strong>48 horas</strong> de anticipación.
            </Alert>

            <Button type="submit" variant="contained" fullWidth
              sx={{ py: 1.5, borderRadius: "12px", background: "var(--venglish-gradient)", fontWeight: "bold", fontSize: "1rem" }}>
              Confirmar Reserva
            </Button>

            <Button onClick={() => navigate("/dashboard")} fullWidth color="inherit" sx={{ textTransform: "none" }}>
              Volver al Dashboard
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}