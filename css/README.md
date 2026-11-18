# Guía de estilos

`styles.css` controla la apariencia de todas las pantallas de Nexo. No contiene la lógica para guardar pines o enviar mensajes; esa lógica está en `javascript/`.

## Cómo se organiza

Las reglas están en este orden general:

1. **Base y acceso:** fuente, fondo, formulario de inicio y registro.
2. **Cambio de pantalla:** `.pantalla` oculta las vistas y `:target` enseña la vista cuyo ID coincide con el fragmento de la dirección. Sin fragmento, aparece el inicio de sesión.
3. **Partes comunes:** cabecera, botones, navegación lateral y tarjetas.
4. **Vistas de la aplicación:** mapa, creación de pin, detalle, chat y Mis planes.
5. **Diseño adaptable:** reglas para escritorio, tablet y móvil.
6. **Paleta final:** variables y ajustes que sobrescriben algunas reglas anteriores.
7. **Cuenta y perfil:** pantallas de ajustes y perfil de ejemplo.
8. **Ajustes finales:** tamaño de iconos y del mapa Leaflet.

Los comentarios dentro del archivo marcan estos grupos. Algunas reglas repetidas aparecen más abajo a propósito: la regla posterior reemplaza el valor anterior en el navegador. Al cambiar un estilo, revisa también los ajustes finales para que no lo vuelvan a sobrescribir.

## Colores

La paleta principal está en el segundo bloque `:root`, cerca de la mitad final del archivo:

| Variable | Uso |
| --- | --- |
| `--noche` | Fondo oscuro de la aplicación. |
| `--carbon` y `--panel` | Fondos de pantallas y áreas de contenido. |
| `--panel-elevado` | Tarjetas y controles sobre un panel. |
| `--borde` y `--borde-suave` | Separadores y contornos. |
| `--texto` y `--texto-tenue` | Texto principal y texto secundario. |
| `--azul-acento`, `--azul-enlace` y `--azul-accion` | Acentos, enlaces y botones principales. |

## Pantallas pequeñas

- Hasta **1050 px**, la navegación lateral se estrecha y algunos paneles se ocultan.
- Hasta **760 px**, las columnas se apilan y la navegación pasa abajo o se desplaza de lado.
- Hasta **420 px**, se ajustan espacios y controles para teléfonos angostos.
- `prefers-reduced-motion` reduce o quita animaciones si la persona lo pide en su sistema.

La pantalla de perfil también tiene ajustes de móvil hasta 480 px. El mapa tiene un tamaño mínimo para seguir siendo útil con los paneles apilados.

## Clases que conviene conocer

| Clase | Uso |
| --- | --- |
| `.pantalla` | Sección que se muestra según su ID y el fragmento `#...`. |
| `.distribucion-aplicacion` | Columnas de navegación, lista y mapa. |
| `.area-mapa` y `.mapa-interactivo` | Espacio visual para Leaflet. |
| `.distribucion-chat` | Columnas de lista de chats, conversación y detalles. |
| `.pantalla-ajustes` | Marco de ajustes y perfil. |
| `.oculto-visualmente` | Texto disponible para lectores de pantalla, sin mostrarlo en pantalla. |

Para cambiar textos, rutas o contenido usa `index.html`. Para cambiar lo que pasa al hacer clic usa los archivos JavaScript.
