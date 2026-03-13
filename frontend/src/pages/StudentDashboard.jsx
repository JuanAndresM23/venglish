import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function StudentDashboard() {
    const [classes, setClasses] = useState([]);

    useEffect(() => {
        fetch("http://127.0.0.1:5000/api/my_classes").then(res => res.json()).then(setClasses);
    }, []);

    return (
        <div>
            <h1>Tus Clases</h1>
            <table>
                <thead>
                    <tr><th>Curso</th><th>Fecha</th><th>Hora</th></tr>
                </thead>
                <tbody>
                    {classes.map(c => (
                        <tr key={c.id}>
                            <td>{c.course}</td><td>{c.date}</td><td>{c.time}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <Link to="/reserve">Nueva Reserva</Link>
        </div>
    );
}
