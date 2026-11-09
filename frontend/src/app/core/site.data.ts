/**
 * Contenido editable del sitio. Cambia aquí teléfonos, servicios, fotos,
 * testimonios o preguntas frecuentes sin tocar los componentes.
 */

export const business = {
  name: 'AIRCONSOLUTION SERVICES SAC',
  legalName: 'AIRCONSOLUTION SERVICES SAC',
  phone: '+51985899731',
  phoneDisplay: '+51 985 899 731',
  phone2: '+51990073634',
  phone2Display: '+51 990 073 634',
  email: 'aircon82@gmail.com',
  address: 'Calle 20 Mz. 28 Lt. 17 A.H. Laura Caller, Los Olivos, Lima',
  hours: 'Lun – Sáb: 8:00 a.m. – 6:00 p.m. · Emergencias 24/7',
  mapEmbedSrc: 'https://maps.google.com/maps?q=AirconSolutionSAC,Los+Olivos,Lima&z=16&output=embed',
  mapLink: 'https://www.google.com/maps/place/?q=place_id:ChIJaWvmcgDPBZERs2kE8Nof2Sw',
  facebook: 'https://www.facebook.com/AirconSolutionSAC',
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
    title: 'Reparación de Equipos',
    short: 'Diagnóstico preciso y repuestos originales.',
    description:
      'Diagnosticamos y solucionamos averías en equipos eléctricos y de climatización con un servicio rápido y eficiente.',
    image: 'images/svc_rep',
    icon: 'wrench',
    features: ['Diagnóstico el mismo día', 'Repuestos originales', 'Garantía'],
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
    title: 'Bombas de Agua',
    short: 'Instalación y mantenimiento de sistemas de bombeo.',
    description:
      'Instalación y mantenimiento de bombas de agua para asegurar un suministro continuo y un óptimo rendimiento.',
    image: 'images/svc_bomba',
    icon: 'drop',
    features: ['Bombas y presurizadores', 'Tableros de control', 'Mantenimiento'],
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
