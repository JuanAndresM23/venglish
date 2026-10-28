import { useCallback, useEffect, useState } from "react";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import esLocale from "@fullcalendar/core/locales/es";

import { Alert, Box, Button, Grid, Typography } from "@mui/material";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import SchoolIcon from "@mui/icons-material/School";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import DateRangeIcon from "@mui/icons-material/DateRange";
import RefreshIcon from "@mui/icons-material/Refresh";
import DashboardIcon from "@mui/icons-material/Dashboard";

import { cancelBooking } from "../../api/bookings";
import { getDashboardEvents, getStats } from "../../api/admin";
import LoadingState from "../../components/ui/LoadingState";
import PageContainer from "../../components/ui/PageContainer";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import SurfaceCard from "../../components/ui/SurfaceCard";
import useIsMobile from "../../hooks/useIsMobile";
import { alertError, confirmAction, toastSuccess } from "../../utils/alerts";
import { formatDuration, formatTimeRange } from "../../utils/format";
import { escapeHtml } from "../../utils/html";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isMobile = useIsMobile();

  // Al estrechar la ventana, la vista de semana/día se reemplaza por la lista.
  const handleWindowResize = ({ view }) => {
    const narrow = window.innerWidth < 600;
    if (narrow && view.type !== "listWeek" && view.type !== "dayGridMonth") {
      view.calendar.changeView("listWeek");
    }
  };

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [eventsData, statsData] = await Promise.all([getDashboardEvents(), getStats()]);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setStats(statsData);
    } catch (err) {
      setError(err.message || "No fue posible cargar el panel.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleEventClick = async ({ event }) => {
    if (!event.id) return;

    const { course, teacher, duration } = event.extendedProps;
    const start = event.start;
    const date = start.toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const time = start.toTimeString().slice(0, 5);

    const confirmed = await confirmAction({
      title: "¿Cancelar esta reserva?",
      html: `
        <div style="text-align:left;line-height:1.7">
          <b>${escapeHtml(event.title)}</b><br/>
          Curso: ${escapeHtml(course)}<br/>
          Docente: ${escapeHtml(teacher)}<br/>
          Fecha: ${escapeHtml(date)}<br/>
          Horario: ${escapeHtml(formatTimeRange(time, duration))} (${escapeHtml(formatDuration(duration))})
        </div>`,
      confirmText: "Sí, cancelar reserva",
      cancelText: "Conservar",
      danger: true,
    });
    if (!confirmed) return;

    try {
      await cancelBooking(event.id);
      toastSuccess("Reserva cancelada correctamente");
      loadDashboard();
    } catch (err) {
      alertError("No se pudo cancelar", err.message || "No fue posible cancelar la reserva.");
    }
  };

  if (loading && events.length === 0 && !error) {
    return <LoadingState message="Cargando panel..." />;
  }

  const isSuperadmin = Boolean(stats.is_superadmin);
  const cards = [
    isSuperadmin && {
      title: "Estudiantes",
      value: stats.students,
      icon: <PeopleAltIcon />,
      background: "linear-gradient(135deg,#ff4bb0,#ff7bc3)",
    },
    isSuperadmin && {
      title: "Docentes",
      value: stats.teachers,
      icon: <SchoolIcon />,
      background: "linear-gradient(135deg,#ff9d5c,#ffbf87)",
    },
    {
      title: "Clases próximas",
      value: stats.upcoming_bookings,
      icon: <EventAvailableIcon />,
      background: "linear-gradient(135deg,#ae47ce,#cf79e5)",
    },
    {
      title: "Esta semana",
      value: stats.week_bookings,
      icon: <DateRangeIcon />,
      background: "linear-gradient(135deg,#f4b942,#ffdb58)",
    },
  ].filter(Boolean);

  return (
    <PageContainer>
      <PageHeader
        icon={DashboardIcon}
        title="Panel administrativo"
        subtitle="Gestión de reservas y estadísticas de VEnglish Academy."
        actions={
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadDashboard}
            variant="outlined"
            sx={{
              borderColor: "var(--venglish-pink)",
              color: "var(--venglish-pink)",
              borderRadius: "12px",
              fontWeight: "bold",
              textTransform: "none",
            }}
          >
            Actualizar
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={{ xs: 1.5, md: 3 }} sx={{ mb: 5 }}>
        {cards.map((card) => (
          <Grid key={card.title} size={{ xs: 6, md: 12 / cards.length }} sx={{ display: "flex" }}>
            <StatCard {...card} />
          </Grid>
        ))}
      </Grid>

      <Box mb={2.5}>
        <Typography variant="h5" fontWeight="bold">
          Agenda de clases
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Haz clic en una clase para ver el detalle y cancelarla.
        </Typography>
      </Box>

      <SurfaceCard className="calendar-card" sx={{ p: { xs: 1.5, md: 3 } }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView={isMobile ? "listWeek" : "dayGridMonth"}
          windowResize={handleWindowResize}
          locale={esLocale}
          events={events}
          eventClick={handleEventClick}
          height="auto"
          buttonText={{ today: "Hoy", month: "Mes", week: "Semana", day: "Día", list: "Lista" }}
          noEventsText="No hay clases en este periodo"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: isMobile ? "listWeek,dayGridMonth" : "dayGridMonth,timeGridWeek,timeGridDay",
          }}
        />
      </SurfaceCard>
    </PageContainer>
  );
}
