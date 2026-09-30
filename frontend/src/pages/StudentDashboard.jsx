import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from "@mui/material";

import { apiFetch } from "../api";

export default function StudentDashboard() {
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const data = await apiFetch("/api/my_classes");
      setClasses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando clases:", error);
    }
  };

  const handleCancel = async (bookingId) => {
    const confirmed = window.confirm(
      "¿Estás seguro de cancelar esta clase?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await apiFetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      });

      setClasses((currentClasses) =>
        currentClasses.filter(
          (item) => item.id !== bookingId
        )
      );

      alert("Clase cancelada correctamente");
    } catch (error) {
      alert(
        error.message ||
          "No fue posible cancelar la clase."
      );
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: "900px", margin: "0 auto" }}>
      <Typography
        variant="h4"
        fontWeight="bold"
        gutterBottom
        color="var(--venglish-pink)"
      >
        Tus Clases Agendadas
      </Typography>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: "15px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        }}
      >
        <Table>
          <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
            <TableRow>
              <TableCell>
                <strong>Curso</strong>
              </TableCell>

              <TableCell>
                <strong>Profesor</strong>
              </TableCell>

              <TableCell>
                <strong>Fecha</strong>
              </TableCell>

              <TableCell>
                <strong>Hora</strong>
              </TableCell>

              <TableCell>
                <strong>Acciones</strong>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {classes.length > 0 ? (
              classes.map((c) => (
              <TableRow key={c.id}>
    <TableCell>{c.course}</TableCell>

    <TableCell>
        {c.teacher || "Sin asignar"}
    </TableCell>

    <TableCell>{c.date}</TableCell>

    <TableCell>{c.time}</TableCell>

    <TableCell>
        <Button
            color="error"
            variant="outlined"
            size="small"
            onClick={() => handleCancel(c.id)}
        >
            Cancelar
        </Button>
    </TableCell>
</TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  align="center"
                >
                  <Typography
                    sx={{
                      py: 3,
                      color: "text.secondary",
                    }}
                  >
                    Aún no tienes clases programadas.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box
        sx={{
          mt: 3,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Button
          component={Link}
          to="/reserve"
          variant="contained"
          sx={{
            background: "var(--venglish-gradient)",
            borderRadius: "10px",
            fontWeight: "bold",
          }}
        >
          Nueva Reserva
        </Button>
      </Box>
    </Box>
  );
}