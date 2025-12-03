"use client";
import React, { useEffect } from 'react';
import Header from '@/app/components/header';
import PokemonsByZone from './PokemonsByZone';
import styles from './page.module.css';
import { getCookie } from '@/app/utils/cookies';

export default function Home() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = getCookie('token') || localStorage.getItem('token');
      if (!token) {
        window.location.href = '/pages/login';
      }
    }
  }, []);
  return (
    <div className={styles.container}>
      <Header />
      <h1 className={styles.title}>Pokémon por Zonas</h1>
      <PokemonsByZone />
    </div>
  );
}
