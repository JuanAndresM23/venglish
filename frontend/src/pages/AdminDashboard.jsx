import { useEffect, useState } from "react";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Typography,
} from "@mui/material";

import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import SchoolIcon from "@mui/icons-material/School";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import DateRangeIcon from "@mui/icons-material/DateRange";
import RefreshIcon from "@mui/icons-material/Refresh";

import { apiFetch } from "../api";
import "../css/AdminDashboard.css";

function StatCard({
  title,
  value,
  icon,
  background,
}) {
  return (
    <Paper
      className="admin-stat-card"
      elevation={0}
      sx={{
        background,
      }}
    >
      <Box className="admin-stat-icon">
        {icon}
      </Box>

      <Box>
        <Typography
          variant="body2"
          className="admin-stat-label"
        >
          {title}
        </Typography>

        <Typography
          variant="h4"
          className="admin-stat-value"
        >
          {value ?? 0}
        </Typography>
      </Box>
    </Paper>
  );
}

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);

  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    bookings: 0,
    week_bookings: 0,
  });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [eventsData, statsData] =
        await Promise.all([
          apiFetch("/api/admin/dashboard"),
          apiFetch("/api/admin/stats"),
        ]);

      setEvents(
        Array.isArray(eventsData)
          ? eventsData
          : []
      );

      setStats(statsData);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "No fue posible cargar el panel."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleEventClick = async (
    info
  ) => {
    const eventId = info.event.id;

    if (!eventId) {
      return;
    }

    const confirmed =
      window.confirm(
        `¿Deseas cancelar la reserva "${info.event.title}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      await apiFetch(
        `/api/bookings/${eventId}`,
        {
          method: "DELETE",
        }
      );

      info.event.remove();

      setSuccess(
        "Reserva cancelada correctamente."
      );

      fetchDashboard();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "No fue posible cancelar la reserva."
      );
    }
  };

  if (loading) {
    return (
      <Box className="admin-loading">
        <CircularProgress
          sx={{
            color:
              "var(--venglish-pink)",
          }}
        />

        <Typography>
          Cargando panel...
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="admin-page-wrapper">
      <Box className="admin-header">
        <Box>
          <Typography className="admin-title">
            Panel Administrativo
          </Typography>

          <Typography className="admin-subtitle">
            Gestión de reservas y
            estadísticas de VEnglish
            Academy.
          </Typography>
        </Box>

        <Button
          startIcon={<RefreshIcon />}
          onClick={fetchDashboard}
          variant="outlined"
          sx={{
            borderColor:
              "var(--venglish-pink)",
            color:
              "var(--venglish-pink)",
            borderRadius: "12px",
            fontWeight: "bold",
          }}
        >
          Actualizar
        </Button>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{
            width: "100%",
            maxWidth: "1100px",
            mb: 3,
          }}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{
            width: "100%",
            maxWidth: "1100px",
            mb: 3,
          }}
        >
          {success}
        </Alert>
      )}

      <Grid
        container
        spacing={3}
        className="admin-stats-grid"
      >
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Estudiantes"
            value={stats.students}
            icon={<PeopleAltIcon />}
            background="linear-gradient(135deg,#ff4bb0,#ff7bc3)"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Docentes"
            value={stats.teachers}
            icon={<SchoolIcon />}
            background="linear-gradient(135deg,#ff9d5c,#ffbf87)"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Clases"
            value={stats.bookings}
            icon={<EventAvailableIcon />}
            background="linear-gradient(135deg,#ae47ce,#cf79e5)"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Esta Semana"
            value={stats.week_bookings}
            icon={<DateRangeIcon />}
            background="linear-gradient(135deg,#f4b942,#ffdb58)"
          />
        </Grid>
      </Grid>

      <Box className="calendar-section-header">
        <Box>
          <Typography
            variant="h5"
            fontWeight="bold"
          >
            Agenda de Clases
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Haz clic en una clase para
            cancelarla.
          </Typography>
        </Box>
      </Box>

      <Paper
        className="calendar-card"
        elevation={0}
      >
        <FullCalendar
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            interactionPlugin,
          ]}
          initialView="dayGridMonth"
          locale={esLocale}
          events={events}
          eventClick={handleEventClick}
          height="auto"
          buttonText={{
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
          }}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right:
              "dayGridMonth,timeGridWeek,timeGridDay",
          }}
        />
      </Paper>
    </Box>
  );
}