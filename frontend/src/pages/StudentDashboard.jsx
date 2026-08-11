import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Button, Chip, Alert
} from "@mui/material";
import API_URL from "../config";

export default function StudentDashboard() {
    const [classes, setClasses] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchClasses = () => {
        fetch(`${API_URL}/api/my_classes`, { credentials: "include" })
            .then(res => {
                if (!res.ok) throw new Error("No autorizado o error de servidor");
                return res.json();
            })
            .then(data => setClasses(Array.isArray(data) ? data : []))
            .catch(err => console.error("Error cargando clases:", err));
    };

    useEffect(() => {
        fetchClasses();
    }, []);

    const canCancel = (date, time) => {
        const classDateTime = new Date(`${date}T${time}`);
        const now = new Date();
        const diffHours = (classDateTime - now) / (1000 * 60 * 60);
        return diffHours > 12;
    };

    const handleCancel = async (bookingId, date, time) => {
        setError("");
        setSuccess("");

        if (!canCancel(date, time)) {
            setError("No puedes cancelar con menos de 12 horas de anticipación. La clase se descuenta como vista.");
            return;
        }

        if (!window.confirm("¿Estás seguro de que deseas cancelar esta clase?")) return;

        try {
            const res = await fetch(`${API_URL}/delete_booking/${bookingId}`, {
                method: "DELETE",
                credentials: "include"
            });

            if (res.ok) {
                setSuccess("Clase cancelada exitosamente.");
                fetchClasses();
            } else {
                const data = await res.json();
                setError(data.error || "Error al cancelar la clase.");
            }
        } catch (err) {
            setError("Hubo un fallo de conexión.");
        }
    };

    return (
        <Box sx={{ p: 4, maxWidth: "900px", margin: "0 auto" }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom color="var(--venglish-pink)">
                Tus Clases Agendadas
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>⚠️ {error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>✅ {success}</Alert>}

            <TableContainer component={Paper} sx={{ borderRadius: "15px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
                <Table>
                    <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                        <TableRow>
                            <TableCell><strong>Profesora</strong></TableCell>
                            <TableCell><strong>Fecha</strong></TableCell>
                            <TableCell><strong>Hora</strong></TableCell>
                            <TableCell><strong>Estado</strong></TableCell>
                            <TableCell><strong>Acción</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {classes.length > 0 ? (
                            classes.map((c) => {
                                const cancelable = canCancel(c.date, c.time);
                                return (
                                    <TableRow key={c.id}>
                                        <TableCell>{c.course}</TableCell>
                                        <TableCell>{c.date}</TableCell>
                                        <TableCell>{c.time}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={cancelable ? "Cancelable" : "No cancelable"}
                                                size="small"
                                                sx={{
                                                    backgroundColor: cancelable ? "#e8f5e9" : "#fce4ec",
                                                    color: cancelable ? "#2e7d32" : "#c62828",
                                                    fontWeight: "bold"
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {cancelable ? (
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    size="small"
                                                    onClick={() => handleCancel(c.id, c.date, c.time)}
                                                    sx={{ borderRadius: "8px" }}
                                                >
                                                    Cancelar
                                                </Button>
                                            ) : (
                                                <Typography variant="caption" color="textSecondary">
                                                    Sin cancelación
                                                </Typography>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    <Typography sx={{ py: 3, color: "text.secondary" }}>
                                        Aún no tienes clases programadas.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Nota de política */}
            <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                📋 Puedes cancelar tu clase hasta <strong>12 horas antes</strong>. 
                Después de ese tiempo la clase se descuenta como vista.
            </Alert>

            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                <Button 
                    component={Link} 
                    to="/reserve" 
                    variant="contained" 
                    sx={{ 
                        background: "var(--venglish-gradient)", 
                        borderRadius: "10px",
                        fontWeight: "bold" 
                    }}
                >
                    Nueva Reserva
                </Button>
            </Box>
        </Box>
    );
}