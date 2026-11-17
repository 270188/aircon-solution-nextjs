/**
 * Cada foto de servicios y trabajos tiene una copia liviana de 480 px de ancho (<foto>-480.webp)
 * para celulares; el navegador elige la que necesita según el tamaño de pantalla.
 */
export const photoSrcSet = (image: string) => `/${image}-480.webp 480w, /${image}.webp 900w`;
