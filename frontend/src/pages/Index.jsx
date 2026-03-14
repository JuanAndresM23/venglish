import { Link } from "react-router-dom";
import '../index.css';
import heroImg from '../assets/hero-students.png';
export default function Index() {
  return (
    <div className="main-container"> 
      
      {/* 1. HERO SECTION */}
      <div className="section-wrapper">
        <section className="hero-section">
          {/* Blobs decorativos de fondo */}
          <div className="bg-blob blob-1"></div>
          <div className="bg-blob blob-1"></div>
  <div className="bg-blob blob-2"></div>
  <div className="bg-blob blob-2"></div>
  {/* Nuevos blobs */}
  <div className="bg-blob blob-3"></div>
   <div className="bg-blob blob-3"></div>
  <div className="bg-blob blob-4"></div>
   <div className="bg-blob blob-4"></div>
         
          {/* Nueva imagen de estudiantes */}

           <div className="hero-image-container">
    <img 
      src={heroImg} 
      alt="Students studying English" 
      className="hero-image" 
    />
  </div>

          <h2 className="main-slogan">Your English, Your Way</h2>
          <p className="hero-description">
            Personalized learning experience designed to fit your lifestyle.
            Master English with Victoria.
          </p>
           <div className="hero-actions">
              <a href="#testimonies" className="login-btn">
           Testimonios
          </a>
          <a href=" #benefits" className="login-btn">
           Beneficios
          </a>
          <a href="#doubts" className="login-btn">
            ¿Dudas?
          </a>
           </div>
        
        </section>
      </div>

      {/* 2. TESTIMONIALS */}
      <div className="section-wrapper" id="testimonies">
        <section className="general-section">
          <h2 className="section-title">What Our Students Say</h2>
          <div className="testimonial-container">
            <div className="venglish-card card-p30">
              <p>"Victoria makes learning so easy. I finally feel confident speaking!"</p>
              <small><strong>- Maria G.</strong></small>
            </div>
            <div className="venglish-card card-p30">
              <p>"The best academy in terms of flexibility and real conversation."</p>
              <small><strong>- Carlos R.</strong></small>
            </div>
            <div className="venglish-card card-p30">
              <p>"The best academy in terms of flexibility and real conversation."</p>
              <small><strong>- Carlos R.</strong></small>
            </div>
            <div className="venglish-card card-p30">
              <p>"The best academy in terms of flexibility and real conversation."</p>
              <small><strong>- Carlos R.</strong></small>
            </div>
            <div className="venglish-card card-p30">
              <p>"The best academy in terms of flexibility and real conversation."</p>
              <small><strong>- Carlos R.</strong></small>
            </div>
          </div>
        </section>
      </div>

      {/* 3. BENEFICIOS */}
      <div className="section-wrapper" id="benefits">
        <section className="general-section">
          <div className="bg-blob blob-2"></div>
          <h2 className="section-title">¿Por qué elegir Venglish?</h2>
          <p className="section-subtitle">Diseñado para adaptarse a tu vida, no al revés.</p>

          <div className="grid-container">
            <div className="venglish-card card-p30">
              <div className="icon-circle">📅</div>
              <h3>Flexibilidad Total</h3>
              <ul className="benefits-list">
                <li>✅ Escoge tu horario toda la semana.</li>
                <li>✅ Toma las clases que desees.</li>
                <li>✅ Sin cláusula de permanencia.</li>
              </ul>
            </div>

            <div className="venglish-card card-p30 ">
              <div className="icon-circle">🚀</div>
              <h3>Tu Proceso</h3>
              <ul className="benefits-list">
                <li>✅ Derecho a cancelar 2 clases.</li>
                <li>✅ Acompañamiento completo.</li>
                <li>✅ Atención 24/7.</li>
              </ul>
            </div>

            <div className="venglish-card card-p30">
              <div className="icon-circle">💬</div>
              <h3>Comunidad Activa</h3>
              <ul className="benefits-list">
                <li>✅ Acceso a comunidad.</li>
                <li>✅ Retos semanales.</li>
                <li>✅ Networking.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      {/* 4. MEDIOS DE COMUNICACIÓN */}
      <div className="section-wrapper" id="doubts">
        <section className="general-section">
          <h2 className="section-title">¡Hablemos!</h2>
          <p className="hero-description">
            ¿Tienes dudas? Contáctanos por cualquiera de nuestros canales oficiales:
          </p>

          <div className="grid-container">
            <div className="venglish-card card-p30">
              <div className="icon-circle">📱</div>
              <h3>WhatsApp</h3>
              <a href="https://wa.me/tu_numero" target="_blank" rel="noreferrer" className="login-btn">
                Chatear ahora
              </a>
            </div>

            <div className="venglish-card card-p30">
              <div className="icon-circle">📸</div>
              <h3>Instagram</h3>
              <a href="https://instagram.com/venglish" target="_blank" rel="noreferrer" className="login-btn" style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}>
                Seguirnos
              </a>
            </div>

            <div className="venglish-card card-p30">
              <div className="icon-circle">📧</div>
              <h3>Correo</h3>
              <a href="mailto:info@venglish.com" className="login-btn" style={{ background: '#333' }}>
                Enviar Mail
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER & LOGINS */}
      <footer className="main-footer">
        <p>© 2026 Venglish Academy | Medellín, Colombia</p>
        <div className="footer-links">
          <Link to="/login">Portal Estudiantes</Link>
          <span>|</span>
          <Link to="/admin-login">Acceso Admin</Link>
        </div>
      </footer>
    </div>
  );
}