# Multi-stage build para React
FROM node:18-alpine as build

WORKDIR /app

# Copia arquivos de dependências
COPY package.json package-lock.json ./

# Instala dependências
RUN npm ci --only=production --silent

# Copia código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Verifica se o build existe
RUN ls -la /app/build/

# Estágio de produção com Nginx
FROM nginx:alpine

# Remove arquivo de configuração padrão
RUN rm /etc/nginx/conf.d/default.conf

# Copia os arquivos do build
COPY --from=build /app/build /usr/share/nginx/html

# Copia configuração customizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe porta 3000
EXPOSE 3000

# Inicia nginx
CMD ["nginx", "-g", "daemon off;"]
