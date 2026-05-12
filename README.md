# DesposteApp – Prototipo de Software para Determinación de Precios en el Desposte de Ganado

**Universidad Santiago de Cali – Ingeniería de Sistemas 2025**
Autores: Juan Esteban Montilla Rayo, Juan Pablo Rodríguez Becerra, Rafael Ángel Davalos Villegas

---

## Requisitos previos
- Python 3.11+
- Node.js 18+
- Cuenta en [Supabase](https://supabase.com) (base de datos PostgreSQL en la nube)

---

## 1. Configurar base de datos (Supabase)

1. Crear un proyecto en [supabase.com](https://supabase.com)
2. Ir a **Settings → Database → Connection string** y copiar la URL del **Session Pooler** (IPv4, puerto 5432)
3. Crear el archivo `backend/.env` con el siguiente contenido:

```env
DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
SECRET_KEY=<clave-secreta-aleatoria>
DEBUG=true
TOKEN_EXPIRE_MINUTES=60
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin2026!
ADMIN_EMAIL=admin@desposte.com
OPERADOR_USERNAME=operador
OPERADOR_PASSWORD=Operador2026!
OPERADOR_EMAIL=operador@desposte.com
```

Las tablas se crean automáticamente al iniciar el backend. Los usuarios por defecto también se crean al arrancar.

---

## 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

Documentación Swagger: http://localhost:8001/docs

> **Nota:** Si el puerto 8001 está ocupado, prueba con otro puerto y actualiza `target` en `frontend/vite.config.js` para que coincida.

---

## 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplicación: http://localhost:5173

---

## Credenciales por defecto

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin | Admin2026! | ADMIN |
| operador | Operador2026! | ESTANDAR |

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
FastAPI (Python) ↔ Supabase PostgreSQL (SQLAlchemy ORM)
       ↕ REST API
React + Vite + Axios + React Router
       ↕
DANE SIPSA (SOAP/OpenData/Demo fallback)
```
