import Header from '@/app/components/header';
import './pokemon.css';

// Importar pokemon desde la pokeapi

export async function Pokemons() {
  const pokemons = [];
  for (let index = 1; index <= 151; index++) {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${index}`);
    const data = await res.json();
    pokemons.push({
      id: index,
      name: data.name,
      image: data.sprites.front_default,
      type: data.types.map((typeInfo) => typeInfo.type.name).join(", "),
    });
  }
  return pokemons;
}  


// Mostrar la pagina
export default async function Home() {
    const pokemons = await Pokemons();
  return (
    <div>
        <Header />
        <h1>Lista de Pokémon's</h1>

        <div className='pokemonList'>
        {pokemons.map((pokemon) => (
          <div className='pokemonCard' key={pokemon.id}>
            <img src={pokemon.image} alt={pokemon.name}/>
            <h2>{pokemon.name}</h2>
            <p>Tipo: {pokemon.type}</p>
            <div className='buttonCapturar'>
              <button>
                Capturar
              </button>
            </div>
          </div>
          ))}
        </div>
    </div>

    );
};
