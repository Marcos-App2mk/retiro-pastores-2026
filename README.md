# Retiro de Pastores 2026 — Registro

App en español para registrar participantes, con códigos QR de entrada y comida, y panel de administración (PIN).
Se publica en **Vercel** desde GitHub. No necesita Firebase.

## Puesta en marcha

1. **GitHub:** crea un repositorio y sube el contenido de esta carpeta (`index.html`, `config.js`, `api/`, `package.json`, `README.md`).
2. **Vercel:** *Add New → Project* → importa el repositorio → *Deploy* (sin configurar nada más).
3. **Base de datos:** en el proyecto de Vercel, pestaña *Storage* → *Create Database* → elige **Upstash for Redis** (plan gratis) → conéctala al proyecto. Vercel agrega solas las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN`.
4. **Variables (Settings → Environment Variables):**
   - `ADMIN_PIN` — el PIN del administrador (si no lo pones, se usa `123789`). Cámbialo.
   - `SCANNER_PIN` — el PIN del escáner de comidas (si no lo pones, se usa `2121`). Cámbialo.
5. **Redeploy** (Deployments → ⋯ → Redeploy) para que tome las variables.
6. Comparte con los campistas el enlace `https://tu-proyecto.vercel.app`.

## Cómo funciona
- **Registro (campistas):** la página principal. El registro pide un teléfono de contacto de 8 dígitos. El código de cada participante es `RP-` más 6 caracteres al azar (ejemplo: `RP-K7M2QX`).
- **Administración:** página aparte, en `/admin` (por ejemplo `https://tu-proyecto.vercel.app/admin`). La pestaña "Admin" de la página principal lleva ahí. Pide el PIN, y desde ahí se accede a todo: lista, filtros, aprobar/rechazar, editar, eliminar, escáner y Excel.
- Cada campista tiene **un solo QR**, que sirve para el registro en la mesa, la entrada y las 9 comidas.
- En el escáner se elige qué se está registrando ("Registro / entrada" o una de las 9 comidas) y se escanea el mismo QR cada vez.
- Si se escanea un QR pendiente, se abre la revisión del comprobante para aprobarlo ahí mismo.
- Para recuperar sus códigos, el participante escribe su código RP- en la pestaña "Mis códigos". Cada campista puede guardar su código y su QR como imagen en sus fotos.

## Archivos
`index.html` (registro), `admin.html` (administración), `shared.js` (código común), `config.js`, `vercel.json`, `api/` (servidor).

## Seguridad
- El PIN se valida en el servidor: sin PIN nadie puede ver la lista, los comprobantes, ni editar o eliminar registros.
- Un campista solo puede crear su propio registro y consultarlo por su ID.
- Todo registro nuevo entra como "pendiente"; solo quien tenga el PIN puede aprobarlo o rechazarlo.

## Probar
Haz un registro desde un teléfono y revisa que aparezca en el panel de administración desde otro.


## Escáner de comidas (`/scanner`)
Página aparte, con PIN propio (`SCANNER_PIN`), solo para escanear comidas y ver el conteo. La entrada al campamento solo se registra desde el escáner del panel de administración. (`/comidas` redirige a `/scanner`.) No muestra la lista de campistas, comprobantes, edición, borrado ni Excel. El PIN de administrador también funciona aquí.


## Página de instrucciones (`/instrucciones`)


## Plantilla para varios eventos
Todo lo que cambia entre eventos está en `config.js` (`window.EVENTO`) y en las 3 imágenes de `assets/`. Consulta `CAMBIAR-DE-EVENTO.md` (en inglés) para los pasos. Variables opcionales de Vercel: `ADMIN_PIN`, `SCANNER_PIN`, `EVENT_ID`.

## Precios por edad
`config.js` tiene una lista `precios` (por edad el primer día del evento). El panel de administración calcula el costo de cada persona, muestra "Aprobar · Pago completo L.600 / L.200" o "Aprobar · Sin costo", y suma lo cobrado. Con `reserva: 0` no hay opción de reserva parcial. Si borras `precios`, la app vuelve a usar un solo precio (`precioTotal`), como en CIY.

## Calculadora de costo por familia
Con `calculadoraFamilia: true` en `config.js`, el registro empieza con una calculadora: nombre del pastor, nombre de la esposa (si asistirá) y nombre y fecha de nacimiento de cada hijo. Muestra el total de la familia y el depósito: el monto de `reserva` (L.800) o el total si es menor (pastor solo = L.600). Se hace **un registro por familia**, con un solo QR; el panel muestra la familia, cobra el total y cuenta las comidas por persona (una familia de 5 = 5 platos al escanear).
