FROM node:22-bookworm-slim AS frontend-build

WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node backend/src ./backend/src
COPY --from=frontend-build --chown=node:node /build/frontend/dist ./frontend/dist

WORKDIR /app/backend
USER node
EXPOSE 8000

CMD ["node", "src/server.js"]
