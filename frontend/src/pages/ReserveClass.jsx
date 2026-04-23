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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SchoolIcon from "@mui/icons-material/School"; // Icono para profesores
import "../css/index.css";

export default function ReserveClass() {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]); // Nuevo estado para profes
  const [form, setForm] = useState({ 
    course_id: "", 
    teacher_id: "", // Nuevo campo en el form
    date: "", 
    time: "" 
  });
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Cargar Cursos
    fetch("http://localhost:5000/api/reserve", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error cargando cursos:", err));

    // 2. Cargar Profesores (Debes crear esta ruta en Flask como te mostré antes)
    fetch("http://localhost:5000/api/teachers")
      .then((res) => res.json())
      .then((data) => setTeachers(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error cargando profesores:", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok) {
        alert("¡Clase reservada con éxito! 🎉");
        navigate("/dashboard");
      } else {
        alert(data.error || "Error al reservar");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Hubo un fallo de conexión.");
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

            {/* NUEVO: Selector de Profesor */}
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