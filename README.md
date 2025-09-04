## Diagnosia Monorepo

Full‑stack Online Pathology Lab Booking System:
- Backend: Node.js/Express + PostgreSQL
- Frontend: React + Vite + Tailwind

### Repository structure

```
Diagnosia/
├─ Diagnosia_Backend/       # Express API, PostgreSQL access, business logic
│  ├─ config/               # DB pool config
│  ├─ src/                  # App, routes, controllers, middleware
│  └─ models/               # SQL schema & seed scripts
├─ Diagnosia_Frontend/      # React app (Vite)
│  ├─ public/
│  └─ src/
└─ Diagnosia_Docs/          # ER diagrams & schema docs
```

---

## Prerequisites
- Node.js 18+ (recommended LTS)
- npm 9+ (bundled with Node 18)
- PostgreSQL 13+ (with psql CLI available on PATH)

---

## Quick start (local development)

1) Backend environment
- Copy example env and adjust values

```powershell
Copy-Item "Diagnosia_Backend/.env.example" "Diagnosia_Backend/.env"
```

Edit `Diagnosia_Backend/.env`:
- PORT=5000 (default used by the frontend proxy)
- DATABASE_URL=postgres://<user>:<password>@localhost:5432/diagnosia
- JWT_SECRET=your-strong-secret

2) Initialize database (first run only)
Create a database and run schema + optional seed:

```powershell
psql -U <user> -h localhost -p 5432 -c "CREATE DATABASE diagnosia;"
psql -U <user> -h localhost -d diagnosia -f "Diagnosia_Backend/src/models/init.sql"
# Optional: sample data
psql -U <user> -h localhost -d diagnosia -f "Diagnosia_Backend/src/models/seed.sql"
```

3) Install dependencies

```powershell
# Backend
cd Diagnosia_Backend
npm install

# Frontend (in another shell or after the above completes)
cd ../Diagnosia_Frontend
npm install
```

4) Run in development

```powershell
# Backend (shell 1)
cd Diagnosia_Backend
npm run dev   # starts Express on http://localhost:5000

# Frontend (shell 2)
cd Diagnosia_Frontend
npm run dev   # starts Vite on http://localhost:3000
```

Open http://localhost:3000. The Vite dev server proxies `/api` requests to `http://localhost:5000` by default (see `Diagnosia_Frontend/vite.config.js`).

---

## Configuration

### Backend (`Diagnosia_Backend/.env`)
- PORT=5000
- DATABASE_URL=postgres://<user>:<password>@localhost:5432/diagnosia
- JWT_SECRET=replace-me

The API base URL is `http://localhost:5000/api`.

### Frontend (`Diagnosia_Frontend/.env`)
Optional. Defaults to the proxy set in Vite config.

- VITE_API_URL=http://localhost:5000/api

If you set `VITE_API_URL`, the frontend will use it instead of the Vite proxy.

---

## Useful scripts

Backend (from `Diagnosia_Backend`):
- `npm run dev` – start API with nodemon
- `npm start` – start API with node

Frontend (from `Diagnosia_Frontend`):
- `npm run dev` – start Vite dev server
- `npm run build` – build production bundle to `dist/`
- `npm run preview` – preview the production build locally

---

## Troubleshooting
- Port in use: change `PORT` in backend `.env` and update `VITE_API_URL` or Vite proxy target accordingly.
- Database connection errors: verify `DATABASE_URL` and that the `diagnosia` DB exists; run the SQL scripts if empty.
- 401 Unauthorized from API: ensure `JWT_SECRET` is set consistently and tokens are present in localStorage.
- CORS issues: the current server enables CORS broadly; if you lock it down later, add your frontend origin.

---

## Production notes (high level)
- Build the frontend (`npm run build`) and serve `dist/` via your preferred static host or behind the Express app with a static route (not wired by default).
- Configure a managed PostgreSQL instance and set `DATABASE_URL`.
- Use environment variables for secrets via your host’s secret manager.
