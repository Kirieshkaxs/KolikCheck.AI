# ═════════════════════════════════════════════════════════════════════
#  KolikCheck.AI — Dockerfile для Google Cloud Run
# ═════════════════════════════════════════════════════════════════════

FROM node:20-slim

# Рабочая директория приложения
WORKDIR /app

# ── Установка production-зависимостей сервера ──
COPY server/package.json server/package-lock.json ./
RUN npm install --omit=dev

# ── Копируем исходный код ──
COPY client/ ./client/
COPY server/ ./server/

# Сервер запускается из своей папки (там лежит server.js)
WORKDIR /app/server

# Cloud Run ожидает трафик на порту 8080
EXPOSE 8080

# API-ключ передаётся через переменную окружения GEMINI_API_KEY
# (в Cloud Run задаётся в конфигурации сервиса, не в образе)
CMD ["node", "server.js"]