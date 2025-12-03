"use client";

import React, { useEffect, useState } from 'react';
import Header from '@/app/components/header';
import { getCookie } from '@/app/utils/cookies';
import { isAdminAccount } from '@/app/utils/adminAccess';
import styles from './admin.module.css';

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState(() => {
    try { return getCookie('currentUser') || localStorage.getItem('currentUser') || null; } catch (e) { return null; }
  });

  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [newLevel, setNewLevel] = useState('');
  const [message, setMessage] = useState('');

  // Load roster when currentUser changes
  useEffect(() => {
    function loadForUser(user) {
      try {
        if (!user) {
          setRoster([]);
          return;
        }
        const key = `roster:${user}`;
        const raw = localStorage.getItem(key) || '[]';
        const parsed = JSON.parse(raw || '[]');
        if (Array.isArray(parsed)) {
          const withInTeam = parsed.map((p) => ({
            ...p,
            inTeam: p.inTeam !== false,
          }));
          setRoster(withInTeam);
        } else {
          setRoster([]);
        }
      } catch (e) {
        setRoster([]);
      }
      setLoading(false);
    }
    loadForUser(currentUser);

    // listen for auth changes
    function onAuth(e) {
      const name = (e && e.detail) || getCookie('currentUser') || localStorage.getItem('currentUser') || null;
      setCurrentUser(name);
      loadForUser(name);
    }
    window.addEventListener('authChanged', onAuth);
    return () => {
      window.removeEventListener('authChanged', onAuth);
    };
  }, [currentUser]);

  const levelXp = (level) => Math.max(20, level * 60);

  const handleLevelUp = () => {
    if (!selectedPokemon || !newLevel) {
      setMessage('Por favor selecciona un Pokémon y un nivel');
      return;
    }

    const targetLevel = parseInt(newLevel, 10);
    if (isNaN(targetLevel) || targetLevel < 1 || targetLevel > 100) {
      setMessage('El nivel debe estar entre 1 y 100');
      return;
    }

    setRoster((prev) => {
      const copy = [...prev];
      const idx = copy.findIndex((p) => p.id === selectedPokemon.id);
      if (idx === -1) return prev;

      copy[idx] = {
        ...copy[idx],
        level: targetLevel,
        xp: 0, // Reset XP when manually setting level
      };

      // Persist to localStorage
      try {
        const key = `roster:${currentUser}`;
        localStorage.setItem(key, JSON.stringify(copy));
      } catch (e) {
        console.error('Error saving to localStorage', e);
      }

      setMessage(`✓ ${copy[idx].name} subió a nivel ${targetLevel}`);
      setSelectedPokemon(copy[idx]);
      setNewLevel('');
      setTimeout(() => setMessage(''), 3000);

      return copy;
    });
  };

  if (!currentUser) {
    return (
      <div className={styles.container}>
        <Header />
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <p style={{ fontSize: 18, color: '#666' }}>Debes iniciar sesión para acceder al panel de admin</p>
        </div>
      </div>
    );
  }

  if (!isAdminAccount(currentUser)) {
    return (
      <div className={styles.container}>
        <Header />
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <p style={{ fontSize: 18, color: '#666' }}>No tienes permiso para acceder al panel de admin</p>
          <p style={{ fontSize: 14, color: '#999' }}>Solo administradores autorizados pueden acceder</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <Header />
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px' }}>
        <h1 style={{ fontSize: 32, marginBottom: 10, color: '#667eea' }}>⚙️ Panel de Admin</h1>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>Usuario: <strong>{currentUser}</strong></p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Lista de Pokémon */}
          <div style={{ background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: 18, marginBottom: 16, color: '#333' }}>Mis Pokémon</h2>
            {roster.length === 0 ? (
              <p style={{ color: '#999' }}>No tienes Pokémon capturados</p>
            ) : (
              <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                {roster.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPokemon(p)}
                    style={{
                      padding: 12,
                      marginBottom: 8,
                      background: selectedPokemon?.id === p.id ? '#e3f2fd' : '#f5f5f5',
                      borderLeft: selectedPokemon?.id === p.id ? '4px solid #667eea' : '4px solid transparent',
                      cursor: 'pointer',
                      borderRadius: 4,
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <img src={p.image} alt={p.name} style={{ width: 40, height: 40 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>Nivel {p.level} • XP: {p.xp}/{levelXp(p.level)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Editor de nivel */}
          <div style={{ background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: 18, marginBottom: 16, color: '#333' }}>Modificar Nivel</h2>

            {selectedPokemon ? (
              <>
                <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 6, marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                    <img src={selectedPokemon.image} alt={selectedPokemon.name} style={{ width: 60, height: 60 }} />
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>{selectedPokemon.name}</div>
                      <div style={{ fontSize: 14, color: '#666' }}>Nivel actual: <strong>{selectedPokemon.level}</strong></div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#333' }}>
                    Nuevo nivel (1-100):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value)}
                    placeholder="Ingresa el nuevo nivel"
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: 14,
                      border: '2px solid #ddd',
                      borderRadius: 4,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <button
                  onClick={handleLevelUp}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: 14,
                    fontWeight: 600,
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#5568d3'}
                  onMouseLeave={(e) => e.target.style.background = '#667eea'}
                >
                  Subir Nivel
                </button>

                {message && (
                  <div style={{
                    marginTop: 12,
                    padding: 12,
                    background: message.startsWith('✓') ? '#c8e6c9' : '#ffcccc',
                    color: message.startsWith('✓') ? '#2e7d32' : '#c62828',
                    borderRadius: 4,
                    fontSize: 13,
                    textAlign: 'center',
                  }}>
                    {message}
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', color: '#999', paddingTop: 40 }}>
                <p>Selecciona un Pokémon para modificar su nivel</p>
              </div>
            )}
          </div>
        </div>

        {/* Información */}
        <div style={{ marginTop: 20, padding: 16, background: '#f0f4ff', borderRadius: 8, borderLeft: '4px solid #667eea' }}>
          <h3 style={{ marginTop: 0, color: '#667eea' }}>ℹ️ Información</h3>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#555' }}>
            <li>Este panel permite modificar el nivel de tus Pokémon sin restricciones</li>
            <li>Los niveles van del 1 al 100</li>
            <li>Al cambiar el nivel, el XP se reinicia a 0</li>
            <li>Los cambios se guardan automáticamente</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
