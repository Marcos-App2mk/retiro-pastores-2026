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
  nombre: 'Campamento CIY',          // Título del evento (encabezado, pestaña del navegador, imagen del QR)
  tema: 'Vértice',                   // Tema o lema (aparece en la imagen que guardan los campistas)
  anio: '2027',                      // Año (aparece junto al nombre en la imagen del QR)
  siglas: 'CIY',                     // Letras de los códigos: CIY-K7M2QX  (2 a 8 letras o números, sin espacios)
  lugar: 'Campamento Bagope',        // Lugar (aparece bajo el banner)
  fechaTexto: '6 de enero de 2027',  // Fecha como se muestra en la portada
  fechaInicio: '2027-01-06',         // Primer día del evento: AAAA-MM-DD (se usa para calcular la edad)
  fechaLimite: '23 de diciembre de 2026', // Fecha límite para depositar y registrarse

  /* ---- Dinero ---- */
  moneda: 'L.',
  precioTotal: 1500,                 // Costo total
  reserva: 300,                      // Depósito para reservar el lugar

  /* ---- Edad ---- */
  edadAviso: 12,                     // Se marca como "MENOR" a quien tenga menos de esta edad el primer día

  /* ---- Cuenta para depósitos ---- */
  banco: {
    nombre: 'BAC',
    tipoCuenta: '',                  // Ejemplo: 'Ahorro' o 'Cheques' (déjalo vacío si no quieres mostrarlo)
    numeroCuenta: '757478771',
    titular: 'MINISTERIO KINISI',
    nota: ''                         // (Opcional) Ejemplo: 'Escribe el nombre del campista en el comprobante'
  },

  /* ---- Imágenes (reemplaza los archivos de la carpeta assets o cambia estas rutas) ---- */
  imagenes: {
    logo: 'assets/logo.png',         // Logo (cuadro de la esquina), cuadrado, ~500x500
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
