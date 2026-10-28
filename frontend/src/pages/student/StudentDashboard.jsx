import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import { cancelBooking, listMyClasses } from "../../api/bookings";
import EventNoteIcon from "@mui/icons-material/EventNote";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import GradientButton from "../../components/ui/GradientButton";
import DataCard from "../../components/ui/DataCard";
import PageContainer from "../../components/ui/PageContainer";
import PageHeader from "../../components/ui/PageHeader";
import SurfaceCard from "../../components/ui/SurfaceCard";
import useIsMobile from "../../hooks/useIsMobile";
import { alertError, confirmAction, toastSuccess } from "../../utils/alerts";
import { formatDuration, formatTimeRange } from "../../utils/format";

export default function StudentDashboard() {
  const [classes, setClasses] = useState([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    listMyClasses()
      .then((data) => setClasses(Array.isArray(data) ? data : []))
      .catch((error) => console.error("Error cargando clases:", error));
  }, []);

  const handleCancel = async (bookingId) => {
    const confirmed = await confirmAction({
      title: "¿Cancelar esta clase?",
      text: "Solo puedes cancelar hasta 12 horas antes de la clase.",
      confirmText: "Sí, cancelar clase",
      cancelText: "Conservar",
      danger: true,
    });
    if (!confirmed) return;

    try {
      await cancelBooking(bookingId);
      setClasses((current) => current.filter((item) => item.id !== bookingId));
      toastSuccess("Clase cancelada correctamente");
    } catch (error) {
      alertError("No se pudo cancelar", error.message || "No fue posible cancelar la clase.");
    }
  };

  return (
    <PageContainer maxWidth={950}>
      <PageHeader
        icon={EventNoteIcon}
        title="Mis clases"
        subtitle="Tus clases agendadas con VEnglish Academy."
        actions={
          <GradientButton component={Link} to="/reserve" startIcon={<AddCircleIcon />}>
            Nueva reserva
          </GradientButton>
        }
      />

      {isMobile ? (
        <Box display="flex" flexDirection="column" gap={2}>
          {classes.length > 0 ? (
            classes.map((c) => (
              <DataCard
                key={c.id}
                title={c.course}
                fields={[
                  { label: "Profesor", value: c.teacher || "Sin asignar" },
                  { label: "Fecha", value: c.date },
                  { label: "Horario", value: formatTimeRange(c.time, c.duration) },
                  { label: "Duración", value: formatDuration(c.duration) },
                ]}
                actions={
                  <Button
                    color="error"
                    variant="outlined"
                    fullWidth
                    onClick={() => handleCancel(c.id)}
                    sx={{ textTransform: "none", borderRadius: "10px" }}
                  >
                    Cancelar clase
                  </Button>
                }
              />
            ))
          ) : (
            <SurfaceCard>
              <Typography align="center" color="text.secondary">
                Aún no tienes clases programadas.
              </Typography>
            </SurfaceCard>
          )}
        </Box>
      ) : (
        <SurfaceCard sx={{ p: { xs: 1, md: 2 } }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {["Curso", "Profesor", "Fecha", "Horario", "Duración", "Acciones"].map((title) => (
                  <TableCell
                    key={title}
                    sx={{ fontWeight: 700, background: "#fff5fa", color: "var(--venglish-black)" }}
                  >
                    {title}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {classes.length > 0 ? (
                classes.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell>{c.course}</TableCell>
                    <TableCell>{c.teacher || "Sin asignar"}</TableCell>
                    <TableCell>{c.date}</TableCell>
                    <TableCell>{formatTimeRange(c.time, c.duration)}</TableCell>
                    <TableCell>{formatDuration(c.duration)}</TableCell>
                    <TableCell>
                      <Button
                        color="error"
                        variant="outlined"
                        size="small"
                        onClick={() => handleCancel(c.id)}
                        sx={{ textTransform: "none", borderRadius: "10px" }}
                      >
                        Cancelar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography sx={{ py: 3, color: "text.secondary" }}>
                      Aún no tienes clases programadas.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        </SurfaceCard>
      )}
    </PageContainer>
  );
}
