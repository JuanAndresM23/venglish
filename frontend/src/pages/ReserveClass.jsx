import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  TextField,
  Alert
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SchoolIcon from "@mui/icons-material/School";
import "../css/index.css";
import API_URL from "../config"; // ← AGREGADO

export default function ReserveClass() {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({ 
    course_id: "", 
    teacher_id: "",
    date: "", 
    time: "" 
  });
  const [error, setError] = useState("");     // ← AGREGADO
  const [success, setSuccess] = useState(""); // ← AGREGADO
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Cargar Cursos
    fetch(`${API_URL}/api/reserve`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Error cargando cursos");
        return res.json();
      })
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch((err) => setError("No se pudieron cargar los cursos. Intenta recargar.")); // ← CAMBIADO

    // 2. Cargar Profesores
    fetch(`${API_URL}/api/teachers`, { credentials: "include" }) // ← AGREGADO credentials
      .then((res) => {
        if (!res.ok) throw new Error("Error cargando profesores");
        return res.json();
      })
      .then((data) => setTeachers(Array.isArray(data) ? data : []))
      .catch((err) => setError("No se pudieron cargar los profesores. Intenta recargar.")); // ← CAMBIADO
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_URL}/api/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess("¡Clase reservada con éxito! 🎉 Redirigiendo..."); // ← CAMBIADO
        setTimeout(() => navigate("/dashboard"), 2000);               // ← Redirige a los 2 segundos
      } else {
        setError(data.error || "Error al reservar. Intenta de nuevo."); // ← CAMBIADO
      }
    } catch (err) {
      setError("Hubo un fallo de conexión. Intenta de nuevo."); // ← CAMBIADO
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "var(--venglish-bg-gradient)", display: "flex", justifyContent: "center", alignItems: "center", p: 3 }}>
      <Paper elevation={4} sx={{ p: { xs: 3, md: 5 }, borderRadius: "25px", maxWidth: "500px", width: "100%", backgroundColor: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(10px)" }}>
        
        <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
          <CalendarMonthIcon sx={{ fontSize: 50, color: "var(--venglish-pink)", mb: 1 }} />
          <Typography variant="h5" fontWeight="bold" color="textPrimary">Agendar Nueva Clase</Typography>
          <Typography variant="body2" color="textSecondary">Elige curso, profesor y horario</Typography>
        </Box>

        {/* ← AGREGADO: Mensajes de error y éxito */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            ⚠️ {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            
            {/* Selector de Curso */}
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="course-label">Selecciona tu Curso</InputLabel>
                <Select
                  labelId="course-label"
                  label="Selecciona tu Curso"
                  value={form.course_id}
                  onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                  required
                  sx={{ borderRadius: "12px" }}
                >
                  {courses.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Selector de Profesor */}
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="teacher-label">Selecciona tu Profesor</InputLabel>
                <Select
                  labelId="teacher-label"
                  label="Selecciona tu Profesor"
                  value={form.teacher_id}
                  onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                  required
                  sx={{ borderRadius: "12px" }}
                >
                  {teachers.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      <Box display="flex" alignItems="center">
                        <SchoolIcon sx={{ mr: 1, fontSize: 20, color: "gray" }} />
                        {t.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Fecha y Hora */}
            <Grid item xs={12} sm={6}>
              <TextField label="Fecha" type="date" fullWidth InputLabelProps={{ shrink: true }}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField label="Hora" type="time" fullWidth InputLabelProps={{ shrink: true }}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                required sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
              />
            </Grid>

            <Grid item xs={12}>
              <Button type="submit" variant="contained" fullWidth
                sx={{ py: 1.5, borderRadius: "12px", background: "var(--venglish-gradient)", fontWeight: "bold", fontSize: "1rem", boxShadow: "0 8px 15px rgba(255, 75, 176, 0.3)" }}>
                Confirmar Reserva
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Button onClick={() => navigate("/dashboard")} fullWidth color="inherit" sx={{ textTransform: "none" }}>
                Volver al Dashboard
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}