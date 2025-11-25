
"use client";

import React, { useState } from 'react';
import Header from '../../components/header.jsx';
import styles from '../login/page.module.css';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(null);
        if (!username) return setError('Ingresa un nombre de usuario');
        if (!password) return setError('Ingresa una contraseña');
        if (password !== confirmPassword) return setError('Las contraseñas no coinciden');
        try {
            const raw = localStorage.getItem('users') || '{}';
            const users = JSON.parse(raw || '{}');
            if (users[username]) return setError('El usuario ya existe');
            users[username] = { password, name, email };
            localStorage.setItem('users', JSON.stringify(users));
            // initialize empty roster for this user
            localStorage.setItem(`roster:${username}`, JSON.stringify([]));
            // set as current user
            localStorage.setItem('currentUser', username);
            window.dispatchEvent(new CustomEvent('authChanged', { detail: username }));
            // redirect to pokemons
            window.location.href = '/pages/pokemons';
        } catch (err) {
            setError('Error creando la cuenta');
        }
    };

    return (
        <div>
            <Header />
            <div className={styles.container}>
                <div className={styles.card}>
                    <h1 className={styles.title}>Registrate</h1>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <label className={styles.label}>
                            <div>Nombre de usuario:</div>
                            <input className={styles.input} value={username} onChange={(e) => setUsername(e.target.value)} />
                        </label>
                        <label className={styles.label}>
                            <div>Nombre completo:</div>
                            <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
                        </label>
                        <label className={styles.label}>
                            <div>Correo electrónico:</div>
                            <input className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} />
                        </label>
                        <label className={styles.label}>
                            <div>Contraseña:</div>
                            <input className={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </label>
                        <label className={styles.label}>
                            <div>Confirmar contraseña:</div>
                            <input className={styles.input} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        </label>
                        {error && <div className={styles.error}>{error}</div>}
                        <div className={styles.row}>
                            <button className={styles.primary} type="submit">Registrarse</button>
                            <a className={styles.secondaryLink} href="/pages/login">Ir a iniciar sesión</a>
                        </div>
                        <div className={styles.smallHelper}>¿Ya tienes cuenta? <a className={styles.secondaryLink} href="/pages/login">Inicia sesión</a></div>
                    </form>
                </div>
            </div>
        </div>
    );
}