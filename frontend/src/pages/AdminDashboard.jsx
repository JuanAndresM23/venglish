import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction'; // Necesario para clics y arrastre
import esLocale from '@fullcalendar/core/locales/es'; // Para ponerlo en español
import '../css/AdminDashboard.css';

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Cargar eventos desde Flask
const fetchEvents = async () => {
  try {
    // 1. Usamos la ruta completa y correcta
    // 2. Agregamos credentials: 'include' para que Flask sepa que eres Admin
    const response = await fetch(`${API_URL}/api/admin/dashboard`, {
      credentials: "include" 
    });

    if (!response.ok) {
      console.error("Error en servidor:", response.status);
      return;
    }

    const data = await response.json();
    console.log("DATOS LLEGANDO:", data); // REVISA LA CONSOLA (F12)
    setEvents(data);
  } catch (error) {
    console.error("Error de conexión:", error);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchEvents();
  }, []);

  // 2. Manejar la eliminación
  const handleEventClick = async (info) => {
    // IMPORTANTE: Asegúrate de que el ID no sea undefined
    const eventId = info.event.id;
    const eventTitle = info.event.title;

    if (!eventId) {
        console.error("Error: El evento no tiene un ID asignado.");
        return;
    }

    if (window.confirm(`¿Estás seguro de que deseas cancelar la clase: "${eventTitle}"?`)) {
        try {
      const response = await fetch(`${API_URL}/delete_booking/${eventId}`, {
    method: 'DELETE',
    credentials: 'include', 
    headers: {
        'Content-Type': 'application/json'
    }
});

            if (response.ok) {
                info.event.remove(); 
                alert("Reserva eliminada con éxito");
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error || "No se pudo eliminar"}`);
            }
        } catch (error) {
            console.error("Error en la petición:", error);
            alert("Hubo un problema de conexión con el servidor.");
        }
    }
};

  if (loading) return <div style={{textAlign: 'center', padding: '20px'}}>Cargando agenda...</div>;

return (
  <div className="admin-page-wrapper">
    <h1 className="admin-title">Panel de Administración Victoria</h1>
    
    <div className="calendar-card">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale={esLocale} // Para que los días salgan en español
        
        /* --- ESTA ES LA CLAVE --- */
        events={events} 
        /* ------------------------ */

        eventClick={handleEventClick} // Para que funcione tu función de borrar
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek'
        }}
        height="auto"
      />
    </div>
  </div>
);
}