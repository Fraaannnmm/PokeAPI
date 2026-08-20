import { useState, useEffect } from 'react';

export default function PokemonCard({ url }) {
const [pokemon, setPokemon] = useState(null);
const [isShiny, setIsShiny] = useState(false);
const [isFav, setIsFav] = useState(false);

useEffect(() => {
    const fetchDetail = async () => {
    try {
        const res = await fetch(url);
        if(!res.ok) throw new Error("Error fetching detail");
        const data = await res.json();
        setPokemon(data);
        
        const favs = JSON.parse(localStorage.getItem('favs') || '[]');
        if (favs.includes(data.id)) setIsFav(true);
    } catch (error) {
        console.error(error);
    }
    };
    fetchDetail();
}, [url]);

const toggleFav = async () => {
    const favs = JSON.parse(localStorage.getItem('favs') || '[]');
    if (isFav) {
        localStorage.setItem('favs', JSON.stringify(favs.filter(id => id !== pokemon.id)));
    } else {
        localStorage.setItem('favs', JSON.stringify([...favs, pokemon.id]));
        await fetch('http://localhost:8000/api/favoritos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pokemon_id: pokemon.id, name: pokemon.name })
        });
    }
    setIsFav(!isFav);
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