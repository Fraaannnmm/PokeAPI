import { useEffect, useState } from 'react';
import { useFetch } from './hooks/useFetch';
import { useDebounce } from './hooks/useDebounce';
import PokemonCard from './components/PokemonCard';
import Login from './components/Login';
import './index.css';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [offset, setOffset] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [favoriteIds, setFavoriteIds] = useState(() =>
    JSON.parse(localStorage.getItem('favs') || '[]'),
  );
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (!token) return;

    fetch(`${apiUrl}/api/favoritos`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!response.ok) throw new Error('No se pudieron cargar los favoritos');
        return response.json();
      })
      .then(({ favorites }) => {
        const ids = favorites.map(({ pokemon_id }) => pokemon_id);
        setFavoriteIds(ids);
        localStorage.setItem(
          'favs',
          JSON.stringify(ids),
        );
      })
      .catch((error) => console.error(error));
  }, [apiUrl, token]);

  const endpoint = debouncedSearch 
    ? `https://pokeapi.co/api/v2/pokemon/${debouncedSearch.toLowerCase()}`
    : `https://pokeapi.co/api/v2/pokemon?limit=20&offset=${offset}`;

  const { data, loading, error } = useFetch(endpoint);

  const handleNext = () => setOffset(prev => prev + 20);
  const handlePrev = () => setOffset(prev => Math.max(0, prev - 20));

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  if (!token) return <Login onLogin={setToken} />;

  return (
    <div className="app-container">
      <header>
        <div className="header-top">
          <h1>Pokédex</h1>
          <button onClick={handleLogout} className="btn-logout">Salir</button>
        </div>
        <input 
          type="text" 
          placeholder="Buscar por nombre o ID..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
        />
      </header>

      {loading && <p className="status-msg loading">⏳ Cargando...</p>}
      {error && <p className="status-msg error">❌ {error}</p>}

      <main className="grid-container">
        {data && debouncedSearch && !error && (
          <PokemonCard
            url={`https://pokeapi.co/api/v2/pokemon/${data.id}`}
            token={token}
            favoriteIds={favoriteIds}
            onFavoriteChange={setFavoriteIds}
          />
        )}
        
        {data && data.results && !debouncedSearch && (
          data.results.map(poke => (
            <PokemonCard
              key={poke.name}
              url={poke.url}
              token={token}
              favoriteIds={favoriteIds}
              onFavoriteChange={setFavoriteIds}
            />
          ))
        )}
      </main>

      {!debouncedSearch && (
        <div className="pagination">
          <button onClick={handlePrev} disabled={offset === 0}>Anterior</button>
          <button onClick={handleNext}>Siguiente</button>
        </div>
      )}
    </div>
  );
}