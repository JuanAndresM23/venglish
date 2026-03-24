import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Button, Paper, Grid, MenuItem, 
  Select, InputLabel, FormControl, TextField 
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import "../index.css"; // Para los gradientes y colores

export default function ReserveClass() {
    const [courses, setCourses] = useState([]);
    const [form, setForm] = useState({ course_id: "", date: "", time: "" });
    const navigate = useNavigate();

    useEffect(() => {
        // Obtenemos los cursos disponibles
        fetch("http://localhost:5000/api/reserve", {
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => setCourses(Array.isArray(data) ? data : []))
        .catch(err => console.error("Error cargando cursos:", err));
    }, []);

    const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
        const res = await fetch("http://localhost:5000/api/reserve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
            credentials: "include"
        });

        const data = await res.json();

        if (res.ok) {
            alert("¡Clase reservada con éxito! 🎉");
            navigate("/dashboard");
        } else {
            // Aquí mostrará: "Este horario ya no está disponible" o el error que mande Flask
            alert(data.error || "Error al reservar");
        }
    } catch (err) {
        console.error("Error:", err);
        alert("Hubo un fallo de conexión.");
    }
};

    return (
        <Box sx={{ 
            minHeight: "100vh", 
            background: "var(--venglish-bg-gradient)", 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center", 
            p: 3 
        }}>
            <Paper elevation={4} sx={{ 
                p: { xs: 3, md: 5 }, 
                borderRadius: "25px", 
                maxWidth: "500px", 
                width: "100%",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(10px)"
            }}>
                <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
                    <CalendarMonthIcon sx={{ fontSize: 50, color: "var(--venglish-pink)", mb: 1 }} />
                    <Typography variant="h5" fontWeight="bold" color="textPrimary">
                        Agendar Nueva Clase
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Elige tu curso y el horario que prefieras
                    </Typography>
                </Box>

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <FormControl fullWidth variant="outlined">
                                <InputLabel color="secondary">Selecciona tu Curso</InputLabel>
                                <Select
                                    label="Selecciona tu Curso"
                                    value={form.course_id}
                                    onChange={e => setForm({...form, course_id: e.target.value})}
                                    required
                                    sx={{ borderRadius: "12px" }}
                                >
                                    {courses.map(c => (
                                        <MenuItem key={c.id} value={c.id}>
                                            {c.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Fecha"
                                type="date"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                onChange={e => setForm({...form, date: e.target.value})}
                                required
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Hora"
                                type="time"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                onChange={e => setForm({...form, time: e.target.value})}
                                required
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Button 
                                type="submit" 
                                variant="contained" 
                                fullWidth 
                                sx={{ 
                                    py: 1.5, 
                                    borderRadius: "12px", 
                                    background: "var(--venglish-gradient)",
                                    fontWeight: "bold",
                                    fontSize: "1rem",
                                    boxShadow: "0 8px 15px rgba(255, 75, 176, 0.3)"
                                }}
                            >
                                Confirmar Reserva
                            </Button>
                        </Grid>

                        <Grid item xs={12}>
                            <Button 
                                onClick={() => navigate("/dashboard")}
                                fullWidth 
                                color="inherit"
                                sx={{ textTransform: "none" }}
                            >
                                Volver al Dashboard
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );
}