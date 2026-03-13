import { useState } from "react";

export default function StudentRegister() {
    const [formData, setFormData] = useState({ student_code: "", name: "", email: "", password: "" });

    const handleRegister = (e) => {
        e.preventDefault();
        fetch("http://127.0.0.1:5000/api/student_register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        }).then(res => res.ok ? alert("Registrado") : alert("Error"));
    };

    return (
        <form onSubmit={handleRegister}>
            <input placeholder="Código Estudiante" onChange={e => setFormData({...formData, student_code: e.target.value})} />
            <input placeholder="Nombre" onChange={e => setFormData({...formData, name: e.target.value})} />
            <input placeholder="Email" onChange={e => setFormData({...formData, email: e.target.value})} />
            <input type="password" placeholder="Password" onChange={e => setFormData({...formData, password: e.target.value})} />
            <button type="submit">Registrarse</button>
        </form>
    );
}