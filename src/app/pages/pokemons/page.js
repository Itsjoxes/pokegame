import Header from '@/app/components/header';
import PokemonsByZone from './PokemonsByZone';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <Header />
      <h1 className={styles.title}>Pokémon por Zonas</h1>
      <PokemonsByZone />
    </div>
  );
}
