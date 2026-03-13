import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Aquí podrías crear una ruta /api/admin/events que devuelva el JSON que antes hacías en Flask
    fetch("http://127.0.0.1:5000/dashboard") // Necesitarás que esta ruta devuelva JSON
      .then(res => res.json())
      .then(data => setEvents(data));
  }, []);

  return (
    <div>
      <h1>Panel de Victoria</h1>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={(info) => {
          if(window.confirm("¿Cancelar clase?")) {
             fetch(`http://127.0.0.1:5000/delete_booking/${info.event.id}`)
               .then(() => info.event.remove());
          }
        }}
      />
    </div>
  );
}