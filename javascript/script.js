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