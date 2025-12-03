import Link from 'next/link';
import Header from '@/app/components/header';
import styles from './inicio.module.css';

export default function Home() {
  return (
    <div>
      <Header />
      
      <main className={styles.container}>
        <section className={styles.heroSection}>
          <h1>Bienvenido a Pokégame</h1>
          <p className={styles.subtitle}>La plataforma interactiva para explorar y descubrir Pokémon</p>
        </section>

        <section className={styles.contextSection}>
          <h2>¿Qué es Pokégame?</h2>
          <p>
            Pokégame es una aplicación web diseñada para los fanáticos de Pokémon. Aquí puedes explorar diferentes 
            regiones, descubrir Pokémon según su zona geográfica y gestionar tu cuenta. 
            Ya sea que seas un entrenador novato o experimentado, encontrarás todo lo que necesitas para tu aventura Pokémon.
          </p>
          
          <div className={styles.features}>
            <div className={styles.feature}>
              <h3>📍 Explorar por Zonas</h3>
              <p>Descubre Pokémon agrupados por región geográfica</p>
            </div>
            <div className={styles.feature}>
              <h3>👤 Tu Cuenta</h3>
              <p>Gestiona tu perfil y datos de entrenador</p>
            </div>
            <div className={styles.feature}>
              <h3>🔍 Información Detallada</h3>
              <p>Accede a estadísticas y detalles de cada Pokémon</p>
            </div>
          </div>
        </section>

        <section className={styles.referralSection}>
          <h2>Comparte la Experiencia</h2>
          <p>¿Te gusta Pokégame? Comparte con tus amigos y entrenadores</p>
          
          <div className={styles.referralLinks}>
            <a href="https://twitter.com/share?text=¡Descubre%20Pokégame!%20Una%20plataforma%20increíble%20para%20explorar%20Pokémon" 
               target="_blank" 
               rel="noopener noreferrer" 
               className={styles.referralBtn}>
              🐦 Compartir en Twitter
            </a>
            
            <a href="https://www.facebook.com/sharer/sharer.php?u=tu-sitio.com" 
               target="_blank" 
               rel="noopener noreferrer" 
               className={styles.referralBtn}>
              👍 Compartir en Facebook
            </a>
            
            <a href="https://www.whatsapp.com/share?text=¡Descubre%20Pokégame!%20Una%20plataforma%20increíble%20para%20explorar%20Pokémon" 
               target="_blank" 
               rel="noopener noreferrer" 
               className={styles.referralBtn}>
              💬 Compartir en WhatsApp
            </a>

            <a href="mailto:?subject=Pokégame&body=Te%20recomiendo%20que%20visites%20Pokégame,%20una%20plataforma%20increíble%20para%20explorar%20Pokémon" 
               className={styles.referralBtn}>
              📧 Enviar por Email
            </a>
          </div>
        </section>

        <section className={styles.ctaSection}>
          <h2>Comienza tu Aventura</h2>
          <p>Inicia sesión o crea tu cuenta para empezar a explorar</p>
          <div className={styles.buttons}>
            <Link href="/pages/pokemons" className={styles.primaryBtn}>Ir a Capturar</Link>
            <Link href="/pages/cuenta" className={styles.secondaryBtn}>Crear Cuenta</Link>
          </div>
        </section>
      </main>
    </div>
  );
};