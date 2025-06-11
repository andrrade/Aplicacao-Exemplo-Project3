# Multi-stage build para otimizar o tamanho da imagem
FROM node:18-alpine as build

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependências
COPY package.json package-lock.json ./

# Limpa o cache do npm e instala as dependências
RUN npm cache clean --force && \
    npm ci --only=production --silent

# Copia o código fonte
COPY . .

# Constrói a aplicação para produção
RUN npm run build

# Verifica se o build foi criado
RUN ls -la /app/build

# Segunda etapa - Servidor Nginx
FROM nginx:alpine

# Remove a configuração padrão do nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia os arquivos construídos do estágio anterior
COPY --from=build /app/build /usr/share/nginx/html

# Cria uma configuração customizada do nginx
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 3000;
    server_name localhost;
    
    # Configuração para SPA (Single Page Application)
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
        
        # Headers para evitar cache em desenvolvimento
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    # Configuração para arquivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        root /usr/share/nginx/html;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Expõe a porta 3000
EXPOSE 3000

# Adiciona um script de inicialização para debug
RUN cat > /docker-entrypoint.d/99-debug.sh << 'EOF'
#!/bin/sh
echo "=== NGINX FRONTEND DEBUG ==="
echo "Listando arquivos em /usr/share/nginx/html:"
ls -la /usr/share/nginx/html/
echo "Configuração do nginx:"
cat /etc/nginx/conf.d/default.conf
echo "========================="
EOF

RUN chmod +x /docker-entrypoint.d/99-debug.sh

# Comando para iniciar o nginx
CMD ["nginx", "-g", "daemon off;"]
