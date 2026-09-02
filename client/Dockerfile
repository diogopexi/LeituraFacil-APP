FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE=/api
ENV VITE_API_BASE=$VITE_API_BASE
RUN npm run build

FROM caddy:2-alpine
COPY --from=build /app/dist /usr/share/caddy/html
COPY Caddyfile /etc/caddy/Caddyfile
RUN apk add --no-cache netcat-openbsd
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD nc -z 127.0.0.1 80
LABEL org.opencontainers.image.title="Leitura Fácil Client" \
      org.opencontainers.image.description="Frontend SPA"