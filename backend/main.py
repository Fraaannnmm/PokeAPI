from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

db_favorites = []

@app.post("/login")
async def login(user: UserLogin):
    if user.username == "admin" and user.password == "1234":
        return {"token": "fake-jwt-token-ujap-2026"}
    raise HTTPException(status_code=401, detail="Credenciales inválidas")

@app.post("/api/favoritos")
async def add_favorite(fav: Favorite):
    db_favorites.append(fav)
    return {"message": f"{fav.name} guardado en favoritos", "favorites": db_favorites}

@app.get("/api/favoritos")
async def get_favorites():
    return {"favorites": db_favorites}