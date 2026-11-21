// Ejemplo antiguo e independiente: index.html no carga este archivo.
// Necesita que la página tenga un elemento con id="mapa" y Leaflet ya cargado.
// Al hacer clic, pregunta el nombre del lugar y muestra un marcador que se puede mover.
// No guarda los marcadores ni comparte estado con la aplicación actual.
// Vista inicial: San José, Costa Rica.
const mapa = L.map("mapa").setView([9.9281, -84.0907], 13);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">' +
        "OpenStreetMap</a> contributors"
}).addTo(mapa);

// Cada clic crea un pin que puedes mover.
mapa.on("click", (evento) => {
    const nombre = prompt("¿Cómo se llama este lugar?");
    if (!nombre?.trim()) return;

    const etiqueta = document.createElement("span");
    etiqueta.textContent = nombre.trim();

    L.marker(evento.latlng, { draggable: true })
        .addTo(mapa)
        .bindPopup(etiqueta)
        .openPopup();
});
