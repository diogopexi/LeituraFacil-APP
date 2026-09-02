# Projeto Integrador 5

## Variáveis de ambiente

| Variável | Padrão dev | Padrão prod | Desc |
|--|--|--|--|
| `VITE_API_BASE` | `/api` | `/api` | Url base que o front utiliza para chamar a API |
| `PORT` | `3000` | `3000` | Porta que o backend vai escutar |
| `MONGO_URI` | `mongodb://mongodb:27017/leitura` | | String de conexão mongodb |
| `JWT_SECRET` | `dev_secret` | | Secret utilizada para assinar os tokens JWT |
| `CADDY_HTTP_PORT` | `8080` | `80` | Porta que o container caddy vai escutar (HTTP) |
| `CADDY_HTTPS_PORT` | `4433` | `443` | Porta que o container caddy vai escutar (HTTPS) |
| `DOMAIN_NAME` | | | Domínio utilizado |

## Docker

Iniciar

```bash
docker compose up --build -d
```

Parar

```bash
docker compose down
```

Produção (sem mongodb e sem alguns defaults):

```bash
docker compose -f docker-compose.prod.yml up -d
```