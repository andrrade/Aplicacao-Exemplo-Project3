# Dockerfile (na pasta backend)
FROM python:3.10-slim

WORKDIR /app

# Copia apenas o requirements.txt primeiro para aproveitar cache
COPY requirements.txt .

# Instala dependências
RUN pip install --no-cache-dir -r requirements.txt

# Copia o resto dos arquivos
COPY . .

# Expõe a porta
EXPOSE 8082

# Comando para rodar (ajuste 'main:app' se seu arquivo/app tem outro nome)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8082"]
