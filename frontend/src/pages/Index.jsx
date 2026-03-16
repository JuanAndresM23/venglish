import React, { useEffect } from 'react';
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


// Estilos
import 'swiper/css';
import 'swiper/css/pagination';
import 'aos/dist/aos.css';
import "../index.css";
import heroImg from "../assets/hero-students.png";

export default function Index() {
  
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

  return (
    <div className="main-container">
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
                <li>✅ Atención 24/7.</li>
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
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
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

      {/* 5. PREGUNTAS FRECUENTES (FAQ) */}
      <div className="section-wrapper" id="faq">
        <section className="general-section">
          <h2 className="section-title" data-aos="fade-up">Preguntas Frecuentes</h2>
          <p className="section-subtitle" data-aos="fade-up">Todo lo que necesitas saber antes de empezar.</p>
          <div className="grid-container" style={{ alignItems: 'start' }}>
            {[
              { q: "¿Necesito conocimientos previos?", a: "¡Para nada! En Venglish nos adaptamos a tu nivel, desde cero absoluto hasta avanzado." },
              { q: "¿Cómo es la flexibilidad de horarios?", a: "Tú eliges tus sesiones semana a semana según tu disponibilidad real." },
              { q: "¿Las clases son grupales?", a: "Nuestra metodología es personalizada para que practiques el habla al máximo." },
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
              <a href="mailto:info@venglish.com" className="login-btn">Enviar correo</a>
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