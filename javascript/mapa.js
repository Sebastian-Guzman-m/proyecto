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
    const listaCercanos = document.getElementById("lista-planes-cercanos");
    const cuadriculaPlanes = document.getElementById("cuadricula-mis-planes");
    const contadorCercanos = document.getElementById("contador-planes-cercanos");
    const contadorMisPlanes = document.getElementById("contador-mis-planes");
    const detalleNombre = document.getElementById("detalle-nombre");
    const detalleCategoria = document.getElementById("detalle-categoria");
    const detalleCreador = document.getElementById("detalle-creador");
    const detalleFechaHora = document.getElementById("detalle-fecha-hora");
    const detalleLugar = document.getElementById("detalle-lugar");
    const detalleDescripcion = document.getElementById("detalle-descripcion");
    const detalleAsistentes = document.getElementById("detalle-asistentes");
    const detalleTotalPersonas = document.getElementById("detalle-total-personas");
    const eliminarPinDetalle = document.getElementById("eliminar-pin-detalle");
    const ejemplos = [
        {
            id: "demo-futbol", lat: 9.9351, lng: -84.1027, nombre: "Tarde de fútbol",
            fecha: "Sáb, 7 nov", hora: "4:30 p. m.", descripcion: "Partido amistoso en la cancha 2.",
            ubicacion: "La Sabana · cancha 2", categoria: "DEPORTE · LA SABANA", personas: 8
        },
        {
            id: "demo-lectura", lat: 9.9319, lng: -84.0705, nombre: "Club de lectura",
            fecha: "Mañana", hora: "6:00 p. m.", descripcion: "Encuentro para conversar sobre libros.",
            ubicacion: "Café Miel · Escalante", categoria: "CULTURA · ESCALANTE", personas: 5
        },
        {
            id: "demo-bici", lat: 9.9307, lng: -84.0662, nombre: "Paseo en bici",
            fecha: "Sáb, 7 nov", hora: "8:00 a. m.", descripcion: "Recorrido en bici por el barrio.",
            ubicacion: "Parque Francia · Escalante", categoria: "AIRE LIBRE · PARQUE FRANCIA", personas: 12
        }
    ];
    let punto = null;
    let seleccion = null;
    let pinSeleccionado = null;
    let pines = [];
    const coordenadasValidas = (p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lng)
        && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180;
    try {
        const guardado = localStorage.getItem(clave);
        if (guardado === null) {
            pines = ejemplos;
            localStorage.setItem(clave, JSON.stringify(pines));
        }
        const datos = guardado === null ? pines : JSON.parse(guardado);
        if (!Array.isArray(datos)) throw new Error("Formato inválido");
        pines = datos.filter((p) => coordenadasValidas(p) && typeof p.id === "string"
            && typeof p.nombre === "string");
    } catch {
        informar("No se pudieron recuperar tus pines guardados. Puedes crear nuevos pines.");
    }

    const mapa = L.map("contenedor-mapa").setView(centro, 13);
    const contenedor = document.getElementById("contenedor-mapa");
    const espacios = {
        "#pantalla-mapa": document.getElementById("espacio-mapa-principal"),
        "#crear-plan": document.getElementById("espacio-mapa-creacion"),
        "#detalle-plan": document.getElementById("espacio-mapa-detalle")
    };
    const teselas = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapa);
    teselas.on("tileerror", () => informar("No se pudo cargar una parte del mapa. Comprueba tu conexión."));
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

    function tipoDePin(pin) {
        const texto = `${pin.nombre || ""} ${pin.categoria || ""}`
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        if (/futbol|deporte/.test(texto)) return "futbol";
        if (/lectura|libro|cultura/.test(texto)) return "lectura";
        if (/bici|ciclismo|aire libre/.test(texto)) return "ciclismo";
        return "generico";
    }

    function categoriaDetalle(pin) {
        const tipo = tipoDePin(pin);
        if (tipo === "futbol") return "Plan deportivo";
        if (tipo === "lectura") return "Plan cultural";
        if (tipo === "ciclismo") return "Plan al aire libre";
        return "Plan de encuentro";
    }

    function lugarDelPin(pin) {
        const referencia = typeof pin.ubicacion === "string" ? pin.ubicacion.trim() : "";
        return referencia || `Punto en el mapa · ${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`;
    }

    function fechaDelPin(pin) {
        return [pin.fecha, pin.hora].filter((valor) => typeof valor === "string" && valor.trim()).join(" · ")
            || "Fecha por confirmar";
    }

    function personasDelPin(pin) {
        const cantidad = Number(pin.personas);
        return Number.isFinite(cantidad) && cantidad > 0 ? Math.floor(cantidad) : 1;
    }

    function textoPersonas(pin) {
        const cantidad = personasDelPin(pin);
        return `${cantidad} ${cantidad === 1 ? "persona" : "personas"}`;
    }

    function renderizarDetalle(pin) {
        detalleNombre.textContent = pin.nombre;
        detalleCategoria.textContent = categoriaDetalle(pin);
        detalleCreador.replaceChildren(
            document.createTextNode("Creado por "),
            Object.assign(document.createElement("strong"), { textContent: "Mateo Rojas" }),
            document.createTextNode(" · anfitrión")
        );
        detalleFechaHora.textContent = fechaDelPin(pin);
        detalleLugar.textContent = lugarDelPin(pin);
        detalleDescripcion.textContent = typeof pin.descripcion === "string" && pin.descripcion.trim()
            ? pin.descripcion.trim() : "Este plan todavía no tiene una descripción.";
        detalleTotalPersonas.textContent = textoPersonas(pin);
        detalleAsistentes.replaceChildren();
        const iniciales = ["M", "S", "A", "J"];
        for (const inicial of iniciales.slice(0, Math.min(4, personasDelPin(pin)))) {
            const avatar = document.createElement("span");
            avatar.className = "avatar-persona";
            avatar.textContent = inicial;
            detalleAsistentes.append(avatar);
        }
        const total = document.createElement("span");
        total.className = "personas-inscritas";
        total.textContent = textoPersonas(pin);
        detalleAsistentes.append(total);
    }

    function abrirDetalle(id) {
        const pin = pines.find((elemento) => elemento.id === id);
        if (!pin) return;
        pinSeleccionado = pin.id;
        renderizarDetalle(pin);
        if (location.hash !== "#detalle-plan") location.hash = "#detalle-plan";
        requestAnimationFrame(() => requestAnimationFrame(() => {
            mapa.invalidateSize({ pan: false });
            mapa.setView([pin.lat, pin.lng], Math.max(mapa.getZoom(), 15));
        }));
    }

    function eliminarPin(id) {
        if (!pines.some((pin) => pin.id === id)) return;
        pines = pines.filter((pin) => pin.id !== id);
        if (pinSeleccionado === id) pinSeleccionado = null;
        guardar();
        dibujar();
        if (location.hash === "#detalle-plan") location.hash = "#pantalla-mapa";
    }

    eliminarPinDetalle.addEventListener("click", () => {
        if (pinSeleccionado) eliminarPin(pinSeleccionado);
    });

    function crearIconoLista(pin, tarjetaGrande = false) {
        const tipo = tipoDePin(pin);
        const elemento = document.createElement("span");
        elemento.className = tarjetaGrande
            ? `ilustracion-tarjeta ilustracion-${tipo}`
            : `icono-plan ${tipo}`;
        const imagen = document.createElement("img");
        imagen.className = "icono";
        const colorIcono = tipo === "futbol" ? "amarillo" : tipo === "lectura" ? "rosa" : tipo === "ciclismo" ? "cian" : "";
        imagen.src = `imagenes/iconos/destello${colorIcono ? `-${colorIcono}` : ""}.svg`;
        imagen.alt = "";
        elemento.append(imagen);
        return elemento;
    }

    function renderizarListas() {
        contadorCercanos.textContent = String(pines.length);
        contadorMisPlanes.textContent = String(pines.length);
        listaCercanos.replaceChildren();
        cuadriculaPlanes.replaceChildren();

        if (pines.length === 0) {
            const mensajeCercano = document.createElement("p");
            mensajeCercano.className = "estado-lista-planes";
            mensajeCercano.textContent = "Aún no hay planes. Crea un pin en el mapa y aparecerá aquí.";
            listaCercanos.append(mensajeCercano);
            const mensajePropio = mensajeCercano.cloneNode(true);
            cuadriculaPlanes.append(mensajePropio);
            return;
        }

        for (const pin of pines) {
            const tipo = tipoDePin(pin);
            const cercanos = document.createElement("a");
            cercanos.className = "tarjeta-plan";
            cercanos.href = "#detalle-plan";
            cercanos.dataset.pinId = pin.id;
            cercanos.append(crearIconoLista(pin));

            const nombreCercano = document.createElement("span");
            nombreCercano.className = "titulo-tarjeta-plan";
            nombreCercano.textContent = pin.nombre;
            cercanos.append(nombreCercano);

            const ubicacionCercana = document.createElement("span");
            ubicacionCercana.className = "ubicacion-plan";
            ubicacionCercana.textContent = lugarDelPin(pin);
            cercanos.append(ubicacionCercana);

            const datosCercanos = document.createElement("span");
            datosCercanos.className = "datos-plan";
            datosCercanos.append(document.createTextNode(fechaDelPin(pin)));
            const personasCercanas = document.createElement("span");
            personasCercanas.textContent = textoPersonas(pin);
            datosCercanos.append(personasCercanas);
            cercanos.append(datosCercanos);
            listaCercanos.append(cercanos);

            const tarjeta = document.createElement("a");
            tarjeta.className = "tarjeta-mi-plan";
            tarjeta.href = "#detalle-plan";
            tarjeta.dataset.pinId = pin.id;
            tarjeta.append(crearIconoLista(pin, true));

            const subtitulo = document.createElement("span");
            subtitulo.className = "subtitulo-seccion";
            const categoria = pin.categoria || (tipo === "futbol" ? "DEPORTE" : tipo === "lectura" ? "CULTURA" : tipo === "ciclismo" ? "AIRE LIBRE" : "PLAN");
            subtitulo.textContent = pin.categoria || `${categoria} · ${lugarDelPin(pin).toLocaleUpperCase()}`;
            tarjeta.append(subtitulo);

            const nombre = document.createElement("h2");
            nombre.textContent = pin.nombre;
            tarjeta.append(nombre);

            const ubicacionTarjeta = document.createElement("p");
            ubicacionTarjeta.textContent = lugarDelPin(pin);
            tarjeta.append(ubicacionTarjeta);

            const datosTarjeta = document.createElement("div");
            datosTarjeta.className = "datos-mi-plan";
            const fechaTarjeta = document.createElement("span");
            const iconoReloj = document.createElement("img");
            iconoReloj.className = "icono";
            iconoReloj.src = "imagenes/iconos/reloj.svg";
            iconoReloj.alt = "";
            fechaTarjeta.append(iconoReloj, document.createTextNode(` ${fechaDelPin(pin)}`));
            const personasTarjeta = document.createElement("span");
            personasTarjeta.textContent = textoPersonas(pin);
            datosTarjeta.append(fechaTarjeta, personasTarjeta);
            tarjeta.append(datosTarjeta);

            const pie = document.createElement("span");
            pie.className = "pie-tarjeta-plan";
            pie.append(document.createTextNode("Ver en el mapa"));
            const flecha = document.createElement("span");
            const iconoFlecha = document.createElement("img");
            iconoFlecha.className = "icono";
            iconoFlecha.src = "imagenes/iconos/flecha-derecha.svg";
            iconoFlecha.alt = "";
            flecha.append(iconoFlecha);
            pie.append(flecha);
            tarjeta.append(pie);
            cuadriculaPlanes.append(tarjeta);
        }
    }

    function enlazarLista(contenedor) {
        contenedor.addEventListener("click", (evento) => {
            const tarjeta = evento.target.closest("[data-pin-id]");
            if (!tarjeta) return;
            evento.preventDefault();
            abrirDetalle(tarjeta.dataset.pinId);
        });
    }

    enlazarLista(listaCercanos);
    enlazarLista(cuadriculaPlanes);

    function dibujar() {
        marcadores.clearLayers();
        for (const pin of pines) {
            const marcador = L.marker([pin.lat, pin.lng], {
                icon: iconoPin, draggable: false, bubblingMouseEvents: false, title: pin.nombre
            }).addTo(marcadores);
            marcador.on("click", () => abrirDetalle(pin.id));
        }
        renderizarListas();
    }

    function elegir(posicion) {
        punto = posicion.wrap();
        if (seleccion) seleccion.setLatLng(punto);
        else {
            seleccion = L.marker(punto, { icon: iconoSeleccion, draggable: true, title: "Punto de encuentro" }).addTo(mapa);
            seleccion.on("dragend", () => elegir(seleccion.getLatLng()));
        }
        ubicacion.textContent = `Punto seleccionado: ${punto.lat.toFixed(5)}, ${punto.lng.toFixed(5)}`;
    }
    mapa.on("click", (evento) => {
        if (location.hash === "#detalle-plan") return;
        elegir(evento.latlng);
        if (location.hash !== "#crear-plan") location.hash = "crear-plan";
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
            descripcion: document.getElementById("descripcion-plan").value.trim(),
            ubicacion: document.getElementById("referencia-plan").value.trim(),
            personas: 1
        });
        const destino = punto;
        guardar();
        dibujar();
        formulario.reset();
        mapa.removeLayer(seleccion);
        seleccion = null;
        punto = null;
        ubicacion.textContent = "Haz clic en el mapa para elegir un punto";
        location.hash = "pantalla-mapa";
        requestAnimationFrame(() => { mapa.invalidateSize(); mapa.setView(destino, 15); });
    });

    // Se mueve el mismo contenedor entre pantallas sin crear otro mapa.
    // Leaflet conserva las teselas, el acercamiento y la posición de la cámara.
    function actualizarVista() {
        if (location.hash === "#detalle-plan" && !pines.length) {
            location.hash = "#pantalla-mapa";
            return;
        }
        if (location.hash === "#detalle-plan" && !pinSeleccionado && pines.length) {
            pinSeleccionado = pines[0].id;
            renderizarDetalle(pines[0]);
        }
        const espacio = espacios[location.hash];
        if (!espacio) return;
        if (contenedor.parentElement !== espacio) espacio.appendChild(contenedor);
        if (seleccion) {
            if (location.hash === "#crear-plan") seleccion.addTo(mapa);
            else mapa.removeLayer(seleccion);
        }
        contenedor.setAttribute("aria-label", location.hash === "#crear-plan"
            ? "Seleccionar punto de encuentro" : "Mapa de planes");
        requestAnimationFrame(() => mapa.invalidateSize({ pan: false }));
    }
    window.addEventListener("hashchange", () => {
        if (location.hash !== "#detalle-plan") pinSeleccionado = null;
        actualizarVista();
    });
    window.addEventListener("storage", (evento) => {
        if (evento.key !== clave && evento.key !== null) return;
        try {
            const datos = evento.newValue ? JSON.parse(evento.newValue) : [];
            if (!Array.isArray(datos)) throw new Error("Formato inválido");
            pines = datos.filter((pin) => coordenadasValidas(pin) && typeof pin.id === "string"
                && typeof pin.nombre === "string");
            dibujar();
            const detalleActualizado = pines.find((pin) => pin.id === pinSeleccionado);
            if (detalleActualizado) renderizarDetalle(detalleActualizado);
            else if (pinSeleccionado) {
                pinSeleccionado = null;
                if (location.hash === "#detalle-plan") location.hash = "#pantalla-mapa";
            }
        } catch {
            informar("No se pudieron sincronizar los pines guardados.");
        }
    });
    if (window.ResizeObserver) {
        const observador = new ResizeObserver(() => {
            if (espacios[location.hash]) mapa.invalidateSize({ pan: false });
        });
        observador.observe(contenedor);
    }
    dibujar();
    if (location.hash === "#detalle-plan" && pines.length) abrirDetalle(pines[0].id);
    actualizarVista();
})();
