# Backend Dockerfile (para teste de vulnerabilidades)
FROM python:3.10
WORKDIR /app

# Instala alguns pacotes que podem ter vulnerabilidades
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    libssl-dev \
    zlib1g-dev

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]