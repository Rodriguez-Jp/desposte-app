# Historias de Usuario — DesposteApp

**Proyecto:** Sistema de optimización de precios para desposte de ganado bovino
**Institución:** Universidad Santiago de Cali — Prototipo de tesis (2025)
**Versión del documento:** 1.0

---

## Contexto

**DesposteApp** es un sistema que calcula precios óptimos de venta de cortes de carne
bovina a partir de: el costo de compra del animal, los costos de proceso (transporte,
sacrificio, mano de obra, refrigeración, etc.), los precios de referencia del mercado
(DANE — SIPSA) y un margen de ganancia configurable. El cálculo de costos por corte
usa un modelo de **costeo ABC** (Activity-Based Costing).

### Roles del sistema

| Rol | Descripción |
|-----|-------------|
| **ADMIN** | Acceso completo, incluida la gestión de usuarios. |
| **ESTANDAR** | Acceso a la operación: animales, cortes, costos, SIPSA y análisis. |

### Convención de las historias

Cada historia sigue el formato:

> **Como** \<rol\>, **quiero** \<funcionalidad\>, **para** \<beneficio\>.

Acompañada de sus **criterios de aceptación** (formato Dado/Cuando/Entonces).

---

## Épica 1 — Autenticación y seguridad

### HU-01 — Inicio de sesión
**Como** usuario registrado, **quiero** iniciar sesión con mi usuario y contraseña,
**para** acceder de forma segura a las funciones del sistema.

**Criterios de aceptación:**
- Dado un usuario activo con credenciales válidas, cuando envía usuario y contraseña, entonces recibe un token JWT (vigencia de 8 horas) y es redirigido al panel principal.
- Dado credenciales inválidas, cuando intenta iniciar sesión, entonces el sistema rechaza el acceso con un mensaje de error claro.
- Dado un usuario inactivo, cuando intenta iniciar sesión, entonces el acceso es denegado.
- El sistema registra la fecha de último acceso del usuario.

### HU-02 — Cierre de sesión
**Como** usuario autenticado, **quiero** cerrar sesión, **para** proteger mi cuenta al
terminar de usar el sistema.

**Criterios de aceptación:**
- Dado un usuario con sesión activa, cuando cierra sesión, entonces el token deja de ser válido y es redirigido a la pantalla de login.

### HU-03 — Protección de rutas
**Como** dueño del sistema, **quiero** que todas las rutas sensibles exijan un token
válido, **para** evitar accesos no autorizados.

**Criterios de aceptación:**
- Dado una petición sin token o con token expirado/ inválido, cuando accede a una ruta protegida, entonces el sistema responde 401 y el frontend redirige automáticamente al login.

### HU-04 — Cambio de contraseña
**Como** usuario autenticado, **quiero** cambiar mi contraseña, **para** mantener la
seguridad de mi cuenta.

**Criterios de aceptación:**
- Dado un usuario autenticado, cuando ingresa su contraseña actual correcta y una nueva, entonces la contraseña se actualiza y las sesiones previas se invalidan (versión de contraseña).
- Dado una contraseña actual incorrecta, cuando intenta el cambio, entonces la operación es rechazada.

### HU-05 — Protección contra abuso de login
**Como** dueño del sistema, **quiero** limitar la tasa de intentos de inicio de sesión,
**para** mitigar ataques de fuerza bruta.

**Criterios de aceptación:**
- Dado múltiples intentos fallidos en poco tiempo, cuando se supera el límite, entonces los nuevos intentos son bloqueados temporalmente.

---

## Épica 2 — Gestión de usuarios (solo ADMIN)

### HU-06 — Consultar mi perfil
**Como** usuario autenticado, **quiero** ver mis datos de perfil (nombre, email, usuario,
rol), **para** confirmar mi información dentro del sistema.

**Criterios de aceptación:**
- Dado un usuario autenticado, cuando consulta su perfil, entonces ve sus datos sin exponer la contraseña.

### HU-07 — Listar usuarios
**Como** ADMIN, **quiero** ver el listado de todos los usuarios, **para** administrar
quién tiene acceso al sistema.

**Criterios de aceptación:**
- Dado un ADMIN autenticado, cuando consulta la lista de usuarios, entonces obtiene todos los usuarios con su rol y estado.
- Dado un usuario ESTANDAR, cuando intenta acceder, entonces el sistema deniega el acceso.

### HU-08 — Crear usuario
**Como** ADMIN, **quiero** crear nuevos usuarios asignándoles un rol, **para** dar
acceso a nuevos miembros del equipo.

**Criterios de aceptación:**
- Dado un ADMIN, cuando crea un usuario con nombre, email, username, contraseña y rol, entonces el usuario queda registrado y puede iniciar sesión.
- Dado un email o username ya existente, cuando intenta crearlo, entonces el sistema rechaza la operación.

### HU-09 — Actualizar usuario
**Como** ADMIN, **quiero** editar los datos y el rol de un usuario, **para** mantener la
información y los permisos al día.

**Criterios de aceptación:**
- Dado un ADMIN, cuando actualiza los datos de un usuario, entonces los cambios se reflejan; puede activar/desactivar la cuenta.

### HU-10 — Eliminar usuario
**Como** ADMIN, **quiero** eliminar usuarios, **para** retirar accesos que ya no se
necesitan.

**Criterios de aceptación:**
- Dado un ADMIN, cuando elimina un usuario, entonces este deja de existir y no puede iniciar sesión.

---

## Épica 3 — Gestión de animales

### HU-11 — Registrar animal
**Como** operador, **quiero** registrar un animal con su código, tipo, raza, peso vivo,
peso canal, calidad y precio de compra, **para** iniciar el costeo de su desposte.

**Criterios de aceptación:**
- Dado los datos del animal, cuando registro un animal con código único, peso vivo y precio de compra, entonces queda almacenado con fecha de registro.
- Dado un código ya existente, cuando intento registrarlo, entonces el sistema rechaza el duplicado.
- El rendimiento del canal se calcula automáticamente como `peso_canal / peso_vivo * 100` cuando el peso canal está disponible.

### HU-12 — Listar y consultar animales
**Como** operador, **quiero** ver el listado de animales y el detalle de cada uno,
**para** consultar la información registrada.

**Criterios de aceptación:**
- Dado animales registrados, cuando consulto el listado, entonces los veo (con paginación).
- Dado un id de animal, cuando consulto su detalle, entonces veo todos sus datos; si no existe, recibo un error 404.

### HU-13 — Editar y eliminar animal
**Como** operador, **quiero** actualizar o eliminar un animal, **para** corregir/
completar información (por ejemplo el peso canal tras el sacrificio) o retirar registros
erróneos.

**Criterios de aceptación:**
- Dado un animal existente, cuando actualizo sus datos, entonces los cambios se guardan.
- Dado un animal existente, cuando lo elimino, entonces se borra junto con sus cortes y costos asociados (eliminación en cascada).

---

## Épica 4 — Gestión de cortes

### HU-14 — Registrar corte
**Como** operador, **quiero** registrar los cortes obtenidos de un animal (nombre,
categoría, peso en kg), **para** poder costear y fijar el precio de cada uno.

**Criterios de aceptación:**
- Dado un animal existente, cuando registro un corte con nombre y peso, entonces queda asociado al animal.
- A cada corte se le asigna un **factor de complejidad** de proceso (1.0 = corte promedio) según su tipo, usado luego en el costeo ABC.

### HU-15 — Listar cortes y cortes por animal
**Como** operador, **quiero** ver todos los cortes y filtrarlos por animal, **para**
revisar el desposte de cada res.

**Criterios de aceptación:**
- Dado cortes registrados, cuando consulto el listado general o por animal, entonces obtengo los cortes correspondientes.

### HU-16 — Editar y eliminar corte
**Como** operador, **quiero** modificar o eliminar un corte, **para** corregir datos o
descartar registros.

**Criterios de aceptación:**
- Dado un corte existente, cuando lo edito, entonces se guardan los cambios.
- Dado un corte existente, cuando lo elimino, entonces se borra junto con su historial de precios.

### HU-17 — Consultar historial de precios de un corte
**Como** operador, **quiero** ver el historial de precios calculados para un corte,
**para** analizar la evolución de su costo y precio sugerido.

**Criterios de aceptación:**
- Dado un corte con análisis previos, cuando consulto su historial, entonces veo cada cálculo con costo, precio sugerido, margen y referencia SIPSA.

---

## Épica 5 — Gestión de costos

### HU-18 — Registrar costo
**Como** operador, **quiero** registrar costos (concepto, categoría, valor, unidad e
inductor), asignados a un animal o al pool global, **para** que se distribuyan en el
costeo de los cortes.

**Criterios de aceptación:**
- Dado un costo, cuando lo registro con concepto y valor, entonces queda almacenado.
- Un costo puede asociarse a un animal específico o quedar como costo global (`animal_id` nulo) aplicable a toda la operación.
- Cada costo define un **inductor ABC** (`KG`, `HORAS_HOMBRE`, `KWH`, `M3_REFRIG`, `FIJO`) que determina cómo se reparte entre los cortes.

### HU-19 — Listar costos y costos por animal
**Como** operador, **quiero** ver todos los costos y los de un animal específico,
**para** controlar la estructura de costos.

**Criterios de aceptación:**
- Dado costos registrados, cuando consulto el listado general o por animal, entonces obtengo los costos correspondientes.

### HU-20 — Editar y eliminar costo
**Como** operador, **quiero** modificar o eliminar costos, **para** mantener actualizada
la información de gastos.

**Criterios de aceptación:**
- Dado un costo existente, cuando lo edito o elimino, entonces el cambio se refleja en futuros cálculos de precios.

---

## Épica 6 — Datos de mercado SIPSA (DANE)

### HU-21 — Consultar precios de mercado SIPSA
**Como** operador, **quiero** consultar los precios de referencia de carne bovina del
servicio SIPSA de DANE, **para** comparar mis precios con el mercado.

**Criterios de aceptación:**
- Dado el servicio SIPSA disponible, cuando consulto precios, entonces obtengo los datos de mercado por corte.
- Dado el servicio SIPSA no disponible, cuando consulto precios, entonces el sistema usa datos de demostración como respaldo (fallback), sin interrumpir la operación.

### HU-22 — Promedios históricos SIPSA
**Como** operador, **quiero** ver los promedios de precios SIPSA por corte, **para**
tener una referencia estable del mercado.

**Criterios de aceptación:**
- Dado datos SIPSA, cuando consulto promedios, entonces obtengo el precio promedio (y máximo) por tipo de corte.

---

## Épica 7 — Análisis y cálculo de precios

### HU-23 — Calcular precios sugeridos de un animal
**Como** operador, **quiero** calcular los precios sugeridos de todos los cortes de un
animal aplicando un margen objetivo, **para** definir precios de venta rentables y
competitivos.

**Criterios de aceptación:**
- Dado un animal con cortes y costos, cuando ejecuto el cálculo con un margen (por defecto 25%), entonces el sistema:
  - Distribuye el costo de compra (material) entre los cortes vendibles según su participación en peso, absorbiendo la merma del canal.
  - Reparte los costos de proceso según su inductor: por peso (`KG`/`FIJO`) o por base ponderada `peso × factor_complejidad` (`HORAS_HOMBRE`, `KWH`, `M3_REFRIG`).
  - Calcula el costo ABC por kg de cada corte.
  - Aplica el precio de referencia SIPSA correspondiente y el margen objetivo para generar un **precio sugerido**, un **precio mínimo viable** y un **precio máximo de mercado**.
  - Guarda los resultados en el corte y crea un registro histórico de precio.
- Dado un animal sin peso canal, cuando intento costear, entonces el sistema no inventa un canal teórico y lo refleja en el resultado (costo no calculable).

### HU-24 — Consultar costo por kg de un animal
**Como** operador, **quiero** ver el costo directo por kg de canal de un animal,
**para** conocer su costo base antes del margen.

**Criterios de aceptación:**
- Dado un animal con peso canal y costos, cuando consulto el costo por kg, entonces obtengo `(precio_compra + costos) / peso_canal`.
- Dado un animal sin peso canal, cuando consulto, entonces el sistema indica que no es calculable (no asume valores).

### HU-25 — Panel de control (Dashboard)
**Como** operador, **quiero** un panel con métricas clave (total de animales, total de
cortes, costo promedio por kg y margen promedio), **para** tener una visión general del
estado del negocio.

**Criterios de aceptación:**
- Dado datos en el sistema, cuando abro el dashboard, entonces veo las métricas agregadas calculadas en tiempo real.

---

## Resumen de trazabilidad (Historia → Endpoint)

| Historia | Endpoint / Pantalla |
|----------|---------------------|
| HU-01 | `POST /api/v1/auth/login` — Login |
| HU-02 | `POST /api/v1/auth/logout` |
| HU-04 | `POST /api/v1/auth/cambiar-password` — Perfil |
| HU-06 | `GET /api/v1/auth/me` — Perfil |
| HU-07..HU-10 | `GET/POST/PUT/DELETE /api/v1/auth/usuarios` — Usuarios |
| HU-11..HU-13 | `/api/v1/animales` — Animales |
| HU-14..HU-17 | `/api/v1/cortes` — Cortes |
| HU-18..HU-20 | `/api/v1/costos` — Costos |
| HU-21..HU-22 | `/api/v1/sipsa` — SIPSA |
| HU-23..HU-25 | `/api/v1/analisis` — Análisis / Dashboard |

---

*Documento generado a partir del código fuente del prototipo DesposteApp.*
