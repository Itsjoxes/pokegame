"use client";

import React, { useState } from 'react';
import Header from '../../components/header.jsx';
import styles from './page.module.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const raw = localStorage.getItem('users') || '{}';
      const users = JSON.parse(raw || '{}');
      const u = users[username];
      if (!u) {
        setError('Usuario no encontrado');
        return;
      }
      if (u.password !== password) {
        setError('Contraseña incorrecta');
        return;
      }
      // success
      localStorage.setItem('currentUser', username);
      window.dispatchEvent(new CustomEvent('authChanged', { detail: username }));
      // redirect to pokemons
      window.location.href = '/pages/pokemons';
    } catch (err) {
      setError('Error al iniciar sesión');
    }
  };

  return (
    <div>
      <Header />
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Iniciar sesión</h1>
          <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.label}>
              Usuario
              <input className={styles.input} value={username} onChange={(e) => setUsername(e.target.value)} />
            </label>
            <label className={styles.label}>
              Contraseña
              <input className={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
            </label>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.row}>
              <button className={styles.primary} type="submit">Entrar</button>
              <a className={styles.secondaryLink} href="/pages/cuenta">Registrarse</a>
            </div>
            <div className={styles.smallHelper}>Si no tienes cuenta, puedes <a className={styles.secondaryLink} href="/pages/cuenta">registrarte</a>.</div>
          </form>
        </div>
      </div>
    </div>
  );
}
