import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function ListStudents() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/list_student") // Esta ruta en app.py ahora debe devolver jsonify
      .then(res => res.json())
      .then(data => setStudents(data))
      .catch(err => console.error("Error cargando estudiantes:", err));
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Lista de Estudiantes</h1>
      <ul>
        {students.map((student) => (
          <li key={student.id}>
            <strong>{student.name}</strong> - {student.email} ({student.phone})
          </li>
        ))}
      </ul>
      <Link to="/dashboard">Volver al Dashboard</Link>
    </div>
  );
}