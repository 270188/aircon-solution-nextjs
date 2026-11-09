# Qué se mejoró y por qué

## Problemas de la versión anterior (Next.js + Supabase)

| # | Problema | Impacto |
|---|---|---|
| 1 | La reserva solo abría WhatsApp; si fallaba el guardado no se avisaba al cliente | Reservas perdidas sin saberlo |
| 2 | No se controlaban horarios ocupados: dos clientes podían reservar la misma hora | Citas duplicadas |
| 3 | Se podía reservar en domingo o con meses de anticipación | Agenda irreal |
| 4 | `GET /api/booking` devolvía **todas las reservas con datos personales sin contraseña** | Fuga de datos personales (Ley 29733) |
| 5 | Validación mínima (solo campos requeridos) y sin protección contra spam ni abuso | Basura en la base de datos |
| 6 | No había panel para ver o gestionar reservas (había que entrar a Supabase) | Operación manual |
| 7 | El cliente no recibía comprobante ni podía consultar su cita | Más llamadas de seguimiento |
| 8 | Sin consentimiento de datos personales ni política de privacidad | Incumplimiento legal |
| 9 | Enlaces de Facebook/Instagram vacíos (`#`) y testimonios sin carrusel | Imagen poco profesional |
| 10 | Sin SEO local (datos estructurados, sitemap, robots), sin modo oscuro ni manifiesto | Menor visibilidad en Google |
| 11 | Galería solo con fotos de stock, sin las fotos reales del equipo | Menos confianza |
| 12 | Sin pruebas automatizadas | Riesgo al cambiar el código |

## Requerimientos funcionales (RF)

| Código | Requerimiento | Estado |
|---|---|---|
| RF-01 | Mostrar servicios con descripción, características y botón para reservar ese servicio | ✅ |
| RF-02 | Reservar una visita en 3 pasos: servicio → fecha y hora → datos | ✅ |
| RF-03 | Mostrar solo horarios disponibles (cupo configurable por horario, 2 técnicos por defecto) | ✅ |
| RF-04 | Bloquear domingos, fechas pasadas, horas ya pasadas del día y fechas a más de 60 días | ✅ |
| RF-05 | Entregar un código de reserva (ej. ACS-7KQ2MX), enviarlo por WhatsApp y agregarlo al calendario (.ics) | ✅ |
| RF-06 | Consultar el estado de la reserva con el código (`/seguimiento`) | ✅ |
| RF-07 | Formulario de contacto y suscripción al boletín | ✅ |
| RF-08 | Panel de administración con inicio de sesión: indicadores, reservas por estado, cambio de estado, notas internas, mensajes leídos/no leídos, suscriptores | ✅ |
| RF-09 | Exportar reservas a CSV (Excel) y contactar al cliente por WhatsApp con un clic | ✅ |
| RF-10 | Galería filtrable por categoría con visor a pantalla completa (teclado y deslizar) | ✅ |
| RF-11 | Plan B: si el servidor no responde, la reserva se puede enviar por WhatsApp | ✅ |
| RF-12 | Preguntas frecuentes, testimonios, mapa, política de privacidad y página 404 | ✅ |

## Requerimientos no funcionales (RNF)

| Código | Categoría | Cómo se cumple |
|---|---|---|
| RNF-01 | Seguridad | Panel protegido (HTTP Basic sobre HTTPS, contraseña cifrada con BCrypt); endpoints públicos no exponen datos personales; cabeceras CSP, HSTS, X-Frame-Options, nosniff |
| RNF-02 | Anti-spam | Límite de 10 envíos por minuto por IP y campo trampa (honeypot) en todos los formularios |
| RNF-03 | Integridad | Validación en el navegador **y** en el servidor (Bean Validation); bloqueo para que dos reservas simultáneas no tomen el último cupo |
| RNF-04 | Legal | Casilla de consentimiento obligatoria y política de privacidad según la Ley 29733 |
| RNF-05 | Rendimiento | ~126 KB comprimidos de carga inicial; páginas internas con carga diferida; imágenes WebP con respaldo JPG y `loading="lazy"`; caché inmutable para JS/CSS; compresión en el backend; hilos virtuales de Java 21 |
| RNF-06 | Accesibilidad | HTML semántico, enlace "saltar al contenido", foco visible, `aria-*` en menú, acordeón, carrusel y visor; navegación por teclado; respeta "reducir movimiento" del sistema |
| RNF-07 | Responsivo | Diseñado para móvil primero; probado a 390 px sin desbordes horizontales |
| RNF-08 | SEO | Metaetiquetas, Open Graph, datos estructurados `HVACBusiness`, `sitemap.xml`, `robots.txt`, títulos por página |
| RNF-09 | Mantenibilidad | Contenido centralizado en `site.data.ts`; backend por módulos; migraciones versionadas (Flyway); errores uniformes RFC 9457 en español; API documentada con Swagger |
| RNF-10 | Calidad | 8 pruebas de integración del backend y 6 pruebas unitarias del frontend, además de una prueba de punta a punta en navegador |
| RNF-11 | Disponibilidad | Health checks (`/actuator/health`), contenedor Docker sin privilegios de root, apagado ordenado |
| RNF-12 | Portabilidad | Base de datos PostgreSQL estándar (Supabase, Neon, Render…), configuración por variables de entorno |

## Animaciones incluidas

- Pantalla de carga con el copo girando y salida tipo telón
- Partículas de "aire frío" en la portada que esquivan el cursor
- Título que aparece palabra por palabra y texto que se escribe solo (Climatización → Mantenimiento → …)
- Imagen de portada con efecto Ken Burns, luces de aurora y tarjetas flotantes
- Barra de progreso de lectura, luz que sigue al cursor y botones "magnéticos" con brillo y onda al hacer clic
- Cabecera que se vuelve de vidrio al bajar, se oculta al hacer scroll hacia abajo y resalta la sección actual
- Menú móvil que se abre en círculo con enlaces escalonados
- Elementos que aparecen al hacer scroll (subir, deslizar, voltear, desenfoque, telón)
- Contadores animados, carrusel de marcas infinito y tarjetas de servicios con inclinación 3D y foco de luz
- Línea de tiempo que se dibuja con el scroll
- Galería con filtros animados y visor con transiciones
- Testimonios con estrellas que aparecen una a una y barra de avance
- Calendario con cambio de mes deslizante, horarios escalonados y confeti al confirmar la reserva
- Acordeón suave en preguntas frecuentes, olas animadas en el pie de página
- Cambio de tema claro/oscuro con revelado circular

## Pendiente (lo debe completar el negocio)

- **Cifras reales**: los 20 años de experiencia ya son reales; equipos atendidos y % de satisfacción en `stats` (`site.data.ts`) siguen siendo de ejemplo.
- **Testimonios reales** con permiso del cliente (los actuales vienen de la versión anterior).
- **Redes sociales**: Facebook y TikTok enlazan a una búsqueda por nombre; reemplazar por la URL exacta del perfil en `site.data.ts`.
- **Más fotos** de trabajos en `public/images/trabajos/`.
- **Razón social**: confirmar el nombre que va en las facturas (pregunta frecuente y datos estructurados).
- Opcional: aviso por correo al negocio en cada reserva nueva, recordatorio automático por WhatsApp (API de WhatsApp Business) y pre-renderizado (SSG) para un SEO aún mejor.
