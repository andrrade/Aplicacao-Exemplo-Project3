# Dockerfile Backend (salvar como Dockerfile na pasta backend)
FROM python:3.10-slim
WORKDIR /app

# Copia apenas o requirements.txt primeiro para aproveitar cache
COPY requirements.txt .

# Instala dependências
RUN pip install --no-cache-dir -r requirements.txt

# Copia o resto dos arquivos
COPY . .

# Expõe a porta
EXPOSE 8000

# Comando para rodar
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]