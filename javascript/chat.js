(() => {
    const CLAVE_PINES = "nexo.pines.v1";
    const CLAVE_MENSAJES = "nexo-chat-mensajes-v1";
    const CLAVE_PIN_ACTIVO = "nexo.chat.pin-seleccionado";
    const contenedorConversaciones = document.querySelector(".lista-conversaciones");
    const formulario = document.querySelector(".formulario-mensaje");
    const campo = document.querySelector("#campo-mensaje");
    const listaMensajes = document.querySelector(".lista-mensajes");
    const conversacion = document.querySelector(".conversacion");
    const distribucion = document.querySelector(".distribucion-chat");

    if (!contenedorConversaciones || !formulario || !campo || !listaMensajes || !conversacion || !distribucion) return;

    const contadorConversaciones = document.querySelector(".lista-chats .contador-resultados");
    const encabezadoLista = document.querySelector(".lista-chats .encabezado-panel h1");
    const tituloConversacion = conversacion.querySelector(".encabezado-conversacion > div:nth-child(2) strong");
    const subtituloConversacion = conversacion.querySelector(".encabezado-conversacion > div:nth-child(2) small");
    const iconoConversacion = conversacion.querySelector(".encabezado-conversacion .icono-chat");
    const enlaceDetalles = conversacion.querySelector(".enlace-detalles-chat");
    const detallesChat = distribucion.querySelector(".detalles-chat");
    const iconoAvatar = listaMensajes.querySelector(".mensaje .avatar-persona")?.getAttribute("src") || "imagenes/avatar.svg";
    const separadorDemo = listaMensajes.querySelector(".separador-fecha")?.textContent.trim() || "MENSAJES DEL GRUPO";
    const notaSistemaDemo = listaMensajes.querySelector(".mensaje-sistema")?.textContent.trim() || "";
    const mensajesDemoFutbol = [...listaMensajes.querySelectorAll(".mensaje")].map((elemento) => ({
        author: elemento.querySelector(".autor-mensaje")?.textContent.trim() || "Mateo Rojas",
        text: elemento.querySelector("p")?.textContent.trim() || "",
        time: elemento.querySelector("time")?.textContent.trim() || "",
        sent: elemento.classList.contains("enviado")
    })).filter((mensaje) => mensaje.text);
    const idsDemoAntiguos = {
        "demo-futbol": "futbol",
        "demo-lectura": "lectura",
        "demo-bici": "ciclismo"
    };

    let pines = [];
    let chats = new Map();
    let pinActivo = null;

    function leerJSON(clave, alternativa) {
        try {
            const valor = localStorage.getItem(clave);
            return valor === null ? alternativa : JSON.parse(valor);
        } catch {
            return alternativa;
        }
    }

    function validarPines(datos) {
        if (!Array.isArray(datos)) return [];
        return datos.filter((pin) => pin && typeof pin.id === "string" && typeof pin.nombre === "string");
    }

    function leerPines() {
        return validarPines(leerJSON(CLAVE_PINES, []));
    }

    function limpiarMensajes(mensajes) {
        if (!Array.isArray(mensajes)) return null;
        return mensajes.filter((mensaje) => mensaje && typeof mensaje.text === "string" && typeof mensaje.time === "string")
            .map((mensaje) => ({
                author: typeof mensaje.author === "string" ? mensaje.author : "Participante",
                text: mensaje.text,
                time: mensaje.time,
                sent: Boolean(mensaje.sent)
            }));
    }

    function horaActual() {
        return new Date().toLocaleTimeString("es-CR", { hour: "numeric", minute: "2-digit" });
    }

    function datosDePin(pin) {
        const ubicacion = typeof pin.ubicacion === "string" && pin.ubicacion.trim()
            ? pin.ubicacion.trim()
            : Number.isFinite(pin.lat) && Number.isFinite(pin.lng)
                ? `Punto en el mapa · ${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`
                : "Ubicación por confirmar";
        const fecha = [pin.fecha, pin.hora].filter((valor) => typeof valor === "string" && valor.trim()).join(" · ")
            || "Fecha por confirmar";
        const personas = Number.isFinite(Number(pin.personas)) && Number(pin.personas) > 0 ? Math.floor(Number(pin.personas)) : 1;
        return { ubicacion, fecha, personas };
    }

    function guardarMensajes() {
        const datos = Object.fromEntries([...chats].map(([id, chat]) => [id, chat.mensajes]));
        try {
            localStorage.setItem(CLAVE_MENSAJES, JSON.stringify(datos));
        } catch {
            // El chat permanece disponible durante esta sesión si el navegador bloquea el almacenamiento.
        }
    }

    function leerPinActivo() {
        try {
            return localStorage.getItem(CLAVE_PIN_ACTIVO);
        } catch {
            return null;
        }
    }

    function guardarPinActivo() {
        try {
            if (pinActivo) localStorage.setItem(CLAVE_PIN_ACTIVO, pinActivo);
            else localStorage.removeItem(CLAVE_PIN_ACTIVO);
        } catch {
            // La selección sigue funcionando en la vista actual.
        }
    }

    function inicializarMensajes(pin, almacenados) {
        const directos = limpiarMensajes(almacenados?.[pin.id]);
        if (directos) return directos;

        const idAntiguo = idsDemoAntiguos[pin.id];
        const anteriores = idAntiguo ? limpiarMensajes(almacenados?.[idAntiguo]) : null;
        if (anteriores) return anteriores;
        if (pin.id === "demo-futbol") return mensajesDemoFutbol;
        return [];
    }

    function crearChat(pin, almacenados) {
        return {
            pin,
            mensajes: inicializarMensajes(pin, almacenados),
            separador: pin.id === "demo-futbol" ? separadorDemo : "CHAT DEL PIN",
            notaSistema: pin.id === "demo-futbol" ? notaSistemaDemo : ""
        };
    }

    function categoriaIcono(pin) {
        const texto = `${pin.nombre || ""} ${pin.categoria || ""}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        if (/futbol|deporte/.test(texto)) return { clase: "futbol", archivo: "destello-amarillo.svg" };
        if (/lectura|libro|cultura/.test(texto)) return { clase: "lectura", archivo: "destello-rosa.svg" };
        if (/bici|ciclismo|aire libre/.test(texto)) return { clase: "ciclismo", archivo: "destello-cian.svg" };
        return { clase: "generico", archivo: "destello.svg" };
    }

    function crearIcono(pin) {
        const tipo = categoriaIcono(pin);
        const icono = document.createElement("span");
        icono.className = `icono-chat ${tipo.clase}`;
        const imagen = document.createElement("img");
        imagen.className = "icono";
        imagen.src = `imagenes/iconos/${tipo.archivo}`;
        imagen.alt = "";
        icono.append(imagen);
        return icono;
    }

    function crearEnlaceConversacion(pin) {
        const chat = chats.get(pin.id);
        const ultimo = chat?.mensajes.at(-1);
        const enlace = document.createElement("a");
        enlace.className = `elemento-chat${pin.id === pinActivo ? " seleccionado" : ""}`;
        enlace.href = "#pantalla-chat";
        enlace.dataset.pinId = pin.id;
        enlace.setAttribute("aria-label", `Abrir chat del pin: ${pin.nombre}`);
        if (pin.id === pinActivo) enlace.setAttribute("aria-current", "page");
        enlace.append(crearIcono(pin));

        const resumen = document.createElement("span");
        const titulo = document.createElement("strong");
        titulo.textContent = pin.nombre;
        const vistaPrevia = document.createElement("small");
        vistaPrevia.textContent = ultimo?.text || "Aún no hay mensajes";
        resumen.append(titulo, vistaPrevia);
        enlace.append(resumen);

        const hora = document.createElement("time");
        hora.textContent = ultimo?.time || "";
        hora.hidden = !ultimo?.time;
        enlace.append(hora);
        return enlace;
    }

    function renderizarLista() {
        contenedorConversaciones.replaceChildren();
        if (contadorConversaciones) contadorConversaciones.textContent = String(pines.length);
        if (encabezadoLista) encabezadoLista.textContent = pines.length === 1 ? "Conversación" : "Conversaciones";
        document.querySelectorAll(".contador-navegacion").forEach((contador) => {
            contador.textContent = String(pines.length);
            contador.hidden = pines.length === 0;
        });

        if (!pines.length) {
            const vacio = document.createElement("p");
            vacio.className = "estado-chat-vacio";
            vacio.textContent = "Todavía no hay pines. Crea uno en el mapa para iniciar un chat.";
            contenedorConversaciones.append(vacio);
            return;
        }

        pines.forEach((pin) => contenedorConversaciones.append(crearEnlaceConversacion(pin)));
    }

    function crearMensaje(mensaje) {
        const articulo = document.createElement("article");
        articulo.className = `mensaje${mensaje.sent ? " enviado" : ""}`;

        if (!mensaje.sent) {
            const avatar = document.createElement("img");
            avatar.className = "avatar-persona";
            avatar.src = iconoAvatar;
            avatar.alt = "";
            articulo.append(avatar);
        }

        const contenido = document.createElement("div");
        if (!mensaje.sent) {
            const autor = document.createElement("small");
            autor.className = "autor-mensaje";
            autor.textContent = mensaje.author;
            contenido.append(autor);
        }

        const texto = document.createElement("p");
        texto.textContent = mensaje.text;
        const hora = document.createElement("time");
        hora.textContent = mensaje.time;
        contenido.append(texto, hora);
        articulo.append(contenido);
        return articulo;
    }

    function renderizarDetalles(pin) {
        detallesChat.replaceChildren();
        if (!pin) {
            const etiqueta = document.createElement("span");
            etiqueta.className = "subtitulo-seccion";
            etiqueta.textContent = "DETALLES DEL PIN";
            const mensaje = document.createElement("p");
            mensaje.className = "texto-secundario";
            mensaje.textContent = "Selecciona una conversación para ver su pin.";
            detallesChat.append(etiqueta, mensaje);
            return;
        }

        const datos = datosDePin(pin);
        const etiqueta = document.createElement("span");
        etiqueta.className = "subtitulo-seccion";
        etiqueta.textContent = "DETALLES DEL PIN";
        const titulo = document.createElement("h2");
        titulo.textContent = pin.nombre;
        const fecha = document.createElement("p");
        fecha.className = "texto-secundario";
        fecha.textContent = datos.fecha;
        const ubicacion = document.createElement("p");
        ubicacion.className = "texto-secundario";
        ubicacion.textContent = datos.ubicacion;
        const descripcion = document.createElement("p");
        descripcion.className = "texto-secundario";
        descripcion.textContent = typeof pin.descripcion === "string" && pin.descripcion.trim()
            ? pin.descripcion.trim() : "Este pin todavía no tiene descripción.";
        const nota = document.createElement("div");
        nota.className = "nota-chat";
        const textoNota = document.createElement("p");
        textoNota.textContent = "Este chat pertenece únicamente a este pin.";
        nota.append(textoNota);

        const mapa = document.createElement("a");
        mapa.className = "enlace-mapa";
        mapa.href = "#detalle-plan";
        mapa.dataset.abrirDetallePin = pin.id;
        const icono = document.createElement("img");
        icono.className = "icono";
        icono.src = "imagenes/iconos/marcador-mapa-cian.svg";
        icono.alt = "";
        mapa.append(icono, document.createTextNode(" Ver ubicación en el mapa"));

        detallesChat.append(etiqueta, titulo, fecha, ubicacion, descripcion, nota, mapa);
    }

    function renderizarConversacion() {
        const chat = chats.get(pinActivo);
        const pin = chat?.pin || null;
        tituloConversacion.textContent = pin?.nombre || "Sin chats";
        conversacion.setAttribute("aria-label", pin ? `Chat del pin ${pin.nombre}` : "Chat sin pines");
        enlaceDetalles.hidden = !pin;

        if (pin) {
            const datos = datosDePin(pin);
            const icono = categoriaIcono(pin);
            subtituloConversacion.textContent = `${datos.personas} ${datos.personas === 1 ? "persona" : "personas"} · ${datos.ubicacion} · ${datos.fecha}`;
            iconoConversacion.className = `icono-chat ${icono.clase}`;
            iconoConversacion.querySelector("img").src = `imagenes/iconos/${icono.archivo}`;
        } else {
            subtituloConversacion.textContent = "Crea un pin para abrir un chat";
        }

        listaMensajes.replaceChildren();
        if (pin) {
            const separador = document.createElement("div");
            separador.className = "separador-fecha";
            separador.textContent = chat.separador;
            listaMensajes.append(separador);

            if (chat.notaSistema) {
                const nota = document.createElement("p");
                nota.className = "mensaje-sistema";
                nota.textContent = chat.notaSistema;
                listaMensajes.append(nota);
            }

            if (chat.mensajes.length) chat.mensajes.forEach((mensaje) => listaMensajes.append(crearMensaje(mensaje)));
            else {
                const vacio = document.createElement("p");
                vacio.className = "mensaje-sistema";
                vacio.textContent = "Este pin todavía no tiene mensajes. Escribe el primero.";
                listaMensajes.append(vacio);
            }
        } else {
            const vacio = document.createElement("p");
            vacio.className = "mensaje-sistema";
            vacio.textContent = "Crea un pin en el mapa para iniciar su chat.";
            listaMensajes.append(vacio);
        }

        formulario.hidden = !pin;
        campo.disabled = !pin;
        listaMensajes.scrollTop = listaMensajes.scrollHeight;
        renderizarDetalles(pin);
    }

    function seleccionarPin(id, persistir = true) {
        pinActivo = chats.has(id) ? id : pines[0]?.id || null;
        if (persistir) guardarPinActivo();
        renderizarLista();
        renderizarConversacion();
    }

    function sincronizarPines(datos) {
        const nuevosPines = validarPines(datos);
        const almacenados = leerJSON(CLAVE_MENSAJES, {});
        const anteriores = chats;
        const nuevosChats = new Map();

        nuevosPines.forEach((pin) => {
            const existente = anteriores.get(pin.id);
            const chat = existente || crearChat(pin, almacenados);
            chat.pin = pin;
            nuevosChats.set(pin.id, chat);
        });

        pines = nuevosPines;
        chats = nuevosChats;
        const solicitado = leerPinActivo();
        pinActivo = chats.has(pinActivo) ? pinActivo : chats.has(solicitado) ? solicitado : pines[0]?.id || null;
        guardarPinActivo();
        guardarMensajes();
        renderizarLista();
        renderizarConversacion();
    }

    function actualizarMensajesExternos() {
        const resultado = leerJSON(CLAVE_MENSAJES, {});
        const almacenados = resultado && typeof resultado === "object" && !Array.isArray(resultado) ? resultado : {};
        chats.forEach((chat, id) => {
            const mensajes = limpiarMensajes(almacenados[id]);
            if (mensajes) chat.mensajes = mensajes;
        });
        renderizarLista();
        renderizarConversacion();
    }

    contenedorConversaciones.addEventListener("click", (evento) => {
        const enlace = evento.target.closest("a[data-pin-id]");
        if (!enlace) return;
        evento.preventDefault();
        seleccionarPin(enlace.dataset.pinId);
    });

    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();
        const texto = campo.value.trim();
        const chat = chats.get(pinActivo);
        if (!texto || !chat) return;
        chat.mensajes.push({ author: "Mateo Rojas", text: texto, time: horaActual(), sent: true });
        guardarMensajes();
        campo.value = "";
        renderizarLista();
        renderizarConversacion();
        campo.focus();
    });

    document.querySelector(".boton-chat-detalle")?.addEventListener("click", (evento) => {
        const id = evento.currentTarget.dataset.pinId;
        if (!chats.has(id)) return;
        evento.preventDefault();
        seleccionarPin(id);
        if (location.hash !== "#pantalla-chat") location.hash = "#pantalla-chat";
    });

    enlaceDetalles.addEventListener("click", (evento) => {
        if (!chats.has(pinActivo)) return;
        evento.preventDefault();
        if (typeof window.nexoAbrirDetallePin === "function") window.nexoAbrirDetallePin(pinActivo);
        else location.hash = "#detalle-plan";
    });

    detallesChat.addEventListener("click", (evento) => {
        const enlace = evento.target.closest("a[data-abrir-detalle-pin]");
        if (!enlace) return;
        evento.preventDefault();
        if (typeof window.nexoAbrirDetallePin === "function") window.nexoAbrirDetallePin(enlace.dataset.abrirDetallePin);
        else location.hash = "#detalle-plan";
    });

    window.addEventListener("nexo:pines-actualizados", (evento) => sincronizarPines(evento.detail?.pines || leerPines()));
    window.addEventListener("storage", (evento) => {
        if (evento.key === CLAVE_PINES) sincronizarPines(leerPines());
        if (evento.key === CLAVE_MENSAJES) actualizarMensajesExternos();
    });

    listaMensajes.setAttribute("role", "log");
    listaMensajes.setAttribute("aria-live", "polite");
    listaMensajes.setAttribute("aria-relevant", "additions");
    campo.maxLength = 2000;
    sincronizarPines(leerPines());
})();
