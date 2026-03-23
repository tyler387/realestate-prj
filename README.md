# toyPrj

Monorepo with:
- `backend` (Spring Boot + PostgreSQL/PostGIS)
- `frontend` (React + Vite)

## Single Source Of Truth

- Use root `.env` only.
- Use root `.gitignore` only.
- Use root `docker-compose.yml` only.

Frontend is configured to read env from root via `frontend/vite.config.ts` (`envDir`).

## Setup

1. Create root `.env` from `.env.example`
2. Fill real API keys
3. Run backend + db:

```bash
docker compose up -d --build
```

4. Run frontend:

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables (root `.env`)

```env
PUBLIC_DATA_API_KEY=...
KAKAO_REST_API_KEY=...
VITE_KAKAO_MAP_KEY=...
VITE_API_BASE_URL=http://localhost:8080
```
