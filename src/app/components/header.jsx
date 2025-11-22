import React from 'react';
import './header.css';
export default function Header() {
    return (
        <header>
            <img src="/img/logo.png"/>
            <nav>
                <a href="/pages/inicio"> Inicio </a>
                <a href="/pages/pokemons"> Pokémon's </a>
                <a href="/pages/cuenta"> Cuenta </a>
            </nav>
        </header>
    );
}