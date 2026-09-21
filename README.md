# PokeAPI

Aplicación React/Vite para consultar Pokémon, con login y favoritos persistidos en PostgreSQL.

## Estructura

- `frontend/`: aplicación React ejecutada localmente, sin Docker.
- `backend/`: API FastAPI contenida en Docker.
- `docker-compose.yml`: servicios `backend` y `db` (PostgreSQL).

## Puesta en marcha

1. Iniciar PostgreSQL y la API:

    ```bash
    docker compose up --build
    ```

2. En otra terminal, iniciar el frontend:

    ```bash
    cd frontend
    npm install
    npm run dev
    ```

3. Abrir `http://localhost:5173` y usar las credenciales iniciales:
    - Usuario: `admin`
    - Contraseña: `1234`

El usuario inicial se crea automáticamente en la base de datos al arrancar el
backend. La información de PostgreSQL se conserva en el volumen
`postgres_data`. Para cambiar la contraseña inicial antes del primer arranque,
se puede configurar `DEFAULT_PASSWORD` en `docker-compose.yml`.

El frontend admite `VITE_API_URL` para apuntar a otra URL del backend:

```bash
VITE_API_URL=http://localhost:8000 npm run dev
```
