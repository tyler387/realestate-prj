# toyPrj

Monorepo with:
- `backend` (Spring Boot + PostgreSQL/PostGIS, Supabase compatible)
- `frontend` (React + Vite)

## Single Source Of Truth

- Use root `.env` only.
- Use root `.gitignore` only.
- Use root `docker-compose.yml` only.

Frontend is configured to read env from root via `frontend/vite.config.ts` (`envDir`).

## Setup

1. Create root `.env` from `.env.example`
2. Fill real API keys and Supabase DB credentials
3. Configure project-local Java 17 path (one-time):

```powershell
cd backend
copy .java17-home.example .java17-home
```

Edit `backend/.java17-home` to your local JDK 17 path.

4. Run backend locally with normal Gradle wrapper:

```powershell
cd backend
.\gradlew.bat bootRun
```

5. Run frontend:

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables (root `.env`)

```env
PUBLIC_DATA_API_KEY=...
KAKAO_REST_API_KEY=...
DB_URL=jdbc:postgresql://db.<your-project-ref>.supabase.co:5432/postgres?sslmode=require
DB_USERNAME=postgres
DB_PASSWORD=...
VITE_KAKAO_MAP_KEY=...
VITE_API_BASE_URL=http://localhost:8081
```

## Docker Modes

### 1) Backend only (for cloud DB like Supabase)

```bash
docker compose up -d --build
```

This uses `DB_URL/DB_USERNAME/DB_PASSWORD` from root `.env`.

### 2) Local Postgres + backend (optional)

```bash
docker compose -f docker-compose.yml -f docker-compose.local-db.yml up -d --build
```

## Render Deployment (Docker)

Render can build from `backend/Dockerfile`. Set environment variables in Render:

- `SPRING_PROFILES_ACTIVE=prod`
- `DB_URL=jdbc:postgresql://db.<your-project-ref>.supabase.co:5432/postgres?sslmode=require`
- `DB_USERNAME=postgres`
- `DB_PASSWORD=<supabase-db-password>`
- `PUBLIC_DATA_API_KEY=...`
- `KAKAO_REST_API_KEY=...`
- `PORT` is provided by Render automatically (Spring reads it via `server.port=${PORT:8081}`)

## Java Version Policy

- Global/local machine default Java can stay Java 8.
- For this repo only, `backend/gradlew.bat` reads `backend/.java17-home` first and uses that JDK for project runs.
- This means you can run normal `.\gradlew.bat ...` commands while keeping global Java 8 unchanged.
- Render deploy still uses Docker (`backend/Dockerfile`) and is independent from local Java settings.
