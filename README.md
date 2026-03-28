# DesposteApp – Prototipo de Software para Determinación de Precios en el Desposte de Ganado

**Universidad Santiago de Cali – Ingeniería de Sistemas 2025**
Autores: Juan Esteban Montilla Rayo, Juan Pablo Rodríguez Becerra, Rafael Ángel Davalos Villegas

---

## Requisitos previos
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

---

## 1. Crear base de datos

```sql
CREATE DATABASE desposte_db;
```

---

## 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
# Editar .env con tu usuario/contraseña de PostgreSQL
uvicorn main:app --reload --port 8000
```

Documentación Swagger: http://localhost:8000/docs

---

## 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplicación: http://localhost:5173

---

## Flujo de uso

1. **SIPSA** → Actualizar datos → Guardar en BD
2. **Animales** → Registrar animal (código, peso, precio compra)
3. **Cortes** → Asociar cortes al animal
4. **Costos** → Registrar costos adicionales (transporte, sacrificio, etc.)
5. **Análisis** → Seleccionar animal → Calcular Precios → Ver resultados
6. **Dashboard** → Visualizar métricas globales

---

## Arquitectura

```
FastAPI (Python) ↔ PostgreSQL (SQLAlchemy ORM)
       ↕ REST API
React + Vite + Tailwind CSS + Recharts
       ↕
DANE SIPSA (SOAP/OpenData/Demo fallback)
```
