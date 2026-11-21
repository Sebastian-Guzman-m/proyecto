// Controla el mapa, los pines, las dos listas de planes y la ficha de detalle.
// Todo se ejecuta dentro de esta función para no llenar el espacio global del navegador.
(() => {
    "use strict";
    const estado = document.getElementById("estado-mapa");
    const informar = (texto) => { estado.textContent = texto; };

    // Nombres de los elementos HTML y clave donde se guarda la lista de pines.
    const clave = "nexo.pines.v1";
    const centro = [9.9281, -84.0907];
    const formulario = document.querySelector(".formulario-plan");
    const ubicacion = document.getElementById("ubicacion-pin");
    const listaCercanos = document.getElementById("lista-planes-cercanos");
    const cuadriculaPlanes = document.getElementById("cuadricula-mis-planes");
    const contadorCercanos = document.getElementById("contador-planes-cercanos");
    const contadorMisPlanes = document.getElementById("contador-mis-planes");
    const filtros = [document.getElementById("filtro-mapa"), document.getElementById("filtro-publicaciones")];
    const campoCategoria = document.getElementById("categoria-plan");
    const errorPlan = document.getElementById("error-plan");
    const detalleNombre = document.getElementById("detalle-nombre");
    const detalleCategoria = document.getElementById("detalle-categoria");
    const detalleCreador = document.getElementById("detalle-creador");
    const detalleFechaHora = document.getElementById("detalle-fecha-hora");
    const detalleLugar = document.getElementById("detalle-lugar");
    const detalleDescripcion = document.getElementById("detalle-descripcion");
    const detalleAsistentes = document.getElementById("detalle-asistentes");
    const detalleTotalPersonas = document.getElementById("detalle-total-personas");
    const eliminarPinDetalle = document.getElementById("eliminar-pin-detalle");
    const botonChatDetalle = document.querySelector(".boton-chat-detalle");
    // El formulario y los filtros comparten las mismas categorías.
    const categorias = new Map();
    for (const opcion of Array.from(campoCategoria.options).slice(1)) {
        categorias.set(opcion.value, opcion.textContent);
        for (const filtro of filtros) filtro.append(opcion.cloneNode(true));
    }
    const iconosCategoria = { deporte: "futbol", cultura: "lectura", "aire-libre": "ciclismo", otros: "generico" };

    // Las publicaciones de ejemplo viven en el HTML y sirven como datos iniciales.
    const ejemplos = Array.from(cuadriculaPlanes.querySelectorAll("article[data-pin-id]"), (articulo) => {
        const { pinId, lat, lng, categoria, fecha, hora, personas } = articulo.dataset;
        return {
            id: pinId, lat: Number(lat), lng: Number(lng), categoria, fecha, hora,
            personas: Number(personas),
            nombre: articulo.querySelector("h2").textContent,
            autor: articulo.querySelector(".autor-plan").textContent,
            descripcion: articulo.querySelector(".descripcion-publicacion").textContent,
            ubicacion: articulo.querySelector(".lugar-plan").textContent
        };
    });
    // Estado temporal de creación y estado guardado de la pantalla.
    let punto = null;
    let seleccion = null;
    let pinSeleccionado = null;
    let pines = [];
    let categoriaActiva = "";
    // Comprueba el rango de latitud y longitud antes de mostrar un pin guardado.
    const coordenadasValidas = (p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lng)
        && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180;
    try {
        const guardado = localStorage.getItem(clave);
        const datos = guardado === null ? ejemplos : JSON.parse(guardado);
        if (!Array.isArray(datos)) throw new Error("Formato inválido");
        pines = datos.filter((p) => coordenadasValidas(p) && typeof p.id === "string"
            && typeof p.nombre === "string");
        if (guardado === null) {
            localStorage.setItem(clave, JSON.stringify(pines));
        }
    } catch {
        pines = ejemplos;
        informar("No se pudieron recuperar tus pines guardados. Puedes crear nuevos pines.");
    }

    // Las publicaciones siguen disponibles si no se puede descargar Leaflet.
    const leaflet = window.L;
    let mapa = null;
    let marcadores;
    let iconoPin;
    let iconoSeleccion;
    const contenedor = document.getElementById("contenedor-mapa");
    const espacios = {
        "#pantalla-mapa": document.getElementById("espacio-mapa-principal"),
        "#crear-plan": document.getElementById("espacio-mapa-creacion"),
        "#detalle-plan": document.getElementById("espacio-mapa-detalle")
    };
    if (leaflet) {
        const limitesMundo = leaflet.latLngBounds([-85.05112878, -180], [85.05112878, 180]);
        mapa = leaflet.map(contenedor, {
            maxBounds: limitesMundo,
            maxBoundsViscosity: 1
        }).setView(centro, 13);
        const teselas = leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            noWrap: true,
            bounds: limitesMundo,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapa);
        teselas.on("tileerror", () => informar("No se pudo cargar una parte del mapa. Comprueba tu conexión."));
        const crearIcono = (nombre) => leaflet.icon({
            iconUrl: `imagenes/iconos/${nombre}.svg`,
            iconSize: [32, 44],
            iconAnchor: [16, 43],
            popupAnchor: [0, -38]
        });
        iconoPin = crearIcono("pin-mapa");
        iconoSeleccion = crearIcono("pin-seleccion");
        marcadores = leaflet.layerGroup().addTo(mapa);
    } else {
        const mensaje = "No se pudo cargar el mapa. Comprueba tu conexión y recarga la página.";
        informar(mensaje);
        ubicacion.textContent = mensaje;
        formulario.querySelector('button[type="submit"]').disabled = true;
    }

    // Evita alejarse tanto que el mapa muestre espacio vacío fuera del mundo.
    function ajustarZoomMinimo() {
        const tamano = mapa.getSize();
        const ladoMayor = Math.max(tamano.x, tamano.y);
        if (!ladoMayor) return;
        const zoomMinimo = Math.max(0, Math.ceil(Math.log2(ladoMayor / 256)));
        mapa.setMinZoom(zoomMinimo);
    }

    // Guarda los pines y avisa en la interfaz si el navegador no permite hacerlo.
    function guardar() {
        try {
            localStorage.setItem(clave, JSON.stringify(pines));
            if (mapa) informar("Pines guardados en este navegador. Haz clic en el mapa para crear otro.");
        } catch {
            informar("El navegador no permitió guardar. Los cambios se perderán al recargar.");
        }
    }

    // Los pines guardados antes de tener un selector conservan una categoría útil.
    function categoriaDelPin(pin) {
        if (categorias.has(pin.categoria)) return pin.categoria;
        const categoriaGuardada = typeof pin.categoria === "string" ? pin.categoria.trim() : "";
        const texto = (categoriaGuardada || pin.nombre).normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "").toLowerCase();
        if (/futbol|deporte/.test(texto)) return "deporte";
        if (/lectura|libro|cultura/.test(texto)) return "cultura";
        if (/bici|ciclismo|aire libre/.test(texto)) return "aire-libre";
        return "otros";
    }

    function autorDelPin(pin) {
        return typeof pin.autor === "string" && pin.autor.trim() ? pin.autor : "Mateo Rojas";
    }

    function pinesVisibles() {
        return categoriaActiva ? pines.filter((pin) => categoriaDelPin(pin) === categoriaActiva) : pines;
    }

    function cambiarFiltro(categoria) {
        categoriaActiva = categoria;
        for (const filtro of filtros) filtro.value = categoria;
        dibujar();
    }

    // Funciones pequeñas para mostrar datos aunque falte algún campo opcional.
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

    // Copia los datos del pin seleccionado a la ficha y crea avatares de muestra.
    function renderizarDetalle(pin) {
        botonChatDetalle.dataset.pinId = pin.id;
        detalleNombre.textContent = pin.nombre;
        detalleCategoria.textContent = categorias.get(categoriaDelPin(pin));
        detalleCreador.replaceChildren(
            document.createTextNode("Creado por "),
            Object.assign(document.createElement("strong"), { textContent: autorDelPin(pin) }),
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

    // Abre la ficha, recuerda qué pin está activo y centra el mapa en ese punto.
    function abrirDetalle(id) {
        const pin = pines.find((elemento) => elemento.id === id);
        if (!pin) return;
        pinSeleccionado = pin.id;
        renderizarDetalle(pin);
        if (location.hash !== "#detalle-plan") location.hash = "#detalle-plan";
        if (mapa) requestAnimationFrame(() => requestAnimationFrame(() => {
            mapa.invalidateSize({ pan: false });
            mapa.setView([pin.lat, pin.lng], Math.max(mapa.getZoom(), 15));
        }));
    }

    window.nexoAbrirDetallePin = abrirDetalle;

    // Quita el pin del almacenamiento, actualiza las vistas y avisa al chat.
    function eliminarPin(id) {
        if (!pines.some((pin) => pin.id === id)) return;
        pines = pines.filter((pin) => pin.id !== id);
        if (pinSeleccionado === id) pinSeleccionado = null;
        guardar();
        dibujar();
        window.dispatchEvent(new CustomEvent("nexo:pines-actualizados", { detail: { pines } }));
        if (location.hash === "#detalle-plan") location.hash = "#pantalla-mapa";
    }

    eliminarPinDetalle.addEventListener("click", () => {
        if (pinSeleccionado) eliminarPin(pinSeleccionado);
    });

    // Crea el icono de categoría que se usa en las tarjetas de las dos listas.
    function crearIconoLista(pin, tarjetaGrande = false) {
        const tipo = iconosCategoria[categoriaDelPin(pin)];
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

    // Vuelve a crear Planes cerca y Mis planes desde la misma lista de pines.
    function renderizarListas(visibles) {
        contadorCercanos.textContent = String(visibles.length);
        contadorMisPlanes.textContent = visibles.length === 1 ? "1 publicación" : `${visibles.length} publicaciones`;
        listaCercanos.replaceChildren();
        cuadriculaPlanes.replaceChildren();

        if (visibles.length === 0) {
            const mensajeCercano = document.createElement("p");
            mensajeCercano.className = "estado-lista-planes";
            mensajeCercano.textContent = categoriaActiva ? "No hay planes en esta categoría."
                : "Aún no hay planes. Crea un pin en el mapa y aparecerá aquí.";
            listaCercanos.append(mensajeCercano);
            const mensajePropio = mensajeCercano.cloneNode(true);
            cuadriculaPlanes.append(mensajePropio);
            return;
        }

        for (const pin of visibles) {
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
            subtitulo.textContent = categorias.get(categoriaDelPin(pin));
            tarjeta.append(subtitulo);

            const nombre = document.createElement("h2");
            nombre.textContent = pin.nombre;
            tarjeta.append(nombre);

            const autor = document.createElement("p");
            autor.className = "autor-plan";
            autor.textContent = autorDelPin(pin);
            const descripcion = document.createElement("p");
            descripcion.className = "descripcion-publicacion";
            descripcion.textContent = pin.descripcion || "Este plan todavía no tiene una descripción.";
            const ubicacionTarjeta = document.createElement("p");
            ubicacionTarjeta.textContent = lugarDelPin(pin);
            tarjeta.append(autor, descripcion, ubicacionTarjeta);

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
            const publicacion = document.createElement("article");
            publicacion.append(tarjeta);
            cuadriculaPlanes.append(publicacion);
        }
    }

    // Un clic en cualquier tarjeta abre el detalle del pin asociado.
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
    for (const filtro of filtros) {
        filtro.addEventListener("change", () => cambiarFiltro(filtro.value));
    }

    // Dibuja los marcadores fijos y reconstruye las tarjetas de planes.
    function dibujar() {
        const visibles = pinesVisibles();
        if (mapa) {
            marcadores.clearLayers();
            for (const pin of visibles) {
                const marcador = leaflet.marker([pin.lat, pin.lng], {
                    icon: iconoPin, draggable: false, bubblingMouseEvents: false, title: pin.nombre
                }).addTo(marcadores);
                marcador.on("click", () => abrirDetalle(pin.id));
            }
        }
        renderizarListas(visibles);
    }

    // Guarda el punto elegido y crea o mueve el marcador temporal arrastrable.
    function elegir(posicion) {
        punto = posicion.wrap();
        if (seleccion) seleccion.setLatLng(punto);
        else {
            seleccion = leaflet.marker(punto, { icon: iconoSeleccion, draggable: true, title: "Punto de encuentro" }).addTo(mapa);
            seleccion.on("dragend", () => elegir(seleccion.getLatLng()));
        }
        ubicacion.textContent = `Punto seleccionado: ${punto.lat.toFixed(5)}, ${punto.lng.toFixed(5)}`;
    }
    mapa?.on("click", (evento) => {
        if (location.hash === "#detalle-plan") return;
        elegir(evento.latlng);
        if (location.hash !== "#crear-plan") location.hash = "crear-plan";
    });

    // Valida los campos, guarda el pin, limpia el formulario y vuelve al mapa.
    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();
        errorPlan.textContent = "";
        if (!punto) {
            errorPlan.textContent = "Primero elige el punto de encuentro en el mapa.";
            return;
        }
        const autor = document.getElementById("autor-plan").value.trim();
        const nombre = document.getElementById("nombre-plan").value.trim();
        const descripcion = document.getElementById("descripcion-plan").value.trim();
        const categoria = campoCategoria.value;
        if (!autor || !nombre || !descripcion || !categorias.has(categoria)) {
            errorPlan.textContent = "Completa el usuario, el nombre, la descripción y la categoría.";
            return;
        }
        pines.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            lat: punto.lat, lng: punto.lng, nombre, autor, categoria, descripcion,
            fecha: document.getElementById("fecha-plan").value.trim(),
            hora: document.getElementById("hora-plan").value.trim(),
            ubicacion: document.getElementById("referencia-plan").value.trim(),
            personas: 1
        });
        const destino = punto;
        guardar();
        cambiarFiltro("");
        window.dispatchEvent(new CustomEvent("nexo:pines-actualizados", { detail: { pines } }));
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
        if (!espacio || !mapa) return;
        if (contenedor.parentElement !== espacio) espacio.appendChild(contenedor);
        if (seleccion) {
            if (location.hash === "#crear-plan") seleccion.addTo(mapa);
            else mapa.removeLayer(seleccion);
        }
        contenedor.setAttribute("aria-label", location.hash === "#crear-plan"
            ? "Seleccionar punto de encuentro" : "Mapa de planes");
        requestAnimationFrame(() => {
            mapa.invalidateSize({ pan: false });
            ajustarZoomMinimo();
        });
    }
    // Reacciona al cambio de pantalla y sincroniza cambios hechos en otra pestaña.
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
            window.dispatchEvent(new CustomEvent("nexo:pines-actualizados", { detail: { pines } }));
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
    if (mapa && window.ResizeObserver) {
        const observador = new ResizeObserver(() => {
            if (espacios[location.hash]) {
                mapa.invalidateSize({ pan: false });
                ajustarZoomMinimo();
            }
        });
        observador.observe(contenedor);
    }
    dibujar();
    if (location.hash === "#detalle-plan" && pines.length) abrirDetalle(pines[0].id);
    actualizarVista();
})();
