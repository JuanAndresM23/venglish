import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin({ setUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch("http://127.0.0.1:5000/api/admin_login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {
      // Actualizamos el estado global para que App.jsx sepa que es Admin
      const userRes = await fetch("http://127.0.0.1:5000/api/me", { credentials: "include" });
      const userData = await userRes.json();
      setUser(userData);
      navigate("/dashboard");
    } else {
      alert("Acceso denegado, Victoria.");
    }
  };

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h2>Victoria Login</h2>
      <form onSubmit={handleLogin} style={{ display: 'inline-block', textAlign: 'left' }}>
        <label>Usuario:</label><br />
        <input type="text" onChange={e => setUsername(e.target.value)} required /><br /><br />
        <label>Contraseña:</label><br />
        <input type="password" onChange={e => setPassword(e.target.value)} required /><br /><br />
        <button type="submit">Entrar al Panel</button>
      </form>
    </div>
  );
}