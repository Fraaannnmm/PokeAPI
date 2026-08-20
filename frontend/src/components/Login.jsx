import { useState } from 'react';

export default function Login({ onLogin }) {
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');

const handleSubmit = async (e) => {
    e.preventDefault();
    try {
    const res = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    
    if (!res.ok) throw new Error('Credenciales inválidas');
    
    const data = await res.json();
    localStorage.setItem('token', data.token);
    onLogin(data.token);
    } catch (err) {
    setError(err.message);
    }
};

return (
    <div className="login-container">
    <form onSubmit={handleSubmit} className="login-form">
        <h2>Acceso a la Pokédex</h2>
        {error && <p className="error-msg">❌ {error}</p>}
        <input 
        type="text" 
        placeholder="Usuario (escribe: admin)" 
        value={username}
        onChange={e => setUsername(e.target.value)}
        required
        />
        <input 
        type="password" 
        placeholder="Contraseña (escribe: 1234)" 
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        />
        <button type="submit">Iniciar Sesión</button>
    </form>
    </div>
);
}