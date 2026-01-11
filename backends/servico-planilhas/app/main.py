from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.controllers import itens

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,    # Libera o seu React
    allow_credentials=True,
    allow_methods=["*"],      # Libera GET, POST, DELETE, etc.
    allow_headers=["*"],
)

app.include_router(itens.router)



@app.get("/")
def read_root():
    return {"message": "Hello World"}
