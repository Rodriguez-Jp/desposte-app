# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DesposteApp** is a pricing optimization system for cattle butchering (*desposte de ganado*). It calculates optimal cut prices based on purchase costs, DANE SIPSA market data, and configurable profit margins. A university prototype for Universidad Santiago de Cali (2025).

## Development Commands

### Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# API docs: http://localhost:8000/docs
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev      # Dev server on port 5173
npm run build    # Production build
npm run preview
```

### Database Setup
```sql
CREATE DATABASE desposte_db;
```
Then configure `backend/.env` with PostgreSQL credentials. The backend auto-creates tables on startup.

**Default credentials created on startup:** `admin/Admin2026!` (ADMIN role), `demo/Demo2026!` (ESTANDAR role).

## Architecture

### Monorepo Structure
- `backend/` — Python FastAPI with PostgreSQL (SQLAlchemy ORM)
- `frontend/` — React 18 with Vite, Axios, React Router 6

### Frontend-Backend Communication
- Vite dev proxy (`vite.config.js`) routes `/api/*` → `http://localhost:8000`
- Axios instance in `frontend/src/services/api.js` automatically attaches JWT Bearer token from localStorage to all requests; 401 responses auto-redirect to `/login`

### Authentication
- JWT (HS256, 8-hour expiry) via `POST /api/v1/auth/login`
- Token + user info stored in localStorage; managed through `AuthContext` (`frontend/src/context/`)
- Backend: `HTTPBearer` dependency in `backend/app/dependencies/` validates all protected routes
- Two roles: `ADMIN` (full access incl. user management) and `ESTANDAR` (standard access)
- Frontend: `ProtectedRoute` component wraps authenticated routes; `/usuarios` is ADMIN-only

### Core Domain Flow
1. **Animal registration** → Purchase price + live/carcass weight recorded
2. **Costs assigned** → Transport, slaughter, etc. linked to animal or global pool
3. **SIPSA data fetched** → Market bovine prices from DANE SOAP web service (zeep), stored in `HistoricoSIPSA`; falls back to demo data if service unavailable
4. **Price calculation** (`backend/app/services/analisis_service.py`) → cost per kg = (purchase + costs) / carcass weight → apply SIPSA reference prices per cut → apply profit margin → write suggested prices back to `Corte`

### Backend Structure
```
backend/app/
├── models/       # SQLAlchemy ORM: Animal, Corte, Costo, Usuario, HistoricoSIPSA, Precio
├── schemas/      # Pydantic request/response models
├── routes/       # FastAPI routers: animales, cortes, costos, sipsa, analisis, auth
├── services/     # Business logic: auth_service.py, analisis_service.py
├── dependencies/ # JWT auth dependency
├── database/     # SQLAlchemy engine, SessionLocal, Base
└── sipsa/        # DANE SIPSA SOAP client + data processor
```

### API Route Prefixes
| Prefix | Purpose |
|--------|---------|
| `/api/v1/auth` | Login, current user, password change, user CRUD |
| `/api/v1/animales` | Animal CRUD |
| `/api/v1/cortes` | Cut CRUD, lookup by animal |
| `/api/v1/costos` | Cost CRUD, lookup by animal |
| `/api/v1/sipsa` | Fetch/store SIPSA data, historical averages |
| `/api/v1/analisis` | Dashboard metrics, price calculation, cost-per-kg |

### Frontend Structure
```
frontend/src/
├── pages/        # One page per route: Login, Dashboard, Animales, Cortes, Costos, SIPSA, Analisis, Usuarios, Perfil
├── components/   # Navbar, Toast, ProtectedRoute
├── context/      # AuthContext (user state, login/logout)
├── services/     # api.js (Axios instance)
└── App.jsx       # React Router route definitions
```

## Environment Configuration

`backend/.env`:
```
DATABASE_URL=postgresql://postgres:admin@localhost:5432/desposte_db
SIPSA_WSDL=http://appweb.dane.gov.co/sipsaWS/SrvSipsaUpraBeanService?WSDL
# SECRET_KEY=desposte-secret-key-cambia-en-produccion-2026
# TOKEN_EXPIRE_MINUTES=480
```

CORS is configured in `backend/main.py` to allow `localhost:5173` and `localhost:3000`.
