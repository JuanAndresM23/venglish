import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button } from "@mui/material";

export default function StudentDashboard() {
    const [classes, setClasses] = useState([]);

    useEffect(() => {
        // 1. Usamos localhost para consistencia
        // 2. Agregamos credentials: "include" para que Flask lea la sesión
        fetch("http://localhost:5000/api/my_classes", {
            credentials: "include" 
        })
        .then(res => {
            if (!res.ok) throw new Error("No autorizado o error de servidor");
            return res.json();
        })
        .then(data => {
            // Verificamos que los datos lleguen antes de setear
            setClasses(Array.isArray(data) ? data : []);
        })
        .catch(err => console.error("Error cargando clases:", err));
    }, []);

    return (
        <Box sx={{ p: 4, maxWidth: "900px", margin: "0 auto" }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom color="var(--venglish-pink)">
                Tus Clases Agendadas
            </Typography>

            <TableContainer component={Paper} sx={{ borderRadius: "15px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
                <Table>
                    <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                        <TableRow>
                            <TableCell><strong>Curso</strong></TableCell>
                            <TableCell><strong>Fecha</strong></TableCell>
                            <TableCell><strong>Hora</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {classes.length > 0 ? (
                            classes.map((c) => (
                                <TableRow key={c.id}>
                                    <TableCell>{c.course}</TableCell>
                                    <TableCell>{c.date}</TableCell>
                                    <TableCell>{c.time}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} align="center">
                                    <Typography sx={{ py: 3, color: "text.secondary" }}>
                                        Aún no tienes clases programadas.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

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