# Conversation Practice — Speaking Cards

Motor genérico y reutilizable para actividades de tipo **Conversation Practice**
(CEFR A1.1 en adelante). Un solo HTML/CSS/JS renderiza cualquier unidad a
partir de un archivo JSON de datos — para publicar una unidad nueva **no se
toca código**, solo se agrega un JSON.

## Estructura del repositorio

```
/
├── index.html              # motor de la vista (sin texto de contenido)
├── css/
│   └── styles.css          # estilos de marca, reutilizables entre unidades
├── js/
│   └── app.js               # fetch del JSON + render + Text-to-Speech
├── data/
│   └── units/
│       ├── unit-04.json     # "At the Supermarket"
│       └── unit-05.json     # (siguiente unidad, mismo esquema)
└── assets/
    ├── logo-intecap.png
    └── ingles-para-todos.png
```

## Cómo elegir qué unidad se muestra

`js/app.js` resuelve el id de la unidad en este orden:

1. Parámetro de URL: `index.html?unit=unit-05`
2. Atributo `data-unit` en `<body>` (`<body data-unit="unit-05">`)
3. Valor por defecto: `"unit-04"`

Esto te permite, por ejemplo, enlazar cada actividad de tu LMS/curso
directamente a `index.html?unit=unit-05` sin duplicar archivos.

## Esquema del JSON (`data/units/<unit-id>.json`)

```jsonc
{
  "id": "unit-04",

  // Datos que llenan el banner azul
  "meta": {
    "unitLabel": "Unit 4",
    "title": "AT THE SUPERMARKET",
    "subtitle": "Topic: Shopping, Prices, and Locations",
    "cefrLevel": "A1.1",
    "skill": "Conversation Practice"
  },

  // Ficha técnica (panel colapsable "📖 Ver Ficha Técnica…")
  "guide": {
    "description": "…",
    "objective": "…",
    "instructions": ["Paso 1…", "Paso 2…"],
    "successCriteria": ["Criterio 1…", "Criterio 2…"]
  },

  // Texto corto que aparece en la caja de instrucciones de uso
  "instructionsBanner": "Click on the new vocabulary words…",

  // Tarjetas de vocabulario nuevo
  "vocabulary": [
    { "icon": "📉", "word": "discount", "lang": "en-US", "definition": "…" }
  ],

  // Bloques de diálogo (una tarjeta chat-section por bloque)
  "dialogues": [
    {
      "title": "💰 Checking Prices",
      "highlight": false,          // true = tarjeta resaltada (ej. reto final)
      "lines": [
        { "speaker": "customer", "lang": "en-US", "text": "What is the price of an apple?" },

        // "speech" es opcional: úsalo cuando el texto mostrado (ej. "$11.00")
        // debe pronunciarse distinto (ej. "eleven dollars per kilo")
        { "speaker": "assistant", "lang": "en-GB", "text": "The apples are $11.00 per kilo.",
          "speech": "The apples are eleven dollars per kilo." },

        // separador visual dentro de un mismo bloque de diálogo
        { "type": "divider" }
      ]
    }
  ]
}
```

Reglas clave:
- `speaker` solo acepta `"customer"` o `"assistant"` (define burbuja y alineación).
- `speech` es opcional; si no existe, se usa `text` tal cual para el
  Text-to-Speech (`speechSynthesis`).
- `lang` usa códigos BCP-47 (`en-US`, `en-GB`, `es-GT`, etc.) — te permite
  mezclar acentos por parlante, como en el original.
- `highlight: true` en un diálogo le da el fondo/borde especial (ideal para
  el reto final de la unidad).

## Agregar una unidad nueva

1. Duplica `data/units/unit-04.json` → `data/units/unit-05.json`.
2. Reemplaza `meta`, `guide`, `vocabulary` y `dialogues` con el contenido
   de la nueva unidad (mismo esquema).
3. Enlázala como `index.html?unit=unit-05`.

No es necesario tocar `index.html`, `app.js` ni `styles.css` salvo que
quieras cambiar el diseño de marca en general (en cuyo caso el cambio
aplica automáticamente a todas las unidades).

## Despliegue en Azure Static Web Apps

Este proyecto es 100% estático (HTML/CSS/JS + JSON), así que no necesita
build step. Configuración sugerida (`staticwebapp.config.json` opcional, o
en el workflow de GitHub Actions que genera Azure SWA):

- **App location:** `/` (raíz del repo)
- **Api location:** *(vacío, no hay backend)*
- **Output location:** `/` (no hay carpeta de build, se sirve tal cual)

Si usas el flujo estándar "Azure Static Web Apps" desde GitHub Actions,
el asistente de Azure genera el YAML automáticamente; solo confirma que
`app_location: "/"` y `output_location: ""` (o `"/"`, según la versión de
la acción) para que sirva `index.html`, `css/`, `js/`, `data/` y `assets/`
directamente sin proceso de compilación.

### Nota sobre rutas relativas

`app.js` hace `fetch("data/units/<id>.json")` con ruta relativa, así que
funciona igual en local (`live-server`, etc.) y en el dominio de Azure SWA
sin cambios.

## Pendiente / siguiente iteración sugerida

- Página `catalogo.html` que liste todas las unidades disponibles
  (leyendo un `data/index.json` con `{id, title, cefrLevel}` de cada una)
  para no tener que enlazar cada `?unit=` a mano.
- Botón de "repetir todo el diálogo en orden" (recorre `lines` con `speak`
  en cadena usando el evento `onend` de `SpeechSynthesisUtterance`).
