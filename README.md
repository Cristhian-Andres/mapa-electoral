# Mapa Electoral Colombia 2026

Plataforma de visualización de resultados electorales presidenciales de Colombia. Permite explorar los resultados de la primera vuelta 2026 por departamento y municipio, con mapa interactivo, estadísticas nacionales y tablas filtrables con más de 1.100 municipios.

---

## Características

- **Mapa interactivo** de Colombia con colores por candidato ganador por departamento
- **Dashboard nacional** con votos totales, participación, margen y proyección de segunda vuelta
- **Drill-down** por departamento y por municipio
- **Tablas filtrables y paginadas** con todos los departamentos (33) y municipios (1.189)
- **Búsqueda global** de departamentos y municipios
- **Comparación de candidatos** con barras proporcionales
- **Diseño responsivo** optimizado para móvil y escritorio
- **Compartir en redes sociales** desde cada vista

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + TypeScript + Tailwind CSS 4 |
| Mapa | React Simple Maps 3 + D3-Geo |
| Gráficas | Recharts 3 |
| Base de datos | PostgreSQL en Supabase |
| ORM | Prisma 7 + `@prisma/adapter-pg` |
| Íconos | Lucide React |
| Datos electorales | CSV de la Registraduría Nacional |

---

## Requisitos previos

- Node.js 18 o superior
- Una cuenta y proyecto en [Supabase](https://supabase.com)
- Los archivos de datos en `data/`:
  - `data/censo_por_departamento.json` — datos censales por departamento
  - `data/CONSOLIDADO.csv` — votos por municipio y candidato (~145 MB)

---

## Instalación

### 1. Clonar e instalar dependencias

```bash
git clone <repo-url>
cd app-mmv
npm install
```

### 2. Variables de entorno

Copia el archivo de ejemplo y completa las credenciales de Supabase:

```bash
cp .env.example .env
```

Edita `.env` con los valores de tu proyecto:

```env
# Conexión para la aplicación (pooler de transacciones)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Conexión directa para migraciones y seed
DIRECT_URL="postgresql://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres"

# Claves públicas de Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
```

> Los valores exactos los encuentras en **Supabase → Project Settings → Database / API**.

### 3. Preparar la base de datos

```bash
# Genera el cliente de Prisma
npm run db:generate

# Crea las tablas en Supabase
npm run db:migrate

# Carga los datos electorales (puede tardar varios minutos)
npm run db:seed
```

### 4. Iniciar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

---

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo en `localhost:3000` |
| `npm run build` | Build de producción |
| `npm start` | Servidor de producción |
| `npm run lint` | Verificación ESLint |
| `npm run db:generate` | Genera el cliente Prisma |
| `npm run db:push` | Sincroniza el esquema sin migraciones |
| `npm run db:migrate` | Crea y aplica una migración |
| `npm run db:seed` | Carga los datos electorales desde CSV |
| `npm run db:studio` | Abre Prisma Studio (GUI de la BD) |

---

## Estructura del proyecto

```
app-mmv/
├── data/
│   ├── censo_por_departamento.json   # Datos censales
│   └── CONSOLIDADO.csv               # Votos (Registraduría)
├── prisma/
│   ├── schema.prisma                 # Modelos de BD
│   └── seed.ts                       # Script de carga de datos
├── public/
│   └── colombia-departments.json     # GeoJSON del mapa
└── src/
    ├── app/
    │   ├── page.tsx                  # Página principal
    │   ├── layout.tsx                # Layout raíz
    │   ├── departamento/[code]/      # Página por departamento
    │   ├── municipio/[dep]/[mun]/    # Página por municipio
    │   └── api/                      # Endpoints REST
    ├── components/
    │   ├── Header.tsx
    │   ├── Footer.tsx
    │   ├── dashboard/                # Componentes del dashboard
    │   ├── map/                      # Mapa interactivo
    │   └── ui/                       # Componentes reutilizables
    ├── lib/
    │   ├── prisma.ts                 # Singleton de Prisma + pool PG
    │   └── utils.ts                  # Utilidades (formateo, clases)
    └── types/
        └── index.ts                  # Interfaces TypeScript
```

---

## Modelo de datos

```
Department (33 registros)
├── code           — código departamental
├── name           — nombre oficial DANE
├── cepedaVotes    — votos para Cepeda Castro
├── espriellaVotes — votos para De la Espriella
├── margin / marginPct
├── participationPct
└── ──> Municipality[]

Municipality (1.189 registros)
├── departmentCode / municipalityCode
├── name
├── cepedaVotes / espriellaVotes
├── totalEmitted / totalPotencial
├── participationPct
└── ──> CandidateResult[]

CandidateResult
├── candidateName / candidateCedula
├── partyName
├── votes / pct
└── ──> Municipality
```

---

## API endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/departments` | Lista todos los departamentos |
| `GET` | `/api/department/[code]` | Detalle de un departamento |
| `GET` | `/api/municipality/[dep]/[mun]` | Detalle de un municipio |
| `GET` | `/api/search?q=...` | Búsqueda de departamentos y municipios |

---

## Candidatos

| Candidato | Partido | Cédula |
|-----------|---------|--------|
| Iván Cepeda Castro | Pacto Histórico | 79262397 |
| Abelardo De la Espriella | Defensores de la Patria | 11004242 |

---

## Despliegue en Vercel

El proyecto está optimizado para Vercel. Configura las variables de entorno en **Vercel → Project → Settings → Environment Variables** con los mismos valores del `.env`.

```bash
# Con la CLI de Vercel
vercel env pull   # descarga las env vars del proyecto
vercel deploy     # despliega
```

---

## Autor

Desarrollado por **Cristian Luna**

- Instagram: [@cristhian_lunaa](https://www.instagram.com/cristhian_lunaa)
- Facebook: [CHRISTHNN](https://www.facebook.com/CHRISTHNN?locale=es_LA)
- LinkedIn: [cristhian-lunaa](https://www.linkedin.com/in/cristhian-lunaa/)

---

*Datos electorales: Registraduría Nacional del Estado Civil de Colombia*
