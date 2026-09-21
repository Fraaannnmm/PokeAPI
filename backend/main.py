import hashlib
import hmac
import os
import secrets
from contextlib import asynccontextmanager

import psycopg
from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://pokeapi:pokeapi@localhost:5432/pokeapi",
)
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
DEFAULT_USERNAME = os.getenv("DEFAULT_USERNAME", "admin")
DEFAULT_PASSWORD = os.getenv("DEFAULT_PASSWORD", "1234")


def get_connection():
    return psycopg.connect(DATABASE_URL)


def hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120_000)
    return f"{salt.hex()}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    salt_hex, digest_hex = stored_hash.split("$", 1)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), bytes.fromhex(salt_hex), 120_000
    )
    return hmac.compare_digest(digest.hex(), digest_hex)


def initialize_database() -> None:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS sessions (
                    token VARCHAR(128) PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS favorites (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    pokemon_id INTEGER NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    UNIQUE(user_id, pokemon_id)
                );
                """
            )
            cursor.execute(
                "SELECT id FROM users WHERE username = %s", (DEFAULT_USERNAME,)
            )
            if cursor.fetchone() is None:
                cursor.execute(
                    "INSERT INTO users (username, password_hash) VALUES (%s, %s)",
                    (DEFAULT_USERNAME, hash_password(DEFAULT_PASSWORD)),
                )


@asynccontextmanager
async def lifespan(_: FastAPI):
    initialize_database()
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UserLogin(BaseModel):
    username: str
    password: str


class Favorite(BaseModel):
    pokemon_id: int
    name: str


def get_current_user(token: str | None = None) -> int:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token requerido"
        )
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT user_id FROM sessions WHERE token = %s", (token,))
            session = cursor.fetchone()
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión inválida"
        )
    return session[0]


def bearer_user(authorization: str | None = Header(default=None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        return get_current_user()
    return get_current_user(authorization.removeprefix("Bearer ").strip())


@app.post("/login")
async def login(user: UserLogin):
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id, password_hash FROM users WHERE username = %s",
                (user.username,),
            )
            stored_user = cursor.fetchone()
            if stored_user is None or not verify_password(
                user.password, stored_user[1]
            ):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Credenciales inválidas",
                )

            token = secrets.token_urlsafe(48)
            cursor.execute(
                "INSERT INTO sessions (token, user_id) VALUES (%s, %s)",
                (token, stored_user[0]),
            )
    return {"token": token}


@app.post("/api/favoritos")
async def add_favorite(fav: Favorite, user_id: int = Depends(bearer_user)):
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO favorites (user_id, pokemon_id, name)
                VALUES (%s, %s, %s)
                ON CONFLICT (user_id, pokemon_id) DO NOTHING
                """,
                (user_id, fav.pokemon_id, fav.name),
            )
    return {"message": f"{fav.name} guardado en favoritos"}


@app.delete("/api/favoritos/{pokemon_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_favorite(
    pokemon_id: int, user_id: int = Depends(bearer_user)
):
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "DELETE FROM favorites WHERE user_id = %s AND pokemon_id = %s",
                (user_id, pokemon_id),
            )


@app.get("/api/favoritos")
async def get_favorites(user_id: int = Depends(bearer_user)):
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT pokemon_id, name FROM favorites WHERE user_id = %s ORDER BY id",
                (user_id,),
            )
            favorites = [
                {"pokemon_id": pokemon_id, "name": name}
                for pokemon_id, name in cursor.fetchall()
            ]
    return {"favorites": favorites}
