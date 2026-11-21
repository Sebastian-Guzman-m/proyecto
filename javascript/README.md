# Guía de JavaScript

La aplicación carga `mapa.js` y después `chat.js` desde `index.html`. Ambos archivos usan una función cerrada para mantener sus variables separadas. `script.js` es una prueba vieja y no se carga.

El archivo `javascript/.gitkeep` está vacío. Solo sirve para que Git conserve la carpeta si se quitan los scripts.

## `mapa.js`

Este archivo controla Leaflet y todos los pines.

1. Busca los espacios de mapa, formularios, listas y campos del detalle en `index.html`.
2. Lee `nexo.pines.v1` desde `localStorage`. Si aún no existe, carga los tres artículos de ejemplo del HTML.
3. Comprueba que cada pin tenga coordenadas dentro del mapa y los campos mínimos.
4. Crea una sola instancia de Leaflet con el centro inicial en San José. Mueve su contenedor a la pantalla activa en vez de crear mapas nuevos.
5. Dibuja los marcadores y las tarjetas de **Planes cerca** y **Publicaciones** según la categoría seleccionada.
6. Al hacer clic en el mapa, guarda un punto temporal y abre la pantalla de creación. El marcador temporal se puede arrastrar.
7. Al publicar, agrega un ID, guarda el pin, actualiza las vistas, avisa al chat y vuelve a centrar el mapa.
8. Al abrir un pin, rellena la ficha y centra el mapa. Al eliminarlo, lo quita y avisa al chat.
9. Escucha los cambios de pantalla y de almacenamiento local para mantener el tamaño del mapa y sus datos actualizados.

Funciones principales:

| Función | Para qué sirve |
| --- | --- |
| `guardar` | Guarda la lista de pines e informa si el navegador bloquea el guardado. |
| `categoriaDelPin` | Lee la categoría seleccionada o la deduce para un pin antiguo. |
| `cambiarFiltro` | Sincroniza los selectores y actualiza las listas y los marcadores. |
| `lugarDelPin`, `fechaDelPin`, `personasDelPin` | Prepara datos con valores alternativos cuando faltan campos. |
| `renderizarDetalle` | Actualiza la ficha del pin. |
| `abrirDetalle` | Selecciona el pin, abre su ficha y centra el mapa. |
| `eliminarPin` | Borra un pin y sincroniza el mapa, las listas y el chat. |
| `renderizarListas` | Crea las dos listas usando los mismos pines. |
| `dibujar` | Vuelve a crear los marcadores y las tarjetas. |
| `elegir` | Crea o mueve el marcador temporal de selección. |
| `actualizarVista` | Mueve el único mapa al espacio que corresponde a la pantalla. |

Al publicar o borrar un pin, se envía el evento `nexo:pines-actualizados`. `chat.js` lo escucha para crear o quitar la conversación asociada.

## `chat.js`

Este archivo crea una conversación por pin.

- Lee la lista de pines y los historiales guardados.
- Limpia los datos para usar solo mensajes con texto y hora válidos.
- Recuerda el último chat abierto en `nexo.chat.pin-seleccionado`.
- Crea filas de conversación, burbujas de mensaje y detalles del pin.
- Al enviar, agrega el mensaje como Mateo Rojas, guarda la hora local y lo escribe en `localStorage`.
- Al cambiar los pines, conserva los chats existentes y crea los que faltan.
- Escucha cambios locales y cambios hechos en otra pestaña del mismo origen.
- Limita el texto de cada mensaje a 2.000 caracteres y avisa de mensajes nuevos a lectores de pantalla.

Las funciones de `renderizar...` actualizan la pantalla. `sincronizarPines` conecta la lista de planes con la lista de conversaciones. `actualizarMensajesExternos` vuelve a leer mensajes guardados desde otra pestaña.

## `script.js`

Es un ejemplo antiguo de Leaflet. Requiere un elemento con `id="mapa"`, pregunta un nombre con `prompt` y dibuja marcadores que se pueden mover. No guarda datos y no se incluye desde `index.html`. No lo cargues a la vez que `mapa.js`.

## Datos compartidos entre scripts

Los pines se guardan como una lista JSON en `nexo.pines.v1`. Cada pin tiene `id`, `lat`, `lng`, `nombre`, `fecha`, `hora`, `descripcion`, `ubicacion` y `personas`. Los chats se guardan en `nexo-chat-mensajes-v1`, agrupados por el mismo `id`.

Los datos viven en el navegador y origen actuales. El evento `storage` se recibe en otras pestañas; para la pestaña actual se usa el evento propio `nexo:pines-actualizados`.
