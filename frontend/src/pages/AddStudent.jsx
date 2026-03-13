import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function AddStudent() {
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("http://127.0.0.1:5000/add_student", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData)
    });

    if (res.ok) {
      alert("Estudiante añadido con éxito");
      navigate("/list-students"); // Te redirige a la lista para ver el cambio
    } else {
      alert("Error al añadir estudiante");
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Añadir Nuevo Estudiante</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
        <input type="text" placeholder="Nombre" onChange={e => setFormData({...formData, name: e.target.value})} required />
        <input type="text" placeholder="Teléfono" onChange={e => setFormData({...formData, phone: e.target.value})} />
        <input type="email" placeholder="Email" onChange={e => setFormData({...formData, email: e.target.value})} />
        <button type="submit">Guardar Estudiante</button>
      </form>
      <br />
      <Link to="/dashboard">Volver al Dashboard</Link>
    </div>
  );
}