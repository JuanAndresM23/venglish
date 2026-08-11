import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { 
  FaInstagram, FaWhatsapp, FaCalendar, FaHandsHelping, 
  FaComments, FaSignal, FaHeadphones, FaBookOpen, 
  FaPenNib, FaBookReader, FaMicrophone, FaChevronDown 
} from "react-icons/fa";
import { CgMailOpen } from "react-icons/cg";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import AOS from 'aos';
import { CiFacebook } from "react-icons/ci";

import 'swiper/css';
import 'swiper/css/pagination';
import 'aos/dist/aos.css';
import "../css/index.css";
import heroImg from "../assets/hero-students.png";

export default function Index() {
  const [showPolicy, setShowPolicy] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });

    // Mostrar modal solo si no lo ha visto antes
    const seen = sessionStorage.getItem("policy_seen");
    if (!seen) {
      setShowPolicy(true);
    }
  }, []);

  const handleAcceptPolicy = () => {
    sessionStorage.setItem("policy_seen", "true");
    setShowPolicy(false);
  };

  return (
    <div className="main-container">

      {/* ============================================================ */}
      {/* MODAL DE POLÍTICAS */}
      {/* ============================================================ */}
      {showPolicy && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9999,
          display: "flex", justifyContent: "center", alignItems: "center",
          padding: "20px", boxSizing: "border-box"
        }}>
          <div style={{
            backgroundColor: "white", borderRadius: "20px",
            padding: "40px", maxWidth: "600px", width: "100%",
            maxHeight: "85vh", overflowY: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
          }}>
            <h2 style={{ 
              textAlign: "center", marginBottom: "8px",
              background: "linear-gradient(135deg, #ff4bb0, #ffdb58)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>
              📋 Políticas de Venglish Academy
            </h2>
            <p style={{ textAlign: "center", color: "#888", marginBottom: "24px", fontSize: "0.9rem" }}>
              Por favor lee nuestras políticas antes de continuar
            </p>

            {[
              {
                emoji: "📅",
                title: "Agendamiento",
                rules: [
                  "Las clases deben agendarse con mínimo 48 horas de anticipación.",
                  "Solo puedes seleccionar el horario disponible de cada profesora.",
                  "El sistema bloquea automáticamente horarios ya ocupados."
                ]
              },
              {
                emoji: "❌",
                title: "Cancelaciones",
                rules: [
                  "Puedes cancelar tu clase hasta 12 horas antes de la hora programada.",
                  "Si cancelas con menos de 12 horas, la clase se descuenta como vista.",
                  "Las clases canceladas después del límite NO se reprograman."
                ]
              },
              {
                emoji: "⏰",
                title: "Puntualidad",
                rules: [
                  "Las clases inician en el horario acordado.",
                  "Si llegas tarde, la clase termina a la hora pactada de todas formas.",
                  "Tienes derecho a cancelar máximo 2 clases por mes sin descuento."
                ]
              },
              {
                emoji: "🔔",
                title: "Recordatorios",
                rules: [
                  "Recibirás un recordatorio por correo 24 horas antes de tu clase.",
                  "Asegúrate de tener tu correo actualizado en el sistema."
                ]
              },
              {
                emoji: "📌",
                title: "General",
                rules: [
                  "No hay contratos de permanencia.",
                  "El contenido se adapta a tu nivel y ritmo de aprendizaje.",
                  "Para cualquier duda escríbenos a venglishcolombia@gmail.com"
                ]
              }
            ].map((section, i) => (
              <div key={i} style={{ 
                marginBottom: "20px", padding: "16px",
                backgroundColor: "#f9f9f9", borderRadius: "12px",
                borderLeft: "4px solid #ff4bb0"
              }}>
                <h3 style={{ margin: "0 0 10px 0", fontSize: "1rem" }}>
                  {section.emoji} {section.title}
                </h3>
                <ul style={{ margin: 0, paddingLeft: "20px" }}>
                  {section.rules.map((rule, j) => (
                    <li key={j} style={{ color: "#555", fontSize: "0.9rem", lineHeight: "1.8" }}>
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <button
              onClick={handleAcceptPolicy}
              style={{
                width: "100%", padding: "14px",
                background: "linear-gradient(135deg, #ff4bb0, #ffdb58)",
                border: "none", borderRadius: "12px",
                color: "white", fontWeight: "bold", fontSize: "1rem",
                cursor: "pointer", marginTop: "10px"
              }}
            >
              ✅ Entendido, continuar
            </button>
          </div>
        </div>
      )}

      {/* 1. SECCIÓN PRINCIPAL (HERO) */}
      <div className="section-wrapper">
        <section className="hero-section">
          <div className="bg-blob blob-1"></div>
          <div className="bg-blob blob-2"></div>
          <div className="hero-image-container" data-aos="zoom-in">
            <img src={heroImg} alt="Estudiantes estudiando inglés" className="hero-image" />
          </div>
          <h2 className="main-slogan" data-aos="fade-up">Tu inglés, a tu manera</h2>
          <p className="hero-description" data-aos="fade-up" data-aos-delay="200">
            Experiencia de aprendizaje personalizada diseñada para adaptarse a tu estilo de vida.
            Domina el inglés con Victoria.
          </p>
          <div className="hero-actions" data-aos="fade-up" data-aos-delay="400">
            <a href="#skills" className="login-btn">¿Que aprendere?</a>
            <a href="#benefits" className="login-btn">Beneficios</a>
            <a href="#testimonies" className="login-btn">Testimonios</a>
            <a href="#faq" className="login-btn">Políticas</a>
            <a href="#doubts" className="login-btn">¿Dudas?</a>
          </div>
        </section>
      </div>

      {/* 2. HABILIDADES */}
      <div className="section-wrapper" id="skills">
        <section className="general-section">
          <h2 className="section-title" data-aos="fade-down">Domina las 4 Habilidades</h2>
          <p className="section-subtitle">Un aprendizaje integral para que seas bilingüe de verdad.</p>
          <div className="grid-container">
            <div className="venglish-card card-p30" data-aos="fade-up" data-aos-delay="100">
              <div className="icon-circle"><FaHeadphones /></div>
              <h3>Escucha (Listening)</h3>
              <p>Entrena tu oído con acentos reales y mejora tu comprensión auditiva.</p>
            </div>
            <div className="venglish-card card-p30" data-aos="fade-up" data-aos-delay="200">
              <div className="icon-circle"><FaMicrophone /></div>
              <h3>Habla (Speaking)</h3>
              <p>Pierde el miedo a hablar con sesiones enfocadas en fluidez natural.</p>
            </div>
            <div className="venglish-card card-p30" data-aos="fade-up" data-aos-delay="300">
              <div className="icon-circle"><FaBookReader /></div>
              <h3>Lectura (Reading)</h3>
              <p>Mejora tu vocabulario y comprensión con textos de tu interés.</p>
            </div>
            <div className="venglish-card card-p30" data-aos="fade-up" data-aos-delay="400">
              <div className="icon-circle"><FaPenNib /></div>
              <h3>Escritura y Gramática</h3>
              <p>Aprende las estructuras correctas para escribir con orden y claridad.</p>
            </div>
          </div>
        </section>
      </div>

      {/* 3. BENEFICIOS */}
      <div className="section-wrapper" id="benefits">
        <section className="general-section">
          <div className="bg-blob blob-2"></div>
          <h2 className="section-title" data-aos="fade-down">¿Por qué elegir Venglish?</h2>
          <p className="section-subtitle">Diseñado para adaptarse a tu vida, no al revés.</p>
          <div className="grid-container">
            <div className="venglish-card card-p30" data-aos="flip-left">
              <div className="icon-circle"><FaCalendar /></div>
              <h3>Flexibilidad Total</h3>
              <ul className="benefits-list">
                <li>✅ Escoge tu horario toda la semana.</li>
                <li>✅ Toma las clases que desees.</li>
                <li>✅ Sin cláusula de permanencia.</li>
              </ul>
            </div>
            <div className="venglish-card card-p30" data-aos="flip-left" data-aos-delay="200">
              <div className="icon-circle"><FaHandsHelping /></div>
              <h3>Tu Proceso</h3>
              <ul className="benefits-list">
                <li>✅ Derecho a cancelar 2 clases.</li>
                <li>✅ Acompañamiento completo.</li>
                <li>✅ Atención Constante.</li>
              </ul>
            </div>
            <div className="venglish-card card-p30" data-aos="flip-left" data-aos-delay="400">
              <div className="icon-circle"><FaComments /></div>
              <h3>Comunidad Activa</h3>
              <ul className="benefits-list">
                <li>✅ Acceso a comunidad.</li>
                <li>✅ Retos semanales.</li>
                <li>✅ Networking.</li>
              </ul>
            </div>
            <div className="venglish-card card-p30" data-aos="flip-left" data-aos-delay="600">
              <div className="icon-circle"><FaSignal /></div>
              <h3>Tu Nivel Ideal</h3>
              <ul className="benefits-list">
                <li>✅ Nivel inicial, medio o avanzado.</li>
                <li>✅ Contenido adaptado a tu ritmo.</li>
                <li>✅ Aprende sin presiones externas.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      {/* 4. TESTIMONIOS */}
      <div className="section-wrapper" id="testimonies" data-aos="fade-in">
        <section className="general-section">
          <h2 className="section-title">Lo que dicen nuestros estudiantes</h2>
          <Swiper
            modules={[Pagination, Autoplay]}
            spaceBetween={20}
            slidesPerView={1}
            pagination={{ clickable: true }}
            autoplay={{ delay: 3000 }}
            breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
            className="testimonial-swiper"
          >
            {[1, 2, 3, 4, 5, 6].map((_, index) => (
              <SwiperSlide key={index}>
                <div className="venglish-card card-p30">
                  <p>"¡Victoria hace que aprender sea muy fácil. Finalmente me siento seguro hablando!"</p>
                  <small><strong>- María G.</strong></small>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      </div>

      {/* 5. FAQ Y POLÍTICAS */}
      <div className="section-wrapper" id="faq">
        <section className="general-section">
          <h2 className="section-title" data-aos="fade-up">Políticas y Preguntas Frecuentes</h2>
          <p className="section-subtitle" data-aos="fade-up">Todo lo que necesitas saber antes de empezar.</p>
          <div className="grid-container" style={{ alignItems: 'start' }}>
            {[
              { q: "¿Con cuánta anticipación debo agendar?", a: "Debes agendar tu clase con mínimo 48 horas de anticipación. El sistema no permitirá reservas fuera de este límite." },
              { q: "¿Puedo cancelar mi clase?", a: "Sí, puedes cancelar hasta 12 horas antes de la clase. Si cancelas después de ese tiempo, la clase se descuenta como vista y no se reprograma." },
              { q: "¿Cuántas cancelaciones puedo hacer?", a: "Tienes derecho a cancelar máximo 2 clases por mes sin descuento, siempre con más de 12 horas de anticipación." },
              { q: "¿Necesito conocimientos previos?", a: "¡Para nada! En Venglish nos adaptamos a tu nivel, desde cero absoluto hasta avanzado." },
              { q: "¿Cómo es la flexibilidad de horarios?", a: "Tú eliges tus sesiones según la disponibilidad de las profesoras. El sistema muestra en tiempo real qué horarios están disponibles." },
              { q: "¿Hay contratos de permanencia?", a: "No. Queremos que te quedes por los resultados, no por obligación legal." }
            ].map((item, index) => (
              <details key={index} className="venglish-card" style={{ cursor: 'pointer', textAlign: 'left' }} data-aos="zoom-in" data-aos-delay={index * 100}>
                <summary style={{ padding: '20px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', listStyle: 'none' }}>
                  {item.q}
                  <FaChevronDown size={14} style={{ minWidth: '14px' }} />
                </summary>
                <div style={{ padding: '0 20px 20px 20px', color: '#666', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>

      {/* 6. CONTACTO */}
      <div className="section-wrapper" id="doubts">
        <section className="general-section">
          <h2 className="section-title">¡Hablemos!</h2>
          <div className="grid-container">
            <div className="venglish-card card-p30" data-aos="zoom-in">
              <div className="icon-circle"><CiFacebook /></div>
              <h3>Facebook</h3>
              <a href="https://wa.me/tu_numero" target="_blank" rel="noreferrer" className="login-btn">Chatear ahora</a>
            </div>
            <div className="venglish-card card-p30" data-aos="zoom-in" data-aos-delay="200">
              <div className="icon-circle"><FaInstagram /></div>
              <h3>Instagram</h3>
              <a href="https://instagram.com/venglish" target="_blank" rel="noreferrer" className="login-btn" style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}>Seguirnos</a>
            </div>
            <div className="venglish-card card-p30" data-aos="zoom-in" data-aos-delay="400">
              <div className="icon-circle"><CgMailOpen /></div>
              <h3>Correo</h3>
              <a href="mailto:venglishcolombia@gmail.com" className="login-btn">Enviar correo</a>
            </div>
          </div>
        </section>
      </div>

      <footer className="main-footer">
        <p>© 2026 Academia Venglish | Medellín, Colombia</p>
        <div className="footer-links">
          <Link to="/login">Portal Estudiantes</Link>
          <span>|</span>
          <Link to="/admin-login">Acceso Admin</Link>
        </div>
      </footer>
    </div>
  );
}