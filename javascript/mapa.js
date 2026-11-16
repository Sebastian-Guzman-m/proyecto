(() => {
    "use strict";
    const estado = document.getElementById("estado-mapa");
    const informar = (texto) => { estado.textContent = texto; };
    if (!window.L) {
        informar("No se pudo cargar el mapa. Comprueba tu conexión y recarga la página.");
        return;
    }

    const clave = "nexo.pines.v1";
    const centro = [9.9281, -84.0907];
    const formulario = document.querySelector(".formulario-plan");
    const ubicacion = document.getElementById("ubicacion-pin");
    let punto = null;
    let seleccion = null;
    let pines = [];
    const coordenadasValidas = (p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lng)
        && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180;
    try {
        const datos = JSON.parse(localStorage.getItem(clave) || "[]");
        if (!Array.isArray(datos)) throw new Error("Formato inválido");
        pines = datos.filter((p) => coordenadasValidas(p) && typeof p.id === "string"
            && typeof p.nombre === "string");
    } catch {
        informar("No se pudieron recuperar tus pines guardados. Puedes crear nuevos pines.");
    }

    const mapa = L.map("contenedor-mapa").setView(centro, 13);
    const creador = L.map("mapa-creacion").setView(centro, 13);
    for (const vista of [mapa, creador]) {
        const teselas = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(vista);
        teselas.on("tileerror", () => informar("No se pudo cargar una parte del mapa. Comprueba tu conexión."));
    }
    const crearIcono = (nombre) => L.icon({
        iconUrl: `imagenes/iconos/${nombre}.svg`,
        iconSize: [32, 44],
        iconAnchor: [16, 43],
        popupAnchor: [0, -38]
    });
    const iconoPin = crearIcono("pin-mapa");
    const iconoSeleccion = crearIcono("pin-seleccion");
    const marcadores = L.layerGroup().addTo(mapa);

    function guardar() {
        try {
            localStorage.setItem(clave, JSON.stringify(pines));
            informar("Pines guardados en este navegador. Haz clic en el mapa para crear otro.");
        } catch {
            informar("El navegador no permitió guardar. Los cambios se perderán al recargar.");
        }
    }

    function dibujar() {
        marcadores.clearLayers();
        for (const pin of pines) {
            const marcador = L.marker([pin.lat, pin.lng], { icon: iconoPin, draggable: true, title: pin.nombre }).addTo(marcadores);
            const contenido = document.createElement("div");
            const titulo = document.createElement("strong");
            titulo.textContent = pin.nombre;
            const datos = document.createElement("p");
            datos.textContent = [pin.fecha, pin.hora, pin.descripcion].filter(Boolean).join(" · ");
            const borrar = document.createElement("button");
            borrar.type = "button";
            borrar.textContent = "Eliminar pin";
            borrar.addEventListener("click", () => {
                pines = pines.filter((p) => p.id !== pin.id);
                guardar();
                dibujar();
            });
            contenido.append(titulo, datos, borrar);
            marcador.bindPopup(contenido);
            marcador.on("dragend", () => {
                const posicion = marcador.getLatLng().wrap();
                pin.lat = posicion.lat;
                pin.lng = posicion.lng;
                guardar();
            });
        }
    }

    function elegir(posicion) {
        punto = posicion.wrap();
        if (seleccion) seleccion.setLatLng(punto);
        else {
            seleccion = L.marker(punto, { icon: iconoSeleccion, draggable: true, title: "Punto de encuentro" }).addTo(creador);
            seleccion.on("dragend", () => elegir(seleccion.getLatLng()));
        }
        ubicacion.textContent = `Punto seleccionado: ${punto.lat.toFixed(5)}, ${punto.lng.toFixed(5)}`;
    }
    creador.on("click", (evento) => elegir(evento.latlng));
    mapa.on("click", (evento) => {
        elegir(evento.latlng);
        location.hash = "crear-plan";
        requestAnimationFrame(() => { creador.invalidateSize(); creador.setView(punto, mapa.getZoom()); });
    });

    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();
        if (!punto) {
            ubicacion.textContent = "Primero haz clic en el mapa para elegir el punto de encuentro.";
            return;
        }
        const nombre = document.getElementById("nombre-plan").value.trim();
        if (!nombre) { document.getElementById("nombre-plan").focus(); return; }
        pines.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            lat: punto.lat, lng: punto.lng, nombre,
            fecha: document.getElementById("fecha-plan").value.trim(),
            hora: document.getElementById("hora-plan").value.trim(),
            descripcion: document.getElementById("descripcion-plan").value.trim()
        });
        const destino = punto;
        guardar();
        dibujar();
        formulario.reset();
        creador.removeLayer(seleccion);
        seleccion = null;
        punto = null;
        ubicacion.textContent = "Haz clic en el mapa para elegir un punto";
        location.hash = "pantalla-mapa";
        requestAnimationFrame(() => { mapa.invalidateSize(); mapa.setView(destino, 15); });
    });

    // Las pantallas se muestran por el hash: Leaflet recalcula su tamaño al entrar.
    function actualizarVista() {
        requestAnimationFrame(() => {
            if (location.hash === "#pantalla-mapa") mapa.invalidateSize();
            if (location.hash === "#crear-plan") {
                creador.invalidateSize();
                if (punto) creador.setView(punto, 15);
            }
        });
    }
    window.addEventListener("hashchange", actualizarVista);
    if (window.ResizeObserver) {
        const observador = new ResizeObserver(actualizarVista);
        observador.observe(document.getElementById("contenedor-mapa"));
        observador.observe(document.getElementById("mapa-creacion"));
    }
    dibujar();
    actualizarVista();
})();
