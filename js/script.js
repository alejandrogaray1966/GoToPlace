/**
 * Módulo principal de GoToPlace.
 *
 * Encapsula toda la lógica del componente en una IIFE para no contaminar
 * el scope global (salvo el array `places`, que se carga desde
 * `data/places.js`):
 *  - Renderiza la lista de lugares turísticos en filas de 3 columnas.
 *  - Inicializa y maneja el mapa Leaflet (pines, popups, centrado).
 *  - Abre el modal "Ver info" con nombre, foto y descripción.
 *  - Construye el enlace de Google Maps con geolocalización del usuario.
 */
(function () {
    "use strict";

    /** Instancia única del mapa Leaflet (se crea una sola vez). */
    let map = null;

    /** Mapa de marcadores Leaflet indexados por id de lugar. */
    const markers = {};

    /** Centro inicial del mapa (Tandil). */
    const MAP_CENTER = { lat: -37.3215, lng: -59.1332 };
    /** Zoom inicial del mapa completo. */
    const MAP_ZOOM = 12;
    /** Zoom usado al centrar y enfocar un lugar puntual. */
    const MAP_ZOOM_PLACE = 16;

    /** Referencias cacheadas a los nodos del modal "Ver info". */
    const modal = document.getElementById("modal");
    const modalImage = document.getElementById("modal-image");
    const modalName = document.getElementById("modal-name");
    const modalDescription = document.getElementById("modal-description");
    const modalClose = modal.querySelector(".modal-close");

    /**
     * Inicializa el mapa de Leaflet centrado en Tandil, agrega la capa de
     * tiles (OSM France HOT) y crea un pin con su popup por cada lugar.
     *
     * Solo se ejecuta una vez, al cargar la página. El mapa resultante se
     * reutiliza en todas las interacciones (no se vuelve a instanciar).
     */
    function initMap() {
        map = L.map("map").setView([MAP_CENTER.lat, MAP_CENTER.lng], MAP_ZOOM);

        L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>' +
                " contributors \u00b7 Tiles by <a href=\"https://www.hotosm.org/\">HOT</a>",
            subdomains: "abc",
            maxZoom: 19
        }).addTo(map);

        for (const place of places) {
            const marker = L.marker([place.coords.lat, place.coords.lng])
                .bindPopup(
                    "<strong>" + escapeHtml(place.name) + "</strong>" +
                    (place.resumen ? "<br>" + escapeHtml(place.resumen) : "")
                )
                .addTo(map);

            markers[place.id] = marker;
        }
    }

    /**
     * Construye la lista de lugares turísticos.
     *
     * Por cada elemento de `places` genera una fila de 3 columnas:
     * botón "Como llegar", nombre clicable (centra el mapa) y
     * botón "Ver info" (abre el modal). Se arma en un DocumentFragment
     * y se inserta una sola vez en el contenedor `#lista-places`.
     */
    function renderList() {
        const container = document.getElementById("lista-places");
        const fragment = document.createDocumentFragment();

        for (const place of places) {
            const row = document.createElement("div");
            row.className = "place-row";

            const btnGo = document.createElement("button");
            btnGo.className = "cta-btn";
            btnGo.type = "button";
            btnGo.dataset.id = place.id;
            btnGo.textContent = "Como llegar";
            btnGo.addEventListener("click", function (event) {
                event.stopPropagation();
                openDirections(place);
            });

            const name = document.createElement("span");
            name.className = "place-name";
            name.textContent = place.name;
            name.tabIndex = 0;
            name.setAttribute("role", "button");
            name.title = "Centrar en el mapa";
            name.addEventListener("click", function () {
                focusPlace(place);
            });
            name.addEventListener("keydown", function (event) {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    focusPlace(place);
                }
            });

            const btnInfo = document.createElement("button");
            btnInfo.className = "info-btn";
            btnInfo.type = "button";
            btnInfo.dataset.id = place.id;
            btnInfo.textContent = "Ver info";
            btnInfo.addEventListener("click", function (event) {
                event.stopPropagation();
                openInfoModal(place);
            });

            row.appendChild(btnGo);
            row.appendChild(name);
            row.appendChild(btnInfo);
            fragment.appendChild(row);
        }

        container.appendChild(fragment);
    }

    /**
     * Centra el mapa en el lugar indicado y abre su popup.
     *
     * Reutiliza el mapa existente (flyTo no recrea el mapa) y el marker ya
     * cargado. El popup se abre de inmediato: Leaflet mantiene el pin
     * anclado durante la animación, por lo que no hace falta esperar.
     *
     * @param {Object} place - Lugar con `id` y `coords`.
     */
    function focusPlace(place) {
        const marker = markers[place.id];

        if (!marker) {
            console.warn("GoToPlace: no hay marker para el lugar.", place);
            return;
        }

        map.flyTo([place.coords.lat, place.coords.lng], MAP_ZOOM_PLACE, {
            duration: 0.8
        });

        marker.openPopup();
    }

    /**
     * Abre el modal "Ver info" de un lugar.
     *
     * Completa la imagen, el nombre y la descripción en el modal, lo hace
     * visible y bloquea el scroll del fondo.
     *
     * @param {Object} place - Lugar cuyo modal se desea abrir.
     */
    function openInfoModal(place) {
        modalImage.src = place.image;
        modalImage.alt = place.name;
        modalName.textContent = place.name;
        modalDescription.textContent = place.description;

        focusPlace(place);
        modal.hidden = false;
        document.body.style.overflow = "hidden";
        modalClose.focus();
    }

    /**
     * Cierra el modal "Ver info" y restaura el scroll del fondo.
     */
    function closeInfoModal() {
        modal.hidden = true;
        document.body.style.overflow = "";
    }

    /**
     * Abre Google Maps con la ruta hacia el lugar seleccionado.
     *
     * Intenta obtener la geolocalización del usuario con la API nativa y la
     * usa como origen; si no hay permisos, GPS o soporte, abre el enlace
     * solo con el destino (Google usa la ubicación del dispositivo).
     *
     * @param {Object} place - Lugar elegido como destino de la ruta.
     */
    function openDirections(place) {
        const params = new URLSearchParams({
            api: "1",
            destination: place.coords.lat + "," + place.coords.lng,
            travelmode: "driving"
        });

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function (position) {
                    params.set(
                        "origin",
                        position.coords.latitude + "," + position.coords.longitude
                    );
                    launchGoogleMaps(params);
                },
                function () {
                    launchGoogleMaps(params);
                },
                { timeout: 8000, maximumAge: 60000 }
            );
        } else {
            launchGoogleMaps(params);
        }
    }

    /**
     * Abre Google Maps en una pestaña nueva con los parámetros de la ruta.
     *
     * @param {URLSearchParams} params - Query string con api, origen,
     *   destino y modo de viaje.
     */
    function launchGoogleMaps(params) {
        const url = "https://www.google.com/maps/dir/?" + params.toString();
        window.open(url, "_blank", "noopener");
    }

    /**
     * Escapa caracteres especiales de un texto para insertarlo como HTML.
     *
     * Previene inyección de HTML/XSS en los popups del mapa.
     *
     * @param {string} text - Texto a escapar.
     * @returns {string} Texto con los caracteres `<`, `>`, `&`, etc. escapados.
     */
    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Vincula los eventos de cierre del modal.
     *
     * Cierra el modal con el botón "×", al hacer click en el fondo (overlay)
     * o al presionar la tecla Escape mientras el modal está abierto.
     */
    function bindModalEvents() {
        modalClose.addEventListener("click", closeInfoModal);

        modal.addEventListener("click", function (event) {
            if (event.target === modal) {
                closeInfoModal();
            }
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && !modal.hidden) {
                closeInfoModal();
            }
        });
    }

    /**
     * Configura la guardia de datos: si `places` no está disponible
     * (por ejemplo si falla la carga de `data/places.js`), lo informa en
     * consola y evita que el resto del módulo falle con un error oscuro.
     *
     * @returns {boolean} `true` si `places` es un array no vacío.
     */
    function hasPlaces() {
        if (typeof places === "undefined" || !Array.isArray(places) || places.length === 0) {
            console.error("GoToPlace: no hay datos en `places` (revisar data/places.js).");
            return false;
        }
        return true;
    }

    document.addEventListener("DOMContentLoaded", function () {
        if (!hasPlaces()) {
            return;
        }
        renderList();
        initMap();
        bindModalEvents();
    });
})();