# GoToPlace

![Logo GoToPlace](frontend/img/logo.png)

## ✨ Características

- Lista de lugares en **filas de 3 columnas**: botón **"Como llegar"**, **nombre clicable** (centra el mapa) y botón **"Ver info"** (abre modal con nombre, foto y descripción). Ambos botones comparten el mismo estilo verde.
- Mapa interactivo con Leaflet: pines por cada lugar, zoom y desplazamiento (sin edición).
- Botón **"Como llegar"** en cada lugar → abre Google Maps en pestaña nueva con la ruta desde la geolocalización del celular hasta el destino.
- Modal **"Ver info"** que además centra el mapa en el lugar elegido.
- Responsive: en pantallas pequeñas las columnas se apilan (la lista mantiene sus 3 columnas fijas).
- 6 lugares de ejemplo (Tandil) en `frontend/data/places.js`.

## 🚀 Demo

Abrí `frontend/index.html` directamente en el navegador. No requiere servidor ni instalación (Leaflet se carga por CDN, requiere conexión a internet).

## 🧱 Estructura

```text
GoToPlace/
├── frontend/
│   ├── css/
│   │   └── style.css
│   ├── data/
│   │   └── places.js
│   ├── img/
│   │   ├── logo.png
│   │   └── (svg de los lugares)
│   ├── js/
│   │   └── script.js
│   └── index.html
├── tests/
│   └── test-simple.js
├── PLAN.md
└── README.md
```

## 🛠 Tecnologías

- HTML5
- CSS3 (grid, flexbox, media queries)
- JavaScript (vanilla)
- [Leaflet](https://leafletjs.com/) (CDN) + tiles de OSM France HOT (dato de OpenStreetMap)
- Google Maps (enlace "Como llegar")

## ⚙️ Cómo funciona

1. `script.js` lee el array `places` de `data/places.js`.
2. `initMap()` inicializa el mapa de Leaflet centrado en Tandil (tiles de OSM France HOT) y agrega un pin por lugar con su popup (que muestra el **resumen** de cada sitio).
3. `renderList()` construye la lista en filas de 3 columnas: **"Como llegar"**, **nombre clicable** y **"Ver info"**.
4. Click en el **nombre** → el mapa se centra en el lugar (`flyTo`) y abre el popup.
5. **"Ver info"** → abre un modal con nombre, foto y descripción, y también centra el mapa.
6. El botón **"Como llegar"** usa `navigator.geolocation` para obtener la posición del usuario y abre Google Maps en modo conducción (`travelmode=driving`). Si no se obtiene la ubicación, abre igualmente con el destino.

## 📸 Captura

![Captura de la demo](frontend/img/captura.jpg)
*Captura de la demo de GoToPlace.*

## 📄 Licencia

[MIT](LICENSE) © 2026 GoToPlace
