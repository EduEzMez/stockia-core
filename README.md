# 📦 Stockia — Tu inventario, bajo control.

Sistema SaaS de gestión multi-tenant para inventario, clientes y ventas en cuotas.

---

## 🗂️ Estructura del proyecto

```
stockia/
├── login.html                     # Pantalla de login
├── dashboard.html                 # Panel principal (stats)
├── productos.html                 # ABM de productos + stock log
├── clientes.html                  # ABM de clientes + ver deudas
├── ventas.html                    # Nueva venta + fichas + pagos
├── admin.html                     # Panel admin (empresas, usuarios, backup)
├── styles.css                     # Estilos globales (mobile-first)
├── utils.js                       # Supabase client, helpers, toast, etc.
├── schema.sql                     # SQL completo con RLS
├── logo.svg                       # Logo SVG (caja como "o")
└── supabase-edge-function-...ts   # Edge Function: resumen semanal
```

---

## 🚀 Pasos de despliegue

### 1. Supabase: ejecutar el schema

1. Ir a **Supabase Dashboard → SQL Editor**
2. Copiar y ejecutar todo el contenido de `schema.sql`
3. Verificar que las tablas aparecen en **Table Editor**

### 2. Crear el primer Admin Global

1. En Supabase → **Authentication → Users → Add user**
2. Crear con tu email y contraseña
3. En SQL Editor ejecutar:
```sql
UPDATE public.perfiles
SET rol = 'admin_global', nombre = 'Tu Nombre'
WHERE email = 'tu@email.com';
```

### 3. Cloudflare Pages

1. Subir todos los archivos `.html`, `styles.css` y `utils.js` a un repo GitHub
2. En Cloudflare Pages: conectar el repo
3. Build: sin build command, directorio raíz `.`
4. Deploy

### 4. Edge Function (opcional: emails semanales)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link al proyecto
supabase link --project-ref gkwtspgbpqjwvyalwymc

# Crear carpeta
mkdir -p supabase/functions/resumen-semanal

# Copiar el .ts al archivo index.ts en esa carpeta
cp supabase-edge-function-resumen-semanal.ts supabase/functions/resumen-semanal/index.ts

# Deploy
supabase functions deploy resumen-semanal

# Configurar secrets (para emails con Resend)
supabase secrets set RESEND_API_KEY=re_xxxxxx
```

Para el cron, agregar en `supabase/config.toml`:
```toml
[functions.resumen-semanal]
verify_jwt = false
schedule = "0 8 * * 1"
```

---

## 👥 Roles y permisos

| Rol | Acceso |
|-----|--------|
| `admin_global` | Todo: empresas, usuarios, backups de cualquier empresa |
| `admin_empresa` | Admin de su empresa: operadores, exportar datos propios |
| `operador` | Solo opera: productos, clientes, ventas de su empresa |

---

## 🔐 Seguridad

- **Login obligatorio** con Supabase Auth (email + contraseña)
- **RLS activado** en todas las tablas
- Usuarios solo ven datos de su `empresa_id`
- Admin Global ve todo mediante políticas especiales
- Validaciones frontend + constraints de base de datos

---

## 💡 Lógica de cuotas y mora

Al registrar un pago **fuera de fecha**:
```
monto_pagado = valor_cuota + (valor_cuota × mora%) + (valor_cuota × gasto_admin%)
```

Ejemplo:
- Cuota: $1.000
- Mora: 5% = $50
- Gasto admin: 3% = $30
- **Total: $1.080**

---

## 📱 Mobile First

- Diseñado desde **350px** en adelante
- Menú hamburguesa en móvil → navbar horizontal en desktop (≥768px)
- Todos los inputs y tablas adaptados
- Footer fijo en todas las páginas
- Fuente Inter, tamaños legibles para personas mayores (mín 14px)

---

## 🎨 Paleta de colores

| Variable | Color | Uso |
|---------|-------|-----|
| `--primary` | `#1F3A8A` | Navbar, títulos, botón activo |
| `--secondary` | `#3B82F6` | Botones primarios, links |
| `--accent` | `#10B981` | Botones de éxito, stock OK |
| `--bg` | `#F3F4F6` | Fondo general |
| `--text` | `#111827` | Texto principal |
| `--border` | `#E5E7EB` | Bordes de cards y tablas |

---

## ⚠️ Importante: ANON KEY

Reemplazá la `SUPABASE_ANON_KEY` en `utils.js` y en `login.html` con tu key real completa de Supabase.
La key en los archivos tiene `.PLACEHOLDER` al final — reemplazala por la key real de tu proyecto.
