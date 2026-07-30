import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Paper, Switch, FormControlLabel } from "@mui/material";
import { useNavigate } from "react-router-dom";
import API_URL from "../config";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function TeacherSchedule() {
    const [schedules, setSchedules] = useState(
        DAYS.map((_, i) => ({
            day_of_week: i,
            start_time: "08:00",
            end_time: "18:00",
            is_available: false
        }))
    );
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${API_URL}/api/teacher/schedule`, { credentials: "include" })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setSchedules(prev => prev.map(day => {
                        const found = data.find(d => d.day_of_week === day.day_of_week);
                        return found ? {
                            ...day,
                            start_time: found.start_time.slice(0, 5),
                            end_time: found.end_time.slice(0, 5),
                            is_available: found.is_available
                        } : day;
                    }));
                }
            })
            .catch(err => console.error(err));
    }, []);

    const handleChange = (index, field, value) => {
        setSchedules(prev => prev.map((s, i) => 
            i === index ? { ...s, [field]: value } : s
        ));
    };

    const handleSave = async () => {
        try {
            for (const schedule of schedules) {
                await fetch(`${API_URL}/api/teacher/schedule`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(schedule)
                });
            }
            setSuccess("¡Horario guardado exitosamente!");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Box sx={{ p: 4, maxWidth: "800px", margin: "0 auto" }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom 
                sx={{ color: "var(--venglish-pink)" }}>
                Mi Horario de Disponibilidad
            </Typography>
            <Typography variant="body2" color="textSecondary" mb={3}>
                Configura los días y horas en que estás disponible para dar clases.
            </Typography>

            {success && (
                <Typography sx={{ 
                    color: "white", backgroundColor: "#43a047", 
                    borderRadius: "8px", padding: "10px", mb: 2, textAlign: "center" 
                }}>
                    ✅ {success}
                </Typography>
            )}

            {schedules.map((schedule, index) => (
                <Paper key={index} elevation={2} sx={{ 
                    p: 3, mb: 2, borderRadius: "15px",
                    border: schedule.is_available ? "2px solid #43a047" : "2px solid #e0e0e0",
                    opacity: schedule.is_available ? 1 : 0.7
                }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                        
                        <Box display="flex" alignItems="center" gap={2}>
                            <Typography fontWeight="bold" sx={{ minWidth: "100px" }}>
                                {DAYS[index]}
                            </Typography>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={schedule.is_available}
                                        onChange={e => handleChange(index, "is_available", e.target.checked)}
                                        sx={{
                                            "& .MuiSwitch-switchBase.Mui-checked": { color: "#43a047" },
                                            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#43a047" }
                                        }}
                                    />
                                }
                                label={schedule.is_available ? "Disponible" : "No disponible"}
                            />
                        </Box>

                        {schedule.is_available && (
                            <Box display="flex" alignItems="center" gap={2}>
                                <Box>
                                    <Typography variant="caption" color="textSecondary">Desde</Typography>
                                    <input
                                        type="time"
                                        value={schedule.start_time}
                                        onChange={e => handleChange(index, "start_time", e.target.value)}
                                        className="custom-mui-input"
                                        style={{ width: "130px", padding: "8px" }}
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="textSecondary">Hasta</Typography>
                                    <input
                                        type="time"
                                        value={schedule.end_time}
                                        onChange={e => handleChange(index, "end_time", e.target.value)}
                                        className="custom-mui-input"
                                        style={{ width: "130px", padding: "8px" }}
                                    />
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Paper>
            ))}

            <Box display="flex" gap={2} mt={3}>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    sx={{
                        background: "var(--venglish-gradient)",
                        borderRadius: "10px",
                        fontWeight: "bold",
                        py: 1.5,
                        px: 4
                    }}
                >
                    Guardar Horario
                </Button>
                <Button
                    variant="outlined"
                    onClick={() => navigate("/dashboard")}
                    sx={{ borderRadius: "10px" }}
                >
                    Volver
                </Button>
            </Box>
        </Box>
    );
}