"use client";

import React, { useState } from 'react';
import Header from '../../components/header.jsx';
import styles from './page.module.css';
import { setCookie } from '../../utils/cookies';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      // 1. Llamamos a la API para iniciar sesión
      const res = await fetch('https://pokedex-app-omb3.onrender.com/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          contrasena: password
        }),
      });

      if (!res.ok) {
        setError('Credenciales incorrectas');
        return;
      }

      const data = await res.json();

      // 2. Login exitoso: Guardamos el token y el usuario en cookies (7 días)
      if (data.token) {
        setCookie('token', data.token, 7);
        setCookie('currentUser', username, 7);
        // Mantenemos localStorage por compatibilidad con código antiguo si es necesario, 
        // pero la fuente de verdad será la cookie.
        localStorage.setItem('token', data.token);
        localStorage.setItem('currentUser', username);
        window.dispatchEvent(new CustomEvent('authChanged', { detail: username }));

        // Redirección
        window.location.href = '/pages/pokemons';
      } else {
        setError('Error: No se recibió el token de autenticación');
      }

    } catch (err) {
      console.error(err);
      setError('Error al iniciar sesión');
    }
  };

  return (
    <div>
      {/* Estilos CSS inline básicos solo para esta demo (tu usarás tu archivo module.css) */}
      <style>{`
        .container { display: flex; justify-content: center; padding-top: 50px; font-family: sans-serif; }
        .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
        .title { text-align: center; color: #333; margin-bottom: 1.5rem; }
        .form { display: flex; flex-direction: column; gap: 1rem; }
        .label { display: flex; flex-direction: column; gap: 5px; font-size: 0.9rem; color: #666; }
        .input { padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; }
        .primary { background: #0070f3; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; font-weight: bold; }
        .primary:hover { background: #0051a2; }
        .error { color: red; font-size: 0.9rem; text-align: center; background: #ffe6e6; padding: 5px; border-radius: 4px; }
        .row { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
        .secondaryLink { color: #0070f3; text-decoration: none; font-size: 0.9rem; }
        .secondaryLink:hover { text-decoration: underline; }
        .smallHelper { margin-top: 15px; font-size: 0.8rem; text-align: center; color: #888; }
      `}</style>

      <Header />
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Iniciar sesión</h1>
          <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.label}>
              Usuario
              <input
                className={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Contraseña
              <div style={{ position: 'relative' }}>
                <input
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  style={{ width: '100%' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    lineHeight: '1',
                    padding: '0',
                    color: '#666'
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </label>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.row}>
              <button className={styles.primary} type="submit">Entrar</button>
              <a className={styles.secondaryLink} href="/pages/cuenta">Registrarse</a>
            </div>
            <div className={styles.smallHelper}>
              Si no tienes cuenta, puedes <a className={styles.secondaryLink} href="/pages/cuenta">registrarte</a>.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}