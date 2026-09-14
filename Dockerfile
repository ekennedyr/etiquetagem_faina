# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN npm ci

# Compila o frontend React / Vite
COPY . .
RUN npm run build

# Stage 2: Runtime de Produção
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev

# Copia os artefatos compilados do builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js

# Cria diretório para persistência de dados
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "server.js"]
