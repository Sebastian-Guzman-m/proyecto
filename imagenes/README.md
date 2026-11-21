# Guía de imágenes

Esta carpeta contiene los avatares y el logotipo de Google que se usan en la interfaz. Los iconos de navegación y de planes están en `iconos/`; su lista completa está en [`iconos/README.md`](iconos/README.md).

| Archivo | Uso |
| --- | --- |
| `avatar.svg` | Avatar de muestra usado en el perfil y en los mensajes. |
| `avatar.avif` | Variante del avatar en formato AVIF; no aparece enlazada en `index.html`. |
| `google.svg` | Logotipo del botón de Google en las pantallas de acceso y registro. El botón no autentica. |
| `google.ico` | Icono de Google en formato ICO; no aparece enlazado en `index.html`. |
| `icono-perfil-avatar-predeterminado-imagen-usuario-redes-sociales-icono-avatar-gris-silueta-perfil-blanco-ilustracion-vectorial_561158-3383.avif` | Imagen AVIF de avatar genérico. No aparece enlazada en `index.html`. |

Los formatos SVG son dibujos vectoriales y se ven nítidos al cambiar de tamaño. AVIF es un formato de imagen comprimido. No cambies los nombres de archivos que sí se usan sin actualizar sus referencias en `index.html`, `css/styles.css` o JavaScript.
