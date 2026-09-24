# Dashboard de portafolio (`/portafolio`)

Dashboard privado y estático del portafolio de MOOV / Grupo Huerpel. No hace
ninguna llamada a APIs externas en tiempo de ejecución (ni Claude, ni Google
Drive) — todos los datos vienen de un único archivo JSON que se actualiza
periódicamente.

## Dashboard v2 (schema v2, vigente)

El dashboard **no lee directamente** `portfolio-data.json`. Lee `lib/portfolio/portfolio-v2.json`, un archivo **derivado** que se genera así:

```
portfolio-data.json (Cowork, v1)  ┐
excel-bluebox-seed.json (Excel)   ├─ npm run portafolio:migrar ─▶ portfolio-v2.json ─▶ páginas
oportunidades-inversion.json      ┘   (lib/portfolio/migracion.ts)   (schemaV2.ts, validado en build)
```

- **Se captura** (v1 + seed): montos, instrumentos, alertas, series. **Se calcula** (`lib/portfolio/fondoV2.ts`, funciones puras con tests): fondo, NAV, MOIC, TVPI, DPI, RVPI, IRR, concentración, semáforo sugerido, completitud, frescura y lectura del comité. Nada del fondo se captura aparte de las startups.
- `npm run build` ejecuta `portafolio:migrar` primero (`prebuild`), así que el flujo de Cowork (copiar el v1, commit, push) no cambia. En Vercel no existe `cowork/`; el embudo de scouting conserva el valor ya guardado en el v2.
- `npm run portafolio:validar` valida el v2, avisa si quedó desfasado del v1, muestra completitud y discrepancias abiertas.
- `npm test` corre los tests de cálculo (reproducen el Excel al 4Q 2025). `npx playwright test tests/portafolio.spec.ts` corre las pruebas de humo.
- Cada cifra lleva su procedencia (punto verde = documento, azul = reporte de la startup, gris = Excel o estimado, vacío = no reportado). Las discrepancias conocidas están en `DISCREPANCIAS` de `migracion.ts` y se ven en `/portafolio/pendientes`.
- Series mensuales nuevas: agregar `financiero.serie_mensual` en el v1 (ver `cowork/PROPUESTA_skill_moov-portfolio-core_v2.md`).
- Vistas: `/portafolio` (Startups, tabla y tarjetas), `/portafolio/overview` (Fondo, con selector de lente a valor justo o a costo), `/portafolio/startups/[id]` (ficha) y `/portafolio/pendientes`. Los filtros y el orden viven en la URL (`?lente=costo&orden=runway`), sin JavaScript de cliente.

Las secciones de abajo describen el v1, que sigue siendo el archivo que edita Cowork.

## Flujo real de actualización (v1)

Los datos **no se escriben a mano** — los produce Cowork (Claude con acceso
a Google Drive) investigando los documentos fuente del portafolio:

1. **Cowork** trabaja en `/Users/ventureleader/Documents/cursor/MOOV/cowork/`
   (una carpeta **fuera de este repo git**, sin control de versiones). Ahí
   investiga en Drive y escribe/actualiza `cowork/portfolio-data.json`.
2. Ese archivo se **copia** a `lib/portfolio/portfolio-data.json`, dentro
   de este repo — este es el único archivo que el sitio realmente lee y
   despliega. `/cowork` es la carpeta de trabajo; esta ruta es la fuente
   de verdad servida.
3. Commit + push a `main`. Vercel redespliega automático.

```bash
cp /Users/ventureleader/Documents/cursor/MOOV/cowork/portfolio-data.json \
   lib/portfolio/portfolio-data.json
git add lib/portfolio/portfolio-data.json
git commit -m "Update portfolio data"
git push
```

`npm run build` valida la estructura del JSON contra
`lib/portfolio/portfolioSchemas.ts` (Zod) — si Cowork cambia el formato o
falta un campo requerido, el build falla con un mensaje claro en vez de
romper el dashboard en silencio.

El archivo **no es descargable directamente** (no vive en `public/`) — solo
se lee desde código de servidor detrás del login de `/portafolio`, así que
sigue protegido por la contraseña compartida igual que el resto del
dashboard.

## Estructura de `portfolio-data.json`

Formato real tal como lo produce Cowork — nombres de campo en español,
texto libre donde el dato fuente es texto libre:

```jsonc
{
  "ultima_actualizacion": "2026-07-09",
  "fondo": {
    "nombre": "MOOV",
    "entidad": "Grupo Huerpel",
    "total_invertido_confirmado_usd": 511417.98, // solo cuenta lo confirmado
    "startups_total": 10,
    "startups_sanas": 4,
    "startups_vigilar": 4,
    "startups_criticas": 2,
    "startups_sin_monto_confirmado": ["Bemycar", "Autolab", "..."],
    "moic_a_costo": 1.0,
    "crecimiento_pct_a_costo": 0.0,
    "nota_crecimiento": "Cifra conservadora calculada 'a costo'...", // el disclaimer, redactado por Cowork
    "distribucion_instrumento": { "SAFE": 4, "Convertible Note": 1, "...": "..." }
  },
  "startups": [
    {
      "nombre": "Bemycar",             // sin id — la URL usa un slug derivado (ver portfolioData.ts)
      "estado": "sano",                // "sano" | "vigilar" | "critico"
      "sector": "SaaS B2B automotriz...",
      "paises": ["España", "México", "..."],
      "modelo_negocio": "SaaS",
      "legal": {
        "instrumento": "Equity directo (...)", // texto libre, o null si no está localizado
        "monto_usd": null,               // siempre en USD, o null si no está confirmado
        "fecha_inversion": "2023-11-29", // o null
        "cap_usd": null,
        "vencimiento": null,
        "entidad": "Bemy Technology S.L. (España)",
        "notas": "Monto exacto invertido por Huerpel NO confirmado..."
      },
      "financiero": {
        "metrica_principal": "MRR",      // texto libre — el nombre de la métrica que reporta esta startup
        "valor": 47586,
        "moneda": "EUR",                 // código de moneda, o "%" si la métrica es un porcentaje (ej. Autolab)
        "fecha_dato": "2025-11",
        "tendencia": "MRR creció ~10x en 24 meses...",
        // Campos opcionales — solo presentes en las startups que los reportan:
        "arr": 571035,
        "ebitda": 3900000,
        "margen_ebitda_pct": 0.62,
        "arr_objetivo": 3000000
      },
      "situacion_actual": "...",
      "proximos_pasos": ["...", "..."],
      "alertas": ["...", "..."]          // lista plana de texto, sin nivel de severidad
    }
    // ...las otras 9 startups
  ]
}
```

El contrato completo (tipos exactos) está en
`lib/portfolio/portfolioSchemas.ts`. El schema usa `.passthrough()` en
`legal` y `financiero` para no romper si Cowork agrega un campo nuevo que
todavía no mostramos en la UI.

## Qué NO hace este dashboard

- No llama a la API de Anthropic/Claude.
- No llama a Google Drive/Sheets en vivo — esa parte la hace Cowork, por
  separado, antes de que el archivo llegue aquí.
- No tiene chat ni backend de conversación.
- Los filtros y el buscador del grid corren 100% en el navegador sobre los
  datos ya cargados — no disparan ninguna llamada adicional.

## Acceso

Login en `/portafolio/login` con usuario/contraseña. Roles `admin` (puede
gestionar usuarios en `/portafolio/usuarios`) y `viewer`. Ver
`lib/portfolioAuth.ts` / `lib/portfolioUsers.ts` — esto no cambió con el
pivote a datos estáticos.
