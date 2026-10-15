/* ==========================================================================
   CONFIGURACIÓN DEL EVENTO  —  este es el ÚNICO archivo que cambias por evento
   (más las 3 imágenes de la carpeta /assets y las variables en Vercel).
   Guía completa: CAMBIAR-DE-EVENTO.md
   ========================================================================== */

// En Vercel déjalo en true: la app usa las funciones de /api y la base de datos conectada a Vercel.
window.USE_API = true;
// (Opcional, solo si NO usas Vercel) URL de Firebase Realtime Database:
window.FIREBASE_URL = '';

window.EVENTO = {
  /* ---- Nombre y textos ---- */
  nombre: 'Retiro de Pastores',      // Título del evento (encabezado, pestaña del navegador, imagen del QR)
  tema: 'Asociación de Pastores de Honduras', // Tema o lema (aparece en la imagen que guardan los participantes)
  anio: '2026',                      // Año (aparece junto al nombre en la imagen del QR)
  siglas: 'RP',                      // Letras de los códigos: RP-K7M2QX  (2 a 8 letras o números, sin espacios)
  lugar: 'Campamento Extremo, Lago de Yojoa', // Lugar (aparece bajo el banner)
  fechaTexto: '30 de noviembre al 3 de diciembre de 2026', // Fecha como se muestra en la portada
  fechaInicio: '2026-11-30',         // Primer día del evento: AAAA-MM-DD (se usa para calcular la edad y el precio)
  fechaLimite: '4 de noviembre de 2026', // Fecha límite para depositar y registrarse

  /* ---- Dinero ---- */
  moneda: 'L.',
  precioTotal: 600,                  // Costo por persona si NO usas "precios" por edad (abajo)
  reserva: 800,                      // Depósito para reservar (por registro/familia). Si el total es menor, se pide el total. 0 = solo pago completo

  /* ---- Calculadora de costo por familia ----
     true = el registro empieza con: nombre del pastor, nombre de la esposa, hijos (nombre y fecha de nacimiento).
     Se registra una familia por registro, con un solo código QR. false = un registro por persona. */
  calculadoraFamilia: true,

  /* ---- Precios por edad (opcional) ----
     Edad el primer día del evento (fechaInicio). Borra esta lista o déjala vacía [] para usar un solo precio (precioTotal).
     "hasta" vacío o null = sin límite. */
  precios: [
    { desde: 0,  hasta: 5,    precio: 0,   etiqueta: '0 a 5 años' },
    { desde: 6,  hasta: 17,   precio: 200, etiqueta: '6 a 17 años' },
    { desde: 18, hasta: null, precio: 600, etiqueta: '18 años o más' }
  ],

  /* ---- Nota bajo las instrucciones de pago (opcional, '' para no mostrarla) ---- */
  notaPago: '',

  /* ---- Preguntas opcionales del formulario ---- */
  pedirEmergencia: false,            // true = pide contacto y número de emergencia
  pedirBautizo: false,               // true = pregunta "¿Estás bautizado?"

  /* ---- Edad ---- */
  edadAviso: 18,                     // Se marca como "MENOR" a quien tenga menos de esta edad el primer día

  /* ---- Cuenta para depósitos ---- */
  banco: {
    nombre: 'BAC',
    tipoCuenta: '',                  // Ejemplo: 'Ahorro' o 'Cheques' (déjalo vacío si no quieres mostrarlo)
    numeroCuenta: '730535591',
    titular: 'MINISTERIO KINISI',
    nota: 'Escribe el apellido de la familia en el comprobante'
  },

  /* ---- Título sobre el banner: true si la foto del banner NO trae el nombre del evento escrito ---- */
  tituloEnBanner: true,

  /* ---- Imágenes (reemplaza los archivos de la carpeta assets o cambia estas rutas) ---- */
  imagenes: {
    logo: 'assets/logo.png',         // Logo abajo a la izquierda del banner (horizontal, ~400x200, fondo blanco)
    banner: 'assets/banner.jpg',     // Banner de la portada, ~1400x770 (el nombre/tema va dentro de la imagen)
    banco: 'assets/bank.jpg'         // Imagen con los datos del banco (déjala vacía '' si no quieres mostrarla)
  },

  /* ---- Comidas: una línea por comida, en orden. Cada QR sirve para todas. ---- */
  comidas: [
    { dia: 1, tipo: 'Cena' },
    { dia: 2, tipo: 'Desayuno' }, { dia: 2, tipo: 'Almuerzo' }, { dia: 2, tipo: 'Cena' },
    { dia: 3, tipo: 'Desayuno' }, { dia: 3, tipo: 'Almuerzo' }, { dia: 3, tipo: 'Cena' },
    { dia: 4, tipo: 'Desayuno' }, { dia: 4, tipo: 'Almuerzo' }
  ],

  /* ---- Color principal de botones (opcional). Déjalo en '' para usar el naranja actual ---- */
  colorAcento: '',                   // Ejemplo: '#C1502E'
  colorAcentoOscuro: ''              // Ejemplo: '#A23F22'
};
