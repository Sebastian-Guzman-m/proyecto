# proyecto


## Mapa interactivo

Abre index.html con conexión a Internet y entra a la pantalla Mapa (también puedes usar index.html#pantalla-mapa). Leaflet 1.9.4 muestra las teselas de OpenStreetMap. Para un sitio público con tráfico, revisa https://operations.osmfoundation.org/policies/tiles/.

Haz clic en el mapa o pulsa Crear pin, selecciona un punto, completa el formulario y pulsa Publicar pin. Puedes arrastrar el pin para moverlo y abrirlo para eliminarlo. Los pines se guardan en localStorage de este navegador y origen; no se comparten entre dispositivos ni usuarios. No requiere claves API.

El mapa usa una única instancia de Leaflet y un único contenedor. Al cambiar entre Mapa, Crear pin y Detalle, el contenedor se mueve al espacio de la pantalla activa y Leaflet recalcula su tamaño. La posición y el acercamiento se conservan al navegar; al publicar un pin se centra en su ubicación.
