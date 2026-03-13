import { useState, useEffect } from "react";

export default function ReserveClass() {
    const [courses, setCourses] = useState([]);
    const [form, setForm] = useState({ course_id: "", date: "", time: "" });

    useEffect(() => {
        fetch("http://127.0.0.1:5000/api/reserve").then(res => res.json()).then(setCourses);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        fetch("http://127.0.0.1:5000/api/reserve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form)
        }).then(() => alert("Reservado!"));
    };

    return (
        <form onSubmit={handleSubmit}>
            <select onChange={e => setForm({...form, course_id: e.target.value})} required>
                <option value="">Selecciona curso</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="date" onChange={e => setForm({...form, date: e.target.value})} required />
            <input type="time" onChange={e => setForm({...form, time: e.target.value})} required />
            <button type="submit">Reservar Clase</button>
        </form>
    );
}