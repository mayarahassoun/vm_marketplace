from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth


app = FastAPI()

# Ajouter CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # ton frontend
    allow_credentials=True,
    allow_methods=["*"],  # autorise POST, GET, OPTIONS…
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "VM Marketplace API is running"}