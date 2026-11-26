/**
 * Contenido editable del sitio. Cambia aquí teléfonos, servicios, fotos,
 * testimonios o preguntas frecuentes sin tocar los componentes.
 */

/** Dominio principal (sin barra final). Se usa en las URL canónicas, el sitemap y los datos para Google. */
export const SITE_URL = 'https://airconsolutionsac.com';

export const business = {
  name: 'AIRCONSOLUTION SERVICES SAC',
  ruc: '20616633733',
  legalName: 'AIRCONSOLUTION SERVICES SAC',
  phone: '+51985899731',
  phoneDisplay: '+51 985 899 731',
  phone2: '+51990073634',
  phone2Display: '+51 990 073 634',
  email: 'aircon82@gmail.com',
  address: 'Calle 20 Mz. 28 Lt. 17 A.H. Laura Caller, Los Olivos, Lima',
  hours: 'Lun – Sáb: 8:00 a.m. – 6:00 p.m. · Emergencias 24/7',
  // Para Google: dirección separada y horario en formato estándar.
  street: 'Calle 20 Mz. 28 Lt. 17 A.H. Laura Caller',
  district: 'Los Olivos',
  region: 'Lima',
  openingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  opens: '08:00',
  closes: '18:00',
  mapEmbedSrc: 'https://maps.google.com/maps?q=AirconSolutionSAC,Los+Olivos,Lima&z=16&output=embed',
  mapLink: 'https://www.google.com/maps/place/?q=place_id:ChIJaWvmcgDPBZERs2kE8Nof2Sw',
  facebook: 'https://www.facebook.com/share/1GKozztUeq/',
  instagram: 'https://www.instagram.com/airconsolutionsac/',
  tiktok: 'https://www.tiktok.com/@clever.molina.pardo',
};

export function whatsappLink(message = 'Hola AIRCONSOLUTION SERVICES SAC, quisiera información sobre sus servicios.'): string {
  return `https://wa.me/${business.phone.replace('+', '')}?text=${encodeURIComponent(message)}`;
}

export const navLinks = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'trabajos', label: 'Trabajos' },
  { id: 'nosotros', label: 'Nosotros' },
  { id: 'testimonios', label: 'Testimonios' },
  { id: 'contacto', label: 'Contacto' },
];

export type ServiceId =
  | 'AIRE_ACONDICIONADO'
  | 'MANTENIMIENTO'
  | 'REPARACION'
  | 'ELECTRICIDAD'
  | 'ESTRUCTURAS'
  | 'BOMBAS'
  | 'EMERGENCIA';

export interface ServiceItem {
  id: ServiceId;
  title: string;
  short: string;
  description: string;
  image: string;
  icon: string;
  features: string[];
}

export const services: ServiceItem[] = [
  {
    id: 'AIRE_ACONDICIONADO',
    title: 'Instalación de Aire Acondicionado',
    short: 'Split, multisplit, piso-techo, cassette y ductos.',
    description:
      'Instalamos sistemas de aire acondicionado adaptados a cada espacio para garantizar confort y eficiencia energética.',
    image: 'images/svc_ac',
    icon: 'snow',
    features: ['Cálculo de BTU', 'Vacío y prueba de fugas', 'Acabado limpio'],
  },
  {
    id: 'MANTENIMIENTO',
    title: 'Mantenimiento Preventivo',
    short: 'Limpieza profunda de evaporador y condensadora.',
    description:
      'Inspecciones y mantenimientos periódicos para prevenir fallas, reducir el consumo eléctrico y alargar la vida de tus equipos.',
    image: 'images/svc_mant',
    icon: 'shield',
    features: ['Lavado a presión', 'Revisión de gas', 'Informe técnico'],
  },
  {
    id: 'REPARACION',
    title: 'Mantenimiento de Línea Blanca',
    short: 'Refrigeradoras, lavadoras, secadoras y cocinas.',
    description:
      'Limpiamos, revisamos y reparamos refrigeradoras, congeladoras, lavadoras, secadoras, cocinas y hornos para que funcionen bien y duren más.',
    image: 'images/svc_rep',
    icon: 'wrench',
    features: ['Refrigeradoras y congeladoras', 'Lavadoras y secadoras', 'Cocinas y hornos'],
  },
  {
    id: 'ELECTRICIDAD',
    title: 'Instalaciones Eléctricas',
    short: 'Tableros, cableado y puesta a tierra.',
    description:
      'Soluciones eléctricas seguras y eficientes para hogares, oficinas e industrias, cumpliendo estándares de calidad.',
    image: 'images/svc_elec',
    icon: 'bolt',
    features: ['Tableros eléctricos', 'Pozos a tierra', 'Iluminación'],
  },
  {
    id: 'ESTRUCTURAS',
    title: 'Estructuras Metálicas',
    short: 'Ductería, soportes y estructuras a medida.',
    description:
      'Diseñamos e instalamos estructuras y ductería metálica resistente y segura para proyectos industriales y comerciales.',
    image: 'images/svc_metal',
    icon: 'grid',
    features: ['Ductos de aire', 'Soportes para equipos', 'Soldadura'],
  },
  {
    id: 'BOMBAS',
    title: 'Servicio de Gasfitería',
    short: 'Bombas de agua, tuberías y fugas.',
    description:
      'Instalamos y mantenemos bombas de agua y presurizadores, reparamos fugas y tuberías, y dejamos tus instalaciones sanitarias funcionando sin problemas.',
    image: 'images/svc_bomba',
    icon: 'drop',
    features: ['Bombas de agua y presurizadores', 'Reparación de fugas y tuberías', 'Tanques y cisternas'],
  },
];

export const bookableServices: { id: ServiceId; label: string }[] = [
  ...services.map((s) => ({ id: s.id, label: s.title })),
  { id: 'EMERGENCIA', label: 'Emergencia 24/7' },
];

export type GalleryCategory = 'aire' | 'mantenimiento' | 'electrico' | 'estructuras';

export interface GalleryItem {
  image: string;
  caption: string;
  category: GalleryCategory;
  tall?: boolean;
}

export const galleryFilters: { id: GalleryCategory | 'todos'; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'mantenimiento', label: 'Mantenimiento' },
  { id: 'aire', label: 'Aire acondicionado' },
  { id: 'electrico', label: 'Eléctrico' },
  { id: 'estructuras', label: 'Estructuras' },
];

/**
 * Para agregar más fotos: súbelas a public/images/trabajos/ (en .jpg y .webp)
 * y añade una línea aquí. La ruta va sin extensión.
 */
export const galleryItems: GalleryItem[] = [
  { image: 'images/trabajos/tecnico-york', caption: 'Mantenimiento de equipo piso-techo York', category: 'mantenimiento', tall: true },
  { image: 'images/trabajos/condensadora-lavado', caption: 'Lavado de condensadora', category: 'mantenimiento', tall: true },
  { image: 'images/trabajos/split-limpieza', caption: 'Limpieza de split de pared', category: 'mantenimiento' },
  { image: 'images/trabajos/cortina-aire', caption: 'Servicio a cortina de aire', category: 'mantenimiento' },
  { image: 'images/trabajos/condensadora-mantenimiento', caption: 'Revisión de unidad condensadora', category: 'aire', tall: true },
  { image: 'images/trabajos/lavado-condensadora-gree', caption: 'Lavado a presión de condensadora Gree', category: 'mantenimiento', tall: true },
  { image: 'images/trabajos/reparacion-compresor', caption: 'Reparación de equipo de ventana', category: 'aire', tall: true },
  { image: 'images/trabajos/mantenimiento-ductos', caption: 'Mantenimiento de equipo con ductos en azotea', category: 'mantenimiento', tall: true },
  { image: 'images/trabajos/ventilador-condensadora', caption: 'Limpieza de ventilador de condensadora', category: 'mantenimiento', tall: true },
  { image: 'images/trabajos/limpieza-filtros', caption: 'Limpieza de filtros de split', category: 'mantenimiento', tall: true },
  { image: 'images/trabajos/reparacion-coldpoint', caption: 'Reparación de condensadora Coldpoint', category: 'aire', tall: true },
  { image: 'images/trabajos/mantenimiento-equipo-ductos', caption: 'Mantenimiento de unidad con ductos', category: 'mantenimiento', tall: true },
  { image: 'images/trabajos/condensadoras-coldpoint', caption: 'Condensadoras Coldpoint en azotea', category: 'aire' },
  { image: 'images/trabajos/lavado-condensadora-inverter', caption: 'Lavado de condensadora inverter', category: 'mantenimiento' },
  { image: 'images/gal_1', caption: 'Mantenimiento industrial', category: 'mantenimiento', tall: true },
  { image: 'images/gal_6', caption: 'Instalación de ductos', category: 'estructuras' },
  { image: 'images/gal_7', caption: 'Ductería metálica', category: 'estructuras' },
  { image: 'images/gal_5', caption: 'Instalación eléctrica', category: 'electrico' },
  { image: 'images/gal_2', caption: 'Reparación de motor', category: 'electrico' },
  { image: 'images/gal_3', caption: 'Limpieza de serpentín', category: 'mantenimiento' },
  { image: 'images/gal_4', caption: 'Instalación de condensadora', category: 'aire' },
];

export const brands: { name: string; src?: string }[] = [
  { name: 'Samsung' },
  { name: 'LG' },
  { name: 'York' },
  { name: 'Gree' },
  { name: 'Panasonic' },
  { name: 'Carrier' },
  { name: 'Midea' },
  { name: 'Daikin' },
  { name: 'Cold Point' },
];

/** AJUSTAR: reemplaza estas cifras por las reales del negocio. */
export const stats = [
  { value: 20, suffix: '+', label: 'Años de experiencia' },
  { value: 1500, suffix: '+', label: 'Equipos atendidos' },
  { value: 98, suffix: '%', label: 'Clientes satisfechos' },
  { value: 24, suffix: '/7', label: 'Atención de emergencias' },
];

export const processSteps = [
  { icon: 'calendar', title: 'Reserva en línea', text: 'Elige el servicio, la fecha y el horario que mejor te acomode. Recibes un código para seguir tu cita.' },
  { icon: 'search', title: 'Diagnóstico', text: 'Un técnico evalúa el equipo o la instalación y te explica qué necesita, sin letra pequeña.' },
  { icon: 'wrench', title: 'Trabajo profesional', text: 'Ejecutamos el servicio con herramientas adecuadas, repuestos originales y dejamos todo limpio.' },
  { icon: 'shield', title: 'Garantía', text: 'Te entregamos un informe del trabajo y respaldamos cada servicio con garantía por escrito.' },
];

export const checklist = [
  'Técnicos capacitados y uniformados',
  'Repuestos originales y garantía por escrito',
  'Atención de emergencias 24/7',
  'Presupuestos transparentes, sin sorpresas',
];

export const testimonials = [
  {
    name: 'Carlos Mendoza',
    role: 'Gerente de Operaciones',
    text: 'Excelente servicio. Vinieron a reparar el sistema central de aire de nuestras oficinas y quedó funcionando a la perfección. Muy profesionales.',
    img: 'images/testimonials/testi_carlos.jpg',
    rating: 5,
  },
  {
    name: 'Rosa Fernández',
    role: 'Propietaria de vivienda',
    text: 'Instalaron el aire acondicionado en tiempo récord y dejaron todo impecable. Además el precio fue justo y transparente desde el inicio.',
    img: 'images/testimonials/testi_rosa.jpg',
    rating: 5,
  },
  {
    name: 'Jorge Salazar',
    role: 'Administrador de local comercial',
    text: 'Los llamamos por una emergencia eléctrica un domingo y llegaron en menos de una hora. Rapidez y seriedad que se agradecen.',
    img: 'images/testimonials/testi_jorge.jpg',
    rating: 5,
  },
];

export const faqs = [
  {
    q: '¿Cada cuánto tiempo debo hacer mantenimiento a mi aire acondicionado?',
    a: 'Recomendamos un mantenimiento preventivo cada 6 meses en casas y cada 3 meses en negocios o equipos de uso intensivo. Así evitas fallas, malos olores y un mayor consumo de luz.',
  },
  {
    q: '¿En qué zonas atienden?',
    a: 'Atendemos en toda Lima Metropolitana y Callao. Para proyectos fuera de Lima coordinamos según el alcance del trabajo.',
  },
  {
    q: '¿Cuánto cuesta la visita técnica?',
    a: 'Depende del servicio y la distancia. Al reservar te confirmamos el costo por WhatsApp antes de la visita, y si contratas el trabajo se descuenta del total.',
  },
  {
    q: '¿Los trabajos tienen garantía?',
    a: 'Sí. Todos nuestros servicios tienen garantía por escrito. El plazo depende del tipo de trabajo y de los repuestos utilizados.',
  },
  {
    q: '¿Qué marcas de equipos atienden?',
    a: 'Trabajamos con todas las marcas del mercado: Samsung, LG, York, Gree, Panasonic, Carrier, Midea, Daikin, entre otras.',
  },
  {
    q: '¿Emiten factura?',
    a: 'Sí, emitimos boleta o factura electrónica como AIRCONSOLUTION SERVICES SAC.',
  },
];

/* ===== Páginas de soluciones (una por servicio, para Google y para cotizar) ===== */

export interface ServicePageData {
  /** Dirección de la página, sin barra: airconsolutionsac.com/<slug> */
  slug: string;
  /** Texto corto para menús y tarjetas. */
  label: string;
  icon: string;
  /** Servicio que se preselecciona al reservar una visita desde esta página. */
  bookingService: ServiceId;
  seoTitle: string;
  seoDescription: string;
  h1: string;
  intro: string;
  /** Qué incluye el servicio. */
  includes: string[];
  /** Fotos reales de trabajos (rutas de galleryItems, sin extensión). */
  photos: string[];
  /** Mensaje que se envía por WhatsApp al pedir la cotización. */
  quoteMessage: string;
  /** Texto pequeño sobre el título (por defecto «Soluciones corporativas integrales»). */
  eyebrow?: string;
}

/** Tipos de clientes que atendemos. */
export const sectors: { icon: string; label: string; text: string }[] = [
  { icon: 'grid', label: 'Empresas y oficinas', text: 'Ambientes frescos para tu equipo y tus reuniones.' },
  { icon: 'home', label: 'Edificios y condominios', text: 'Equipos de áreas comunes y de cada departamento.' },
  { icon: 'star', label: 'Hoteles', text: 'Confort en habitaciones, recepción y salones.' },
  { icon: 'snow', label: 'Restaurantes', text: 'Salón agradable y cocina con buena ventilación.' },
  { icon: 'bolt', label: 'Negocios y tiendas', text: 'Clientes cómodos y equipos que no se detienen.' },
  { icon: 'user', label: 'Casas', text: 'Instalación y mantenimiento para tu hogar.' },
];

/** AJUSTAR: distritos donde trabajan. */
export const coverage: { zone: string; districts: string }[] = [
  { zone: 'Lima Norte', districts: 'Los Olivos, San Martín de Porres, Comas, Independencia, Puente Piedra y Carabayllo' },
  { zone: 'Lima Centro', districts: 'Cercado de Lima, Breña, Jesús María, Lince, La Victoria, San Isidro, Miraflores, San Borja y Surquillo' },
  { zone: 'Lima Sur', districts: 'Santiago de Surco, Chorrillos, Barranco, San Juan de Miraflores y Villa El Salvador' },
  { zone: 'Lima Este', districts: 'San Juan de Lurigancho, Ate, Santa Anita, La Molina y El Agustino' },
  { zone: 'Callao', districts: 'Callao, Bellavista, La Perla, La Punta y Ventanilla' },
];

/** Pasos de atención para clientes que piden una cotización. */
export const quoteProcess = [
  { icon: 'whatsapp', title: 'Nos escribes', text: 'Pides tu cotización por WhatsApp, por teléfono o reservando una visita en línea.' },
  { icon: 'search', title: 'Visita técnica', text: 'Revisamos los equipos y el lugar, y te explicamos qué necesitan.' },
  { icon: 'download', title: 'Cotización por escrito', text: 'Recibes la propuesta con el detalle del trabajo, el plazo y el precio.' },
  { icon: 'wrench', title: 'Ejecución', text: 'Trabajamos en el horario que te acomode, sin detener tu operación.' },
  { icon: 'shield', title: 'Informe y garantía', text: 'Te entregamos el informe del trabajo, la factura y la garantía por escrito.' },
];

export const servicePages: ServicePageData[] = [
  {
    slug: 'mantenimiento-aire-acondicionado-empresas',
    label: 'Mantenimiento para empresas',
    icon: 'wrench',
    bookingService: 'MANTENIMIENTO',
    seoTitle: 'Mantenimiento de Aire Acondicionado para Empresas en Lima :: AIRCONSOLUTION',
    seoDescription:
      'Mantenimiento de aire acondicionado para empresas en Lima: oficinas, edificios, hoteles, restaurantes y tiendas. Preventivo y correctivo, informe técnico y factura.',
    h1: 'Mantenimiento de aire acondicionado para empresas en Lima',
    intro:
      'Mantenemos los equipos de oficinas, edificios, hoteles, restaurantes y locales comerciales para que funcionen sin fallas, consuman menos energía y den un aire limpio a tus clientes y colaboradores. Programamos las visitas en el horario que menos afecte tu operación.',
    includes: [
      'Limpieza de filtros, evaporador y condensadora',
      'Lavado a presión de serpentines',
      'Revisión de presiones y carga de refrigerante',
      'Medición de consumo eléctrico y ajuste de conexiones',
      'Limpieza de bandeja y desagüe para evitar goteos',
      'Informe técnico de cada equipo con recomendaciones',
    ],
    photos: [
      'images/trabajos/tecnico-york',
      'images/trabajos/mantenimiento-ductos',
      'images/trabajos/cortina-aire',
      'images/trabajos/lavado-condensadora-gree',
      'images/trabajos/mantenimiento-equipo-ductos',
      'images/trabajos/condensadora-lavado',
    ],
    quoteMessage: 'Hola AIRCONSOLUTION SERVICES SAC, quisiera una cotización de mantenimiento de aire acondicionado para mi empresa.',
  },
  {
    slug: 'instalacion-reparacion-aire-acondicionado',
    label: 'Instalación y reparación',
    icon: 'snow',
    bookingService: 'AIRE_ACONDICIONADO',
    seoTitle: 'Instalación y Reparación de Aire Acondicionado en Lima :: AIRCONSOLUTION',
    seoDescription:
      'Instalación y reparación de aire acondicionado en Lima: split, multisplit, piso-techo, cassette y ductos. Diagnóstico de fallas, todas las marcas y garantía por escrito.',
    h1: 'Instalación y reparación de equipos de aire acondicionado en Lima',
    intro:
      'Instalamos equipos nuevos con el cálculo de capacidad correcto para cada ambiente y reparamos los que ya tienes: si no enfría, gotea, hace ruido o muestra un código de error, encontramos la causa y la solucionamos. Trabajamos con todas las marcas.',
    includes: [
      'Visita técnica y cálculo de capacidad (BTU)',
      'Instalación de split, multisplit, piso-techo, cassette y ductos',
      'Tuberías de cobre, aislamiento y desagüe con acabado limpio',
      'Vacío, prueba de fugas y puesta en marcha',
      'Diagnóstico de fallas: no enfría, gotea, hace ruido o marca error',
      'Cambio de compresor, tarjeta, capacitor o motor ventilador',
    ],
    photos: [
      'images/gal_4',
      'images/trabajos/condensadoras-coldpoint',
      'images/trabajos/reparacion-compresor',
      'images/trabajos/reparacion-coldpoint',
      'images/trabajos/condensadora-mantenimiento',
      'images/gal_6',
    ],
    quoteMessage: 'Hola AIRCONSOLUTION SERVICES SAC, quisiera una cotización de instalación o reparación de aire acondicionado.',
  },
  {
    slug: 'refrigeracion-comercial',
    label: 'Refrigeración comercial',
    icon: 'drop',
    bookingService: 'MANTENIMIENTO',
    seoTitle: 'Mantenimiento de Refrigeración Comercial en Lima :: AIRCONSOLUTION',
    seoDescription:
      'Mantenimiento de sistemas de refrigeración comercial en Lima: cámaras de frío, conservadoras y vitrinas para restaurantes, hoteles, tiendas y negocios. Garantía por escrito.',
    h1: 'Mantenimiento de sistemas de refrigeración comercial',
    intro:
      'Cuidamos los equipos de frío de restaurantes, hoteles, bodegas y tiendas para que mantengan la temperatura correcta y no pongas en riesgo tu mercadería. Hacemos mantenimiento preventivo y atendemos fallas cuando se presentan.',
    includes: [
      'Cámaras de frío, conservadoras y vitrinas refrigeradas',
      'Limpieza de condensadores y evaporadores',
      'Revisión de presiones, fugas y carga de refrigerante',
      'Control de temperatura, termostatos y controladores',
      'Revisión de compresores y motores ventiladores',
      'Atención de fallas y emergencias',
    ],
    photos: [
      'images/gal_3',
      'images/trabajos/ventilador-condensadora',
      'images/trabajos/lavado-condensadora-inverter',
      'images/gal_1',
      'images/gal_2',
      'images/trabajos/condensadora-mantenimiento',
    ],
    quoteMessage: 'Hola AIRCONSOLUTION SERVICES SAC, quisiera una cotización de mantenimiento de refrigeración comercial.',
  },
  {
    slug: 'contratos-mantenimiento-preventivo',
    label: 'Contratos preventivos',
    icon: 'calendar',
    bookingService: 'MANTENIMIENTO',
    seoTitle: 'Contratos de Mantenimiento Preventivo de Aire Acondicionado :: AIRCONSOLUTION',
    seoDescription:
      'Contratos de mantenimiento preventivo de aire acondicionado para oficinas, edificios y comercios en Lima. Visitas programadas, informe por equipo y factura electrónica.',
    h1: 'Contratos de mantenimiento preventivo para oficinas, edificios y comercios',
    intro:
      'Con un contrato de mantenimiento te olvidas de llamar cada vez: programamos las visitas, llevamos el registro de cada equipo y te avisamos antes de que algo falle. Así alargas la vida de tus equipos, gastas menos en reparaciones y evitas que se detengan en plena temporada de calor.',
    includes: [
      'Inventario y diagnóstico inicial de todos tus equipos',
      'Cronograma de visitas mensual, bimestral, trimestral o semestral',
      'Informe técnico de cada equipo después de cada visita',
      'Prioridad en la atención de fallas y emergencias',
      'Tarifa acordada por periodo, con factura electrónica',
      'Un mismo equipo técnico que ya conoce tus instalaciones',
    ],
    photos: [
      'images/trabajos/limpieza-filtros',
      'images/trabajos/split-limpieza',
      'images/trabajos/mantenimiento-ductos',
      'images/trabajos/tecnico-york',
      'images/trabajos/condensadoras-coldpoint',
      'images/gal_1',
    ],
    quoteMessage: 'Hola AIRCONSOLUTION SERVICES SAC, quisiera una cotización de un contrato de mantenimiento preventivo.',
  },
  {
    slug: 'aire-acondicionado-los-olivos',
    label: 'Aire acondicionado en Los Olivos',
    icon: 'pin',
    bookingService: 'AIRE_ACONDICIONADO',
    eyebrow: 'Estamos en Los Olivos · Lima Norte',
    seoTitle: 'Aire Acondicionado en Los Olivos y Lima Norte :: AIRCONSOLUTION',
    seoDescription:
      'Aire acondicionado en Los Olivos: instalación, mantenimiento y reparación. Llegamos rápido a San Martín de Porres, Comas, Independencia y Puente Piedra.',
    h1: 'Aire acondicionado en Los Olivos y Lima Norte',
    intro:
      'Somos una empresa de Los Olivos, así que llegamos rápido a tu casa, oficina o negocio en Lima Norte: San Martín de Porres, Comas, Independencia, Puente Piedra y Carabayllo. Instalamos, mantenemos y reparamos aire acondicionado de todas las marcas, con más de 20 años de experiencia y garantía por escrito.',
    includes: [
      'Instalación de aire acondicionado split, piso-techo, cassette y ductos',
      'Mantenimiento preventivo para casas, oficinas y negocios',
      'Reparación de fallas: no enfría, gotea, hace ruido o marca error',
      'Atención de emergencias 24/7 en Lima Norte',
      'Visita técnica y cotización por escrito',
      'Boleta o factura y garantía por escrito',
    ],
    photos: [
      'images/trabajos/condensadoras-coldpoint',
      'images/trabajos/tecnico-york',
      'images/trabajos/lavado-condensadora-gree',
      'images/trabajos/split-limpieza',
      'images/trabajos/reparacion-coldpoint',
      'images/gal_4',
    ],
    quoteMessage: 'Hola AIRCONSOLUTION SERVICES SAC, estoy en Lima Norte y quisiera una cotización de aire acondicionado.',
  },
  {
    slug: 'aire-acondicionado-para-casas',
    label: 'Aire acondicionado para casas',
    icon: 'home',
    bookingService: 'AIRE_ACONDICIONADO',
    eyebrow: 'Para tu hogar',
    seoTitle: 'Aire Acondicionado para Casas en Lima :: AIRCONSOLUTION',
    seoDescription:
      'Aire acondicionado para casas en Lima: te ayudamos a elegir el equipo (BTU, inverter), lo instalamos y le damos mantenimiento. Garantía por escrito.',
    h1: 'Aire acondicionado para casas en Lima',
    intro:
      'Te ayudamos a elegir el aire acondicionado ideal para tu dormitorio o tu sala, lo instalamos con un acabado limpio y le damos mantenimiento para que dure muchos años. Como guía: 12 000 BTU para ambientes de hasta 20 m², 18 000 BTU de 20 a 30 m² y 24 000 BTU de 30 a 40 m². Si lo usas varias horas al día, te recomendamos un equipo inverter, porque ahorra luz.',
    includes: [
      'Asesoría para elegir el equipo: BTU, inverter o convencional',
      'Venta e instalación de equipos split para dormitorios y salas',
      'Instalación limpia: tubería de cobre aislada, desagüe y prueba de fugas',
      'Mantenimiento cada 6 meses para que enfríe bien y gaste menos luz',
      'Reparación de equipos de todas las marcas',
      'Garantía por escrito',
    ],
    photos: [
      'images/trabajos/split-limpieza',
      'images/trabajos/limpieza-filtros',
      'images/trabajos/condensadora-mantenimiento',
      'images/trabajos/lavado-condensadora-inverter',
      'images/gal_4',
      'images/trabajos/condensadora-lavado',
    ],
    quoteMessage: 'Hola AIRCONSOLUTION SERVICES SAC, quisiera una cotización de aire acondicionado para mi casa.',
  },
];

/** Título y descripción de cada página para Google y las redes sociales. */
export const pageSeo: Record<string, { title: string; description: string; noindex?: boolean }> = {
  '/': {
    title: 'AIRCONSOLUTION SERVICES SAC :: Aire Acondicionado en Lima',
    description:
      'Aire Acondicionado en Lima: soluciones corporativas integrales para empresas, edificios, hoteles, restaurantes, casas y negocios. Instalación, mantenimiento y reparación.',
  },
  '/seguimiento': {
    title: 'Seguir mi reserva | AIRCONSOLUTION SERVICES SAC',
    description: 'Consulta el estado de tu visita técnica con el código de reserva que recibiste.',
  },
  '/privacidad': {
    title: 'Política de privacidad | AIRCONSOLUTION SERVICES SAC',
    description: 'Cómo protegemos tus datos personales según la Ley N.° 29733 de Protección de Datos Personales del Perú.',
  },
  '/admin': {
    title: 'Agenda AIRCON | AIRCONSOLUTION SERVICES SAC',
    description: 'Agenda interna del equipo: citas, clientes y mantenimientos.',
    noindex: true,
  },
  ...Object.fromEntries(servicePages.map((p) => [`/${p.slug}`, { title: p.seoTitle, description: p.seoDescription }])),
};
