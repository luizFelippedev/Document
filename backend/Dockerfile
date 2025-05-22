# Multi-stage build para produção otimizada
FROM node:18-alpine AS builder

# Instalar dependências do sistema
RUN apk add --no-cache python3 make g++ && ln -sf python3 /usr/bin/python

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Copiar código fonte
COPY src/ ./src/

# Build da aplicação
RUN npm run build

# Stage de produção
FROM node:18-alpine AS production

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Instalar dependências mínimas
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copiar arquivos necessários
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Criar diretórios necessários
RUN mkdir -p uploads logs && \
    chown -R nodejs:nodejs uploads logs

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

EXPOSE 5000

# Usar dumb-init para proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]