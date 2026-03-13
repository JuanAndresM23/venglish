import { Link } from "react-router-dom";

export default function Index() {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <img 
          src="/img/venglish.jpeg" 
          alt="Venglish Logo" 
          style={styles.logo} 
        />
        <h1 style={styles.title}>Venglish Academy</h1>
        <p style={styles.subtitle}>Tu camino al éxito en inglés comienza aquí.</p>
      </header>

      <main style={styles.main}>
        <div style={styles.card}>
          <h3>Para Estudiantes</h3>
          <p>Reserva tus clases y revisa tu progreso.</p>
          <div style={styles.buttonGroup}>
            <Link to="/login" style={styles.buttonPrimary}>Iniciar Sesión</Link>
            <Link to="/register" style={styles.buttonSecondary}>Registrarse</Link>
          </div>
        </div>

        <div style={styles.card}>
          <h3>Teacher Victoria</h3>
          <p>Acceso exclusivo para gestión de la academia.</p>
          <Link to="/admin-login" style={styles.buttonAdmin}>Entrada Admin</Link>
        </div>
      </main>

      <footer style={styles.footer}>
        <p>© 2026 Venglish Academy - Profesora Victoria</p>
      </footer>
    </div>
  );
}

// Estilos rápidos en un objeto para que no necesites archivo CSS externo aún
const styles = {
  container: { textAlign: 'center', padding: '50px 20px', backgroundColor: '#f9f9f9', minHeight: '100vh' },
  header: { marginBottom: '40px' },
  logo: { width: '120px', borderRadius: '50%', marginBottom: '20px', border: '4px solid #fff', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' },
  title: { fontSize: '2.5rem', color: '#333', margin: 0 },
  subtitle: { color: '#666', fontSize: '1.1rem' },
  main: { display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' },
  card: { backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', width: '300px' },
  buttonGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
  buttonPrimary: { backgroundColor: '#4a90e2', color: '#fff', padding: '10px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' },
  buttonSecondary: { backgroundColor: '#fff', color: '#4a90e2', padding: '10px', borderRadius: '6px', textDecoration: 'none', border: '1px solid #4a90e2' },
  buttonAdmin: { backgroundColor: '#333', color: '#fff', padding: '10px', borderRadius: '6px', textDecoration: 'none', display: 'block' },
  footer: { marginTop: '50px', color: '#aaa', fontSize: '0.9rem' }
};