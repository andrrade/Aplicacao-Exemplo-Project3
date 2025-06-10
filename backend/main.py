from fastapi import FastAPI
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import random
import httpx

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Ou especifique ['http://localhost:3000'] se preferir
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Bem-vindo(a) à API do Projeto 3 da CompassUOL!"}

# 1️⃣ Endpoint que retorna uma cor aleatória para mudar a cor da página
@app.get("/color")
async def get_random_color():
    colors = ["#FF5733", "#33FF57", "#3357FF", "#F333FF", "#33FFF3"]
    return {"color": random.choice(colors)}

# 2️⃣ Endpoint que retorna uma imagem aleatória de gato
@app.get("/cat")
async def get_random_cat_image():
    async with httpx.AsyncClient() as client:
        response = await client.get("https://api.thecatapi.com/v1/images/search")
        if response.status_code == 200:
            data = response.json()
            image_url = data[0]['url']
            return {"cat_image_url": image_url}
        return JSONResponse(content={"error": "Failed to fetch cat image"}, status_code=500)

# 3️⃣ Endpoint que retorna uma imagem aleatória (via https://picsum.photos)
@app.get("/random-photo")
async def get_random_photo():
    width = random.randint(200, 600)
    height = random.randint(200, 600)
    photo_url = f"https://picsum.photos/{width}/{height}"
    return {"random_photo_url": photo_url}

# 4️⃣ Endpoint que retorna o horário atual
@app.get("/time")
async def get_current_time():
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return {"current_time": now}

# 5️⃣ Endpoint que redireciona para uma piada (API pública)
@app.get("/joke")
async def joke():
    async with httpx.AsyncClient() as client:
        response = await client.get("https://official-joke-api.appspot.com/random_joke")
        if response.status_code == 200:
            joke_data = response.json()
            full_joke = f"{joke_data['setup']} {joke_data['punchline']}"
            return {"joke": full_joke}
        return JSONResponse(content={"error": "Failed to fetch joke"}, status_code=500)

#  6️⃣ Retorna uma imagem de susto (ex.: GIF)
@app.get("/scare")
async def scare():
    scare_images = [
        "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",  # Exemplo de imagem de susto
        "https://media.giphy.com/media/26xBI73gWquCBBCDe/giphy.gif"
    ]
    random_scare = random.choice(scare_images)
    return {"scare_image_url": random_scare}

# 7️⃣ Retorna uma imagem aleatória de “sósia”
@app.get("/lookalike")
async def lookalike():
    lookalike_images = [
        "https://randomuser.me/api/portraits/men/1.jpg",
        "https://randomuser.me/api/portraits/women/1.jpg",
        "https://randomuser.me/api/portraits/lego/1.jpg"
    ]
    random_lookalike = random.choice(lookalike_images)
    return {"lookalike_image_url": random_lookalike}
