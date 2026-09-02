FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src ./src
RUN apk add --no-cache netcat-openbsd
EXPOSE 3000
USER node
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD nc -z 127.0.0.1 3000
LABEL org.opencontainers.image.title="PI5-Server" \
      org.opencontainers.image.description="Backend API"
CMD ["node", "src/server.js"]