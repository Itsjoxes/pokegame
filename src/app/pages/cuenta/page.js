"use client";

import React, { useState, useEffect } from 'react';
import Header from '../../components/header.jsx';
import styles from '../login/page.module.css';
import { getCookie, removeCookie } from '../../utils/cookies';

export default function CuentaPage() {
    // Auth state
    const [currentUser, setCurrentUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    // Register form state
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Profile/Change Password state
    const [userData, setUserData] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

    // Common state
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Fallback to localStorage if cookie is missing (for existing sessions or dev environment)
        const user = getCookie('currentUser') || localStorage.getItem('currentUser');
        setCurrentUser(user);
        setLoadingAuth(false);
        if (user) {
            fetchUserData(user);
        }
    }, []);

    const fetchUserData = async (user) => {
        try {
            const res = await fetch(`https://pokedex-app-omb3.onrender.com/usuarios/${user}`);
            if (res.ok) {
                const data = await res.json();
                setUserData(data);
            }
        } catch (e) {
            console.error("Error fetching user data", e);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(null);

        if (!username) return setError('Ingresa un nombre de usuario');
        if (!name) return setError('Ingresa tu nombre completo');
        if (!email) return setError('Ingresa un correo electrónico');
        if (!password) return setError('Ingresa una contraseña');
        if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');
        if (password !== confirmPassword) return setError('Las contraseñas no coinciden');

        setIsLoading(true);

        try {
            const response = await fetch('https://pokedex-app-omb3.onrender.com/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username,
                    nombre: name,
                    email: email,
                    contrasena: password
                }),
            });

            if (response.ok) {
                window.location.href = '/pages/login';
            } else {
                const errorData = await response.json().catch(() => null);
                if (response.status === 409 || (errorData && errorData.message && errorData.message.includes('exist'))) {
                    setError('El nombre de usuario ya está en uso.');
                } else {
                    setError('Error al registrar. Verifica los datos.');
                }
            }
        } catch (err) {
            console.error(err);
            setError('Error de conexión con el servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!newPassword) return setError('Ingresa una nueva contraseña');
        if (newPassword.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');
        if (newPassword !== confirmNewPassword) return setError('Las contraseñas no coinciden');

        setIsLoading(true);

        try {
            // We need to send the full object or at least what the backend expects.
            // Based on the PUT endpoint, it updates the user found by username.
            // We should preserve existing data (nombre, email) if possible.
            const payload = {
                username: currentUser,
                nombre: userData ? userData.nombre : '', // Fallback if fetch failed
                email: userData ? userData.email : '',
                contrasena: newPassword
            };

            const response = await fetch('https://pokedex-app-omb3.onrender.com/usuarios', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setSuccess('Contraseña actualizada correctamente.');
                setNewPassword('');
                setConfirmNewPassword('');
            } else {
                setError('Error al actualizar la contraseña.');
            }
        } catch (err) {
            console.error(err);
            setError('Error de conexión.');
        } finally {
            setIsLoading(false);
        }
    };

    const doLogout = () => {
        removeCookie('currentUser');
        removeCookie('token');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        window.dispatchEvent(new CustomEvent('authChanged', { detail: null }));
        window.location.href = '/pages/login';
    };

    if (loadingAuth) return null; // or a spinner

    // VISTA: PERFIL DE USUARIO (SI ESTÁ LOGUEADO)
    if (currentUser) {
        return (
            <div>
                <Header />
                <div className={styles.container}>
                    <div className={styles.card}>
                        <h1 className={styles.title}>Mi Cuenta</h1>

                        {userData && (
                            <div style={{ marginBottom: '2rem', textAlign: 'left', background: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
                                <p><strong>Usuario:</strong> {userData.username}</p>
                                <p><strong>Nombre:</strong> {userData.nombre}</p>
                                <p><strong>Email:</strong> {userData.email}</p>
                            </div>
                        )}

                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#333' }}>Cambiar Contraseña</h2>

                        <form onSubmit={handleChangePassword} className={styles.form}>
                            <label className={styles.label}>
                                <div>Nueva Contraseña:</div>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className={styles.input}
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        disabled={isLoading}
                                        style={{ width: '100%' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        style={{
                                            position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#666'
                                        }}
                                    >
                                        {showNewPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </label>
                            <label className={styles.label}>
                                <div>Confirmar Nueva Contraseña:</div>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className={styles.input}
                                        type={showConfirmNewPassword ? "text" : "password"}
                                        value={confirmNewPassword}
                                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                                        disabled={isLoading}
                                        style={{ width: '100%' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                        style={{
                                            position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#666'
                                        }}
                                    >
                                        {showConfirmNewPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </label>

                            {error && <div className={styles.error}>{error}</div>}
                            {success && <div className={styles.error} style={{ background: '#dcfce7', color: '#166534' }}>{success}</div>}

                            <button className={styles.primary} type="submit" disabled={isLoading}>
                                {isLoading ? 'Guardando...' : 'Actualizar Contraseña'}
                            </button>

                            <button
                                type="button"
                                onClick={doLogout}
                                style={{
                                    marginTop: '1rem', background: 'none', border: '1px solid #ef4444', color: '#ef4444',
                                    padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%'
                                }}
                            >
                                Cerrar Sesión
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // VISTA: REGISTRO (SI NO ESTÁ LOGUEADO)
    return (
        <div>
            <Header />
            <div className={styles.container}>
                <div className={styles.card}>
                    <h1 className={styles.title}>Registrate</h1>
                    <form onSubmit={handleRegister} className={styles.form}>
                        <label className={styles.label}>
                            <div>Nombre de usuario:</div>
                            <input
                                className={styles.input}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={isLoading}
                            />
                        </label>
                        <label className={styles.label}>
                            <div>Nombre completo:</div>
                            <input
                                className={styles.input}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isLoading}
                            />
                        </label>
                        <label className={styles.label}>
                            <div>Correo electrónico:</div>
                            <input
                                className={styles.input}
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                            />
                        </label>
                        <label className={styles.label}>
                            <div>Contraseña:</div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    className={styles.input}
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    style={{ width: '100%' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#666'
                                    }}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </label>
                        <label className={styles.label}>
                            <div>Confirmar contraseña:</div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    className={styles.input}
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isLoading}
                                    style={{ width: '100%' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={{
                                        position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#666'
                                    }}
                                >
                                    {showConfirmPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </label>

                        {error && <div className={styles.error}>{error}</div>}

                        <div className={styles.row}>
                            <button className={styles.primary} type="submit" disabled={isLoading}>
                                {isLoading ? 'Registrando...' : 'Registrarse'}
                            </button>
                            <a className={styles.secondaryLink} href="/pages/login">Ir a iniciar sesión</a>
                        </div>
                        <div className={styles.smallHelper}>
                            ¿Ya tienes cuenta? <a className={styles.secondaryLink} href="/pages/login">Inicia sesión</a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}