import { useState, useEffect } from 'react';

export default function PokemonCard({ url, token, favoriteIds, onFavoriteChange }) {
const [pokemon, setPokemon] = useState(null);
const [isShiny, setIsShiny] = useState(false);
const isFav = pokemon ? favoriteIds.includes(pokemon.id) : false;

useEffect(() => {
    const fetchDetail = async () => {
    try {
        const res = await fetch(url);
        if(!res.ok) throw new Error("Error fetching detail");
        const data = await res.json();
        setPokemon(data);
        
    } catch (error) {
        console.error(error);
    }
    };
    fetchDetail();
}, [url]);

const toggleFav = async () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const nextFavs = isFav
        ? favoriteIds.filter(id => id !== pokemon.id)
        : [...favoriteIds, pokemon.id];
    onFavoriteChange(nextFavs);
    localStorage.setItem('favs', JSON.stringify(nextFavs));
    if (isFav) {
        await fetch(`${apiUrl}/api/favoritos/${pokemon.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
    } else {
        await fetch(`${apiUrl}/api/favoritos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ pokemon_id: pokemon.id, name: pokemon.name })
        });
    }
};

if (!pokemon) return <div className="loading-card">Cargando...</div>;

return (
    <div className="card">
    <div className="card-header">
        <span className="pokemon-id">#{pokemon.id}</span>
        <button onClick={toggleFav} className="fav-btn">{isFav ? '⭐' : '☆'}</button>
    </div>
    <img 
        src={isShiny ? pokemon.sprites.front_shiny : pokemon.sprites.front_default} 
        alt={pokemon.name} 
    />
    <h3 className="nombre">{pokemon.name}</h3>
    
    <div className="tipos">
        {pokemon.types.map(t => <span key={t.type.name} className={`tipo ${t.type.name}`}>{t.type.name}</span>)}
    </div>

    <div className="stats">
        {pokemon.stats.slice(0, 3).map(s => (
        <div key={s.stat.name} className="stat-row">
            <span>{s.stat.name}:</span>
            <div className="stat-bar"><div className="stat-fill" style={{width: `${(s.base_stat/255)*100}%`}}></div></div>
        </div>
        ))}
    </div>
    
    <button onClick={() => setIsShiny(!isShiny)} className="btn-shiny">
        Toggle Shiny
    </button>
    </div>
);
}