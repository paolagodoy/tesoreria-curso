# 🏫 Tesorería Curso 2026

App web para gestión de tesorería de curso escolar, con integración a Google Sheets para auditoría.

## ✅ Antes de publicar — 2 cosas a personalizar

Abre `src/App.jsx` y cambia:

### 1. Lista de alumnos (línea ~6)
```js
const ALUMNOS = [
  "María González",
  "Pedro Rodríguez",
  // ... agrega todos los alumnos del curso
];
```

### 2. Link del formulario de comprobantes (línea ~14)
```js
const FORM_COMPROBANTE_URL = "https://forms.google.com/TU_FORM_AQUI";
```

---

## 🚀 Publicar en Vercel (gratis)

### Paso 1 — Subir a GitHub
1. Ve a [github.com](https://github.com) → **New repository**
2. Nombre: `tesoreria-curso` → **Create repository**
3. Sube los archivos de esta carpeta

### Paso 2 — Conectar con Vercel
1. Ve a [vercel.com](https://vercel.com) → **Add New Project**
2. Conecta tu repositorio de GitHub
3. Framework: **Vite** (lo detecta solo)
4. **NO hagas deploy aún** — primero agrega las variables de entorno

### Paso 3 — Variables de entorno en Vercel
En el panel de tu proyecto → **Settings → Environment Variables**, agrega:

| Variable | Valor |
|---|---|
| `SHEET_ID` | `1PjyUW_Jq8R9eBIJdftbr8jK6V_OhX8w51UcRaFv5-cs` |
| `GOOGLE_CLIENT_EMAIL` | `tesoreria-app@tesoreria-490600.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | *(el contenido del campo `private_key` de tu JSON, con las comillas)* |

### Paso 4 — Deploy
Haz clic en **Deploy** → en 2 minutos tienes tu URL lista para compartir.

---

## 📱 Cómo usar

### Vista Apoderado (URL pública)
- Los apoderados entran a la URL y registran su pago
- Después suben su comprobante al Google Form separado

### Vista Tesorera 🔐 (botón arriba a la derecha)
- **📊 Resumen** — saldo, gráfico mensual, últimos movimientos
- **💰 Pagos** — historial de todos los ingresos
- **📤 Gastos** — registrar y ver gastos
- **✅ Control** — ver quién pagó y quién debe, por mes

### Auditoría
Todos los datos también quedan en tu Google Sheets:
`https://docs.google.com/spreadsheets/d/1PjyUW_Jq8R9eBIJdftbr8jK6V_OhX8w51UcRaFv5-cs`
