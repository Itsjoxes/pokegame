"use client";

import React, { useEffect, useState } from 'react';
import './header.css';

export default function Header() {
    // 1. Inicializa el estado con un valor que SÍ existe en ambos entornos (SSR y Cliente).
    // Usamos 'undefined' como el estado de "cargando/desconocido".
    // Esto asegura que en el primer render, se renderice un placeholder (o nada) idéntico.
    const [user, setUser] = useState(undefined);

    // 2. Usamos useEffect para leer localStorage (que solo existe en el cliente)
    useEffect(() => {
        // Lógica de inicialización (Solo se ejecuta en el cliente)
        try {
            const initialUser = localStorage.getItem('currentUser') || null;
            setUser(initialUser);
        } catch (e) {
            setUser(null);
        }

        // Lógica de suscripción a eventos (Correcta, ya estaba bien)
        function onAuth(e) {
            const name = (e && e.detail) || localStorage.getItem('currentUser') || null;
            setUser(name);
        }
        window.addEventListener('authChanged', onAuth);

        function onStorage(e) {
            if (e.key === 'currentUser') onAuth();
        }
        window.addEventListener('storage', onStorage);

        return () => {
            window.removeEventListener('authChanged', onAuth);
            window.removeEventListener('storage', onStorage);
        };
    }, []);

    const doLogout = () => {
        try {
            localStorage.removeItem('currentUser');
        } catch (e) {}
        window.dispatchEvent(new CustomEvent('authChanged', { detail: null }));
        setUser(null);
        window.location.href = '/';
    };

    // 3. Renderizado Condicional:
    // Si 'user' es 'undefined', no sabemos el estado aún (SSR o Cliente recién montado).
    // Renderizamos un placeholder o 'null' para coincidir con el SSR.
    if (user === undefined) {
        // Devuelve el esqueleto estático del header
        return (
            <header>
                <img src="/img/logo.png"/>
                <nav>
                    <a href="/pages/inicio"> Inicio </a>
                    <a href="/pages/pokemons"> Pokémon's </a>
                    <a href="/pages/cuenta"> Registrarse </a>
                    {/* Renderiza un placeholder invisible o null en la posición dinámica */}
                </nav>
            </header>
        );
    }

    // 4. Si 'user' es 'null' (No logueado) o un string (Logueado), renderizamos el contenido final.
    return (
        <header>
            <img src="/img/logo.png"/>
            <nav>
                <a href="/pages/inicio"> Inicio </a>
                <a href="/pages/pokemons"> Pokémon's </a>
                <a href="/pages/cuenta"> Registrarse </a>
                {!user ? (
                    <a href="/pages/login"> Iniciar sesión </a>
                ) : (
                    <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 13 }}>Hola, {user}</span>
                        <button onClick={doLogout} style={{ fontSize: 12 }}>Cerrar sesión</button>
                    </span>
                )}
            </nav>
        </header>
    );
}