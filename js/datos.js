/* ================================================================
   datos.js
   ----------------------------------------------------------------
   Este archivo lo usan LAS DOS páginas (index.html y cuenta.html).
   Por eso se carga primero. Aquí guardamos:

     1. Funciones para guardar y leer datos en el navegador
     2. La lista de rutas
     3. Los roles y los campos de cada rol
     4. Los usuarios y los buses de ejemplo
     5. Funciones para buscar usuarios, buses y la sesión
     6. Validaciones de los formularios
     7. Funciones de ayuda (mensajes, fechas, textos)
   ================================================================ */


/* ================================================================
   1. GUARDAR Y LEER DATOS (localStorage)
   ----------------------------------------------------------------
   No tenemos una base de datos real. "localStorage" es un espacio
   del navegador donde podemos guardar información que NO se borra
   cuando recargamos la página.

   localStorage solo guarda TEXTO. Por eso usamos:
     JSON.stringify(dato) -> convierte una lista u objeto en texto
     JSON.parse(texto)    -> convierte ese texto otra vez en lista u objeto
   ================================================================ */

// Todas las claves empiezan con este prefijo para no mezclarse con otras páginas.
const PREFIJO = "transubic_sencillo_";

// Lee un dato guardado. Si no existe, devuelve "valorPorDefecto".
function leerDato(nombre, valorPorDefecto) {
  let texto = localStorage.getItem(PREFIJO + nombre);
  if (texto === null) {
    return valorPorDefecto;
  }
  return JSON.parse(texto);
}

// Guarda un dato (lo convierte en texto primero).
function guardarDato(nombre, valor) {
  localStorage.setItem(PREFIJO + nombre, JSON.stringify(valor));
}

// Borra un dato guardado.
function borrarDato(nombre) {
  localStorage.removeItem(PREFIJO + nombre);
}


/* ================================================================
   2. RUTAS DE BUS
   ----------------------------------------------------------------
   Es una lista (arreglo) de objetos. Cada objeto es una ruta.
   "color" es el nombre de una clase del CSS (blue, green, lime, sea)
   que pinta el cuadrito con el código de la ruta.
   "lugares" son sitios importantes por donde pasa la ruta.
   ================================================================ */
const RUTAS = [
  { codigo: "R10",  origen: "Centro",           destino: "Terminal Sur", paradas: 18, minutos: 25, color: "blue",  lugares: ["Hospital General"] },
  { codigo: "M404", origen: "Laureles",         destino: "Terminal Sur", paradas: 22, minutos: 32, color: "green", lugares: ["Universidad"] },
  { codigo: "L12",  origen: "Terminal Norte",   destino: "Centro",       paradas: 16, minutos: 28, color: "lime",  lugares: ["Parque Central"] },
  { codigo: "X55",  origen: "Parque del Río",   destino: "Centro",       paradas: 19, minutos: 27, color: "sea",   lugares: ["Parque Central", "Universidad"] },
  { codigo: "X52",  origen: "Belén",            destino: "Centro",       paradas: 17, minutos: 30, color: "blue",  lugares: ["Hospital General"] }
];

// Busca una ruta por su código (ej: "R10"). Si no la encuentra devuelve null.
function buscarRuta(codigo) {
  for (let i = 0; i < RUTAS.length; i++) {
    if (RUTAS[i].codigo === codigo) {
      return RUTAS[i];
    }
  }
  return null;
}

// Devuelve el nombre de la ruta, por ejemplo: "Centro → Terminal Sur".
function nombreRuta(ruta) {
  return ruta.origen + " → " + ruta.destino;
}

// Devuelve solo los códigos de todas las rutas: ["R10", "M404", ...]
function codigosDeRutas() {
  let codigos = [];
  for (let i = 0; i < RUTAS.length; i++) {
    codigos.push(RUTAS[i].codigo);
  }
  return codigos;
}


/* ================================================================
   3. ROLES Y CAMPOS
   ----------------------------------------------------------------
   En transUbic hay 5 tipos de usuario (roles):
     cliente       -> el pasajero (en pantalla se llama "Usuario")
     administrador -> maneja las cuentas y la flota
     operativo     -> vigila la operación desde el centro de control
     conductor     -> maneja el bus y abre/cierra su turno
     propietario   -> es dueño de buses y les asigna conductor
   ================================================================ */

// Nombre que se muestra en pantalla para cada rol.
const NOMBRES_DE_ROL = {
  cliente: "Usuario",
  administrador: "Administrador",
  operativo: "Operativo",
  conductor: "Conductor",
  propietario: "Propietario del bus"
};

// Lista con los roles en orden (la usamos para llenar los <select>).
const LISTA_DE_ROLES = ["cliente", "administrador", "operativo", "conductor", "propietario"];

// Opciones fijas de algunos campos.
const TURNOS = ["Mañana", "Tarde", "Noche"];
const CATEGORIAS_LICENCIA = ["B2", "B3", "C2", "C3"];
const ESTADOS_BUS = ["Activo", "En mantenimiento", "Inactivo"];

// Máximo de intentos para iniciar sesión antes de bloquear la cuenta.
const MAX_INTENTOS = 3;

/*
   Cada campo de un formulario lo describimos con un objeto:
     nombre    -> el "name" del input (y el nombre del dato en el usuario)
     etiqueta  -> el texto que ve la persona
     tipo      -> "text", "tel", "number" o "select" (lista desplegable)
     requerido -> true si es obligatorio
     opciones  -> solo para los "select"
     ayuda     -> texto pequeño de ayuda debajo del campo (opcional)
*/

// Campos que tienen TODOS los usuarios.
const CAMPOS_COMUNES = [
  { nombre: "nombre",    etiqueta: "Nombre completo",        tipo: "text", requerido: true },
  { nombre: "documento", etiqueta: "Documento de identidad", tipo: "text", requerido: true },
  { nombre: "telefono",  etiqueta: "Teléfono",               tipo: "tel",  requerido: true },
  { nombre: "ciudad",    etiqueta: "Ciudad",                 tipo: "text" },
  { nombre: "direccion", etiqueta: "Dirección",              tipo: "text" }
];

// Campos EXTRA que tiene cada rol.
const CAMPOS_EXTRA = {
  cliente: [
    { nombre: "tarjetaCivica", etiqueta: "N.º tarjeta de transporte", tipo: "text", ayuda: "Opcional · 10 dígitos" }
  ],
  administrador: [
    { nombre: "cargo", etiqueta: "Cargo", tipo: "text", requerido: true }
  ],
  operativo: [
    { nombre: "turno", etiqueta: "Turno", tipo: "select", opciones: TURNOS, requerido: true }
  ],
  conductor: [
    { nombre: "licencia",          etiqueta: "N.º licencia de conducción", tipo: "text",   requerido: true },
    { nombre: "categoriaLicencia", etiqueta: "Categoría",                  tipo: "select", opciones: CATEGORIAS_LICENCIA, requerido: true },
    { nombre: "experiencia",       etiqueta: "Años de experiencia",        tipo: "number", requerido: true }
  ],
  propietario: [
    { nombre: "empresa", etiqueta: "Empresa / razón social", tipo: "text" },
    { nombre: "nit",     etiqueta: "NIT",                    tipo: "text", ayuda: "Opcional · ej. 900123456-7" }
  ]
};

// Junta los campos comunes + los campos del rol en una sola lista.
// .concat() une dos listas en una nueva.
function camposDelRol(rol) {
  return CAMPOS_COMUNES.concat(CAMPOS_EXTRA[rol]);
}

// Texto corto que explica qué hace cada rol (se ve debajo del nombre).
function descripcionDelRol(usuario) {
  if (usuario.rol === "cliente") {
    return "Pasajero: consulta rutas, guarda favoritas y recibe novedades.";
  }
  if (usuario.rol === "administrador") {
    return "Gestiona las cuentas de todos los actores, asigna roles y revisa la flota.";
  }
  if (usuario.rol === "operativo") {
    return "Monitorea buses, rutas y alertas · Turno " + usuario.turno.toLowerCase() + ".";
  }
  if (usuario.rol === "conductor") {
    return "Conduce el bus asignado · Licencia " + usuario.categoriaLicencia + ".";
  }
  if (usuario.rol === "propietario") {
    let texto = "Registra sus buses y asigna conductores";
    if (usuario.empresa) {
      texto = texto + " · " + usuario.empresa;
    }
    return texto + ".";
  }
  return "";
}

// Campos del formulario de un bus. El bus "articulado" tiene un campo más: vagones.
function camposDelBus(tipo) {
  let etiquetaCapacidad = "Capacidad (pasajeros)";
  if (tipo === "articulado") {
    etiquetaCapacidad = "Capacidad por vagón";
  }

  let campos = [
    { nombre: "marca",     etiqueta: "Marca",          tipo: "text",   requerido: true },
    { nombre: "modelo",    etiqueta: "Modelo / línea", tipo: "text",   requerido: true },
    { nombre: "anio",      etiqueta: "Año",            tipo: "number", requerido: true },
    { nombre: "capacidad", etiqueta: etiquetaCapacidad, tipo: "number", requerido: true }
  ];

  if (tipo === "articulado") {
    campos.push({ nombre: "vagones", etiqueta: "N.º de vagones", tipo: "number", requerido: true });
  }

  campos.push({ nombre: "ruta",          etiqueta: "Ruta asignada", tipo: "select", opciones: codigosDeRutas() });
  campos.push({ nombre: "estado",        etiqueta: "Estado",        tipo: "select", opciones: ESTADOS_BUS, requerido: true });
  campos.push({ nombre: "observaciones", etiqueta: "Observaciones", tipo: "text" });
  return campos;
}


/* ================================================================
   4. USUARIOS Y BUSES DE EJEMPLO
   ================================================================ */

// Cuentas de prueba: una por cada rol. Sirven para probar la página.
const CUENTAS_DE_PRUEBA = [
  { rol: "cliente", nombre: "Laura Gómez", correo: "usuario@transubic.com", contrasena: "Usuario123",
    documento: "1032456789", telefono: "3104567890", ciudad: "Medellín", rutasFavoritas: ["R10", "X55"] },
  { rol: "administrador", nombre: "Andrés Restrepo", correo: "admin@transubic.com", contrasena: "Admin1234",
    documento: "71234567", telefono: "3001234567", ciudad: "Medellín", cargo: "Administrador del sistema" },
  { rol: "operativo", nombre: "Mariana Cárdenas", correo: "operativo@transubic.com", contrasena: "Operativo123",
    documento: "43987654", telefono: "3157894561", ciudad: "Medellín", turno: "Noche" },
  { rol: "conductor", nombre: "Jorge Hincapié", correo: "conductor@transubic.com", contrasena: "Conductor123",
    documento: "98765432", telefono: "3209876543", ciudad: "Bello", licencia: "98765432", categoriaLicencia: "C2", experiencia: 8 },
  { rol: "propietario", nombre: "Sofía Londoño", correo: "propietario@transubic.com", contrasena: "Propietario123",
    documento: "52345678", telefono: "3112345678", ciudad: "Envigado", empresa: "Transportes Londoño S.A.S.", nit: "900123456-7" }
];

/*
   Crea un objeto "usuario" con todos sus datos.

   NOTA IMPORTANTE: aquí guardamos la contraseña tal cual, como texto,
   porque es un proyecto de práctica. En una aplicación real NUNCA se
   hace así: la contraseña se envía a un servidor y se guarda cifrada.
*/
function crearUsuario(rol, datos) {
  let usuario = {
    id: generarId("usr"),
    rol: rol,
    nombre: datos.nombre || "",
    correo: (datos.correo || "").toLowerCase(),
    contrasena: datos.contrasena,
    documento: datos.documento || "",
    telefono: datos.telefono || "",
    ciudad: datos.ciudad || "",
    direccion: datos.direccion || "",
    fechaRegistro: new Date().toISOString(), // fecha y hora de hoy en formato texto
    ultimoAcceso: null,
    intentosFallidos: 0,
    bloqueado: false,
    codigoRecuperacion: null,
    codigoVence: null
  };
  agregarDatosDelRol(usuario, datos);
  return usuario;
}

/*
   Agrega al usuario los datos propios de su rol.
   Si un dato no viene, le ponemos un valor inicial.
   (El operador || significa "o": si lo de la izquierda está vacío, usa lo de la derecha).
   También la usamos cuando el administrador le CAMBIA el rol a alguien.
*/
function agregarDatosDelRol(usuario, datos) {
  if (usuario.rol === "cliente") {
    usuario.tarjetaCivica = datos.tarjetaCivica || "";
    usuario.rutasFavoritas = datos.rutasFavoritas || [];
  }
  if (usuario.rol === "administrador") {
    usuario.cargo = datos.cargo || "Administrador del sistema";
  }
  if (usuario.rol === "operativo") {
    usuario.turno = datos.turno || "Mañana";
  }
  if (usuario.rol === "conductor") {
    usuario.licencia = datos.licencia || "";
    usuario.categoriaLicencia = datos.categoriaLicencia || "C2";
    usuario.experiencia = datos.experiencia || 0;
  }
  if (usuario.rol === "propietario") {
    usuario.empresa = datos.empresa || "";
    usuario.nit = datos.nit || "";
  }
}

/*
   Crea un objeto "bus". Hay dos tipos:
     "bus"        -> bus convencional
     "articulado" -> bus largo con varios vagones
*/
function crearBus(tipo, datos) {
  return {
    id: generarId("bus"),
    tipo: tipo,
    placa: datos.placa,
    marca: datos.marca,
    modelo: datos.modelo,
    anio: Number(datos.anio),         // Number() convierte texto en número
    capacidad: Number(datos.capacidad),
    vagones: tipo === "articulado" ? Number(datos.vagones) : 1,
    ruta: datos.ruta || "",
    estado: datos.estado || "Activo",
    observaciones: datos.observaciones || "",
    propietarioId: datos.propietarioId || null,
    conductorId: datos.conductorId || null,
    turnoInicio: null,   // cuando el conductor inicia turno, aquí queda la hora
    historialTurnos: [], // últimos turnos terminados
    fechaRegistro: new Date().toISOString()
  };
}


/* ================================================================
   CARGAR LOS DATOS AL ABRIR LA PÁGINA
   ----------------------------------------------------------------
   La primera vez no hay nada guardado, entonces creamos los usuarios
   y buses de ejemplo y los guardamos.
   Las siguientes veces leemos lo que ya estaba guardado.
   ================================================================ */

let usuarios = leerDato("usuarios", null);

if (usuarios === null) {
  usuarios = [];
  for (let i = 0; i < CUENTAS_DE_PRUEBA.length; i++) {
    let cuenta = CUENTAS_DE_PRUEBA[i];
    usuarios.push(crearUsuario(cuenta.rol, cuenta));
  }
  guardarUsuarios();
}

let buses = leerDato("buses", null);

if (buses === null) {
  // Los buses de ejemplo pertenecen a la propietaria de prueba.
  let propietaria = buscarUsuarioPorCorreo("propietario@transubic.com");
  let conductor = buscarUsuarioPorCorreo("conductor@transubic.com");
  let idPropietaria = propietaria ? propietaria.id : null;
  let idConductor = conductor ? conductor.id : null;

  buses = [
    crearBus("bus", { placa: "TUB101", marca: "Chevrolet", modelo: "NPR Busetón", anio: 2021, capacidad: 40, ruta: "R10",
      propietarioId: idPropietaria, conductorId: idConductor }),
    crearBus("articulado", { placa: "TUB202", marca: "Volvo", modelo: "B340M", anio: 2023, capacidad: 80, vagones: 2, ruta: "M404",
      propietarioId: idPropietaria }),
    crearBus("bus", { placa: "TUB303", marca: "Hino", modelo: "FC9J", anio: 2019, capacidad: 45, ruta: "L12",
      estado: "En mantenimiento", observaciones: "Cambio de frenos", propietarioId: idPropietaria })
  ];
  guardarBuses();
}

function guardarUsuarios() {
  guardarDato("usuarios", usuarios);
}

function guardarBuses() {
  guardarDato("buses", buses);
}


/* ================================================================
   5. BUSCAR USUARIOS, BUSES Y SESIÓN
   ================================================================ */

function buscarUsuarioPorCorreo(correo) {
  correo = correo.trim().toLowerCase();
  for (let i = 0; i < usuarios.length; i++) {
    if (usuarios[i].correo === correo) {
      return usuarios[i];
    }
  }
  return null;
}

function buscarUsuarioPorId(id) {
  for (let i = 0; i < usuarios.length; i++) {
    if (usuarios[i].id === id) {
      return usuarios[i];
    }
  }
  return null;
}

// Devuelve todos los usuarios de un rol, por ejemplo todos los conductores.
function usuariosDelRol(rol) {
  let lista = [];
  for (let i = 0; i < usuarios.length; i++) {
    if (usuarios[i].rol === rol) {
      lista.push(usuarios[i]);
    }
  }
  return lista;
}

function buscarBusPorId(id) {
  for (let i = 0; i < buses.length; i++) {
    if (buses[i].id === id) {
      return buses[i];
    }
  }
  return null;
}

// Texto del tipo de bus para mostrar en pantalla.
function nombreTipoBus(bus) {
  if (bus.tipo === "articulado") {
    return "Bus articulado";
  }
  return "Bus convencional";
}

// Capacidad total: en el articulado se multiplica por la cantidad de vagones.
function capacidadTotal(bus) {
  if (bus.tipo === "articulado") {
    return bus.capacidad * bus.vagones;
  }
  return bus.capacidad;
}

// Frase que describe el bus, ej: "TUB101 · Chevrolet NPR Busetón 2021 · 40 pasajeros"
function describirBus(bus) {
  let texto = bus.placa + " · " + bus.marca + " " + bus.modelo + " " + bus.anio + " · " + capacidadTotal(bus) + " pasajeros";
  if (bus.tipo === "articulado") {
    texto = texto + " · " + bus.vagones + " vagones";
  }
  return texto;
}

// Nombre del conductor asignado a un bus.
function nombreConductor(bus) {
  let conductor = buscarUsuarioPorId(bus.conductorId);
  if (conductor) {
    return conductor.nombre;
  }
  return "Sin asignar";
}

/*
   LA SESIÓN
   Cuando alguien inicia sesión guardamos su "id" con el nombre "sesion".
   Así, al cambiar de página, sabemos quién está conectado.
*/
function usuarioConectado() {
  let id = leerDato("sesion", null);
  if (id === null) {
    return null;
  }
  let usuario = buscarUsuarioPorId(id);
  // Si el usuario ya no existe o lo bloquearon, cerramos la sesión.
  if (usuario === null || usuario.bloqueado) {
    borrarDato("sesion");
    return null;
  }
  return usuario;
}


/* ================================================================
   6. VALIDACIONES
   ----------------------------------------------------------------
   Revisan que lo que escribió la persona esté bien.
   Cada función devuelve:
     ""         (texto vacío) si todo está bien
     un mensaje si hay un error
   Usamos "expresiones regulares" (lo que está entre / /) para revisar
   el formato de un texto. Por ejemplo /^\d{10}$/ significa
   "exactamente 10 dígitos".
   ================================================================ */

function validarCorreo(correo) {
  if (correo === "") return "El correo es obligatorio.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) return "Escribe un correo válido.";
  return "";
}

function validarContrasena(contrasena) {
  // Mínimo 8 caracteres, sin espacios y con al menos un número.
  if (contrasena.length < 8 || contrasena.indexOf(" ") !== -1 || !/\d/.test(contrasena)) {
    return "La contraseña debe tener mínimo 8 caracteres, sin espacios, e incluir números (puede ser solo números).";
  }
  return "";
}

// Valida un campo según su nombre. Devuelve "" o el mensaje de error.
function validarCampo(nombreCampo, valor) {
  let anioActual = new Date().getFullYear();

  switch (nombreCampo) {
    case "nombre":
      if (valor.length < 3 || !/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ.' -]+$/.test(valor)) {
        return "El nombre solo puede tener letras y mínimo 3 caracteres.";
      }
      break;
    case "documento":
      if (!/^\d{5,12}$/.test(valor)) return "El documento debe tener entre 5 y 12 dígitos.";
      break;
    case "telefono":
      if (!/^\+?\d{7,13}$/.test(valor)) return "El teléfono debe tener entre 7 y 13 dígitos.";
      break;
    case "ciudad":
      if (valor.length < 2) return "La ciudad debe tener mínimo 2 caracteres.";
      break;
    case "tarjetaCivica":
      if (!/^\d{10}$/.test(valor)) return "La tarjeta debe tener 10 dígitos.";
      break;
    case "cargo":
      if (valor.length < 3) return "El cargo debe tener mínimo 3 caracteres.";
      break;
    case "licencia":
      if (!/^\d{6,12}$/.test(valor)) return "La licencia debe tener entre 6 y 12 dígitos.";
      break;
    case "experiencia":
      if (!esNumeroEntre(valor, 0, 50)) return "La experiencia debe ser un número entre 0 y 50.";
      break;
    case "empresa":
      if (valor.length < 3) return "La empresa debe tener mínimo 3 caracteres.";
      break;
    case "nit":
      if (!/^\d{9}-\d$/.test(valor)) return "El NIT debe tener el formato 900123456-7.";
      break;
    case "placa":
      if (!/^[A-Z]{3}\d{3}$/.test(valor)) return "La placa debe tener el formato ABC123.";
      break;
    case "marca":
      if (valor.length < 2) return "La marca debe tener mínimo 2 caracteres.";
      break;
    case "modelo":
      if (valor.length < 2) return "El modelo debe tener mínimo 2 caracteres.";
      break;
    case "anio":
      if (!esNumeroEntre(valor, 1995, anioActual + 1)) return "El año debe ser un número entre 1995 y " + (anioActual + 1) + ".";
      break;
    case "capacidad":
      if (!esNumeroEntre(valor, 10, 120)) return "La capacidad debe ser un número entre 10 y 120.";
      break;
    case "vagones":
      if (!esNumeroEntre(valor, 2, 4)) return "Los vagones deben ser un número entre 2 y 4.";
      break;
  }
  return "";
}

// Revisa que un texto sea un número entero entre "minimo" y "maximo".
function esNumeroEntre(valor, minimo, maximo) {
  let numero = Number(valor);
  return Number.isInteger(numero) && numero >= minimo && numero <= maximo;
}

/*
   Valida TODOS los campos de una lista (por ejemplo camposDelRol("cliente")).
   "datos" es un objeto con lo que escribió la persona.
   Si encuentra un error devuelve { campo: "...", mensaje: "..." }.
   Si todo está bien devuelve null.
*/
function validarCampos(listaCampos, datos) {
  for (let i = 0; i < listaCampos.length; i++) {
    let campo = listaCampos[i];
    let valor = datos[campo.nombre];
    if (valor === undefined) valor = "";

    // 1) Si está vacío: error solo si es obligatorio.
    if (valor === "") {
      if (campo.requerido) {
        return { campo: campo.nombre, mensaje: campo.etiqueta + " es obligatorio." };
      }
      continue; // "continue" salta al siguiente campo
    }

    // 2) Si es una lista desplegable, el valor debe ser una de las opciones.
    if (campo.opciones && campo.opciones.indexOf(valor) === -1) {
      return { campo: campo.nombre, mensaje: "Selecciona una opción válida para " + campo.etiqueta.toLowerCase() + "." };
    }

    // 3) Reglas propias del campo.
    let mensaje = validarCampo(campo.nombre, valor);
    if (mensaje !== "") {
      return { campo: campo.nombre, mensaje: mensaje };
    }
  }
  return null;
}

/*
   Copia los valores del formulario al objeto (usuario o bus).
   Los campos de tipo "number" los convertimos en número.
*/
function copiarValores(objeto, listaCampos, datos) {
  for (let i = 0; i < listaCampos.length; i++) {
    let campo = listaCampos[i];
    let valor = datos[campo.nombre];
    if (valor === undefined) continue;
    if (campo.tipo === "number" && valor !== "") {
      valor = Number(valor);
    }
    objeto[campo.nombre] = valor;
  }
}


/* ================================================================
   FORMULARIOS: leer datos y mostrar errores
   ================================================================ */

/*
   Lee todos los <input> y <select> de un formulario y devuelve un objeto.
   Ejemplo: { correo: "ana@mail.com", contrasena: "12345678" }
   La propiedad "name" de cada input es la que usamos como nombre.
*/
function leerFormulario(formulario) {
  let datos = {};
  let campos = formulario.querySelectorAll("input, select");
  for (let i = 0; i < campos.length; i++) {
    let campo = campos[i];
    if (campo.name === "") continue;
    if (campo.type === "checkbox") {
      datos[campo.name] = campo.checked;
    } else {
      datos[campo.name] = campo.value.trim(); // trim() quita espacios al inicio y al final
    }
  }
  return datos;
}

// Quita los bordes rojos y el mensaje de error de un formulario.
function limpiarErrores(formulario) {
  let conError = formulario.querySelectorAll(".has-error");
  for (let i = 0; i < conError.length; i++) {
    conError[i].classList.remove("has-error");
  }
  let caja = formulario.querySelector(".auth-error");
  if (caja) caja.textContent = "";
}

/*
   Muestra un error en el formulario:
   - pinta de rojo el campo (la etiqueta que tiene data-campo="nombreCampo")
   - pone el cursor en ese campo
   - escribe el mensaje en el párrafo con clase "auth-error"
*/
function mostrarError(formulario, nombreCampo, mensaje) {
  limpiarErrores(formulario);
  if (nombreCampo) {
    let caja = formulario.querySelector('[data-campo="' + nombreCampo + '"]');
    if (caja) {
      caja.classList.add("has-error");
      let input = caja.querySelector("input, select");
      if (input) input.focus();
    }
  }
  let parrafo = formulario.querySelector(".auth-error");
  if (parrafo) {
    parrafo.textContent = mensaje;
  } else {
    mostrarMensaje(mensaje, "error");
  }
}

/*
   Crea el HTML de un campo (etiqueta + input o select) a partir de su
   descripción. Así no tenemos que escribir a mano cada formulario.
   "valor" es lo que debe aparecer escrito en el campo.
*/
function crearCampoHTML(campo, valor) {
  if (valor === undefined || valor === null) valor = "";

  let obligatorio = "";
  let asterisco = "";
  if (campo.requerido) {
    obligatorio = " required";
    asterisco = " <em>*</em>";
  }

  let control = "";
  if (campo.tipo === "select") {
    // Lista desplegable
    control = '<select name="' + campo.nombre + '"' + obligatorio + '>';
    if (!campo.requerido) {
      control += '<option value="">— Ninguna —</option>';
    }
    for (let i = 0; i < campo.opciones.length; i++) {
      let opcion = campo.opciones[i];
      let seleccionada = String(opcion) === String(valor) ? " selected" : "";
      control += '<option value="' + opcion + '"' + seleccionada + '>' + opcion + '</option>';
    }
    control += '</select>';
  } else {
    // Caja de texto normal
    control = '<input type="' + campo.tipo + '" name="' + campo.nombre + '" value="' + limpiarTexto(valor) + '"' + obligatorio + '>';
  }

  let ayuda = "";
  if (campo.ayuda) {
    ayuda = '<small>' + campo.ayuda + '</small>';
  }

  return '<label class="auth-field" data-campo="' + campo.nombre + '">' +
           '<span>' + campo.etiqueta + asterisco + '</span>' +
           control + ayuda +
         '</label>';
}

// Crea el HTML de varios campos. "objeto" trae los valores actuales (puede ser {}).
function crearCamposHTML(listaCampos, objeto) {
  let html = "";
  for (let i = 0; i < listaCampos.length; i++) {
    html += crearCampoHTML(listaCampos[i], objeto[listaCampos[i].nombre]);
  }
  return html;
}


/* ================================================================
   7. FUNCIONES DE AYUDA
   ================================================================ */

/*
   limpiarTexto: evita que alguien escriba código HTML en un campo
   (por ejemplo en su nombre) y dañe la página. Cambia los símbolos
   especiales por su versión "segura".
*/
function limpiarTexto(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Crea un identificador único usando la hora actual y un número al azar.
function generarId(prefijo) {
  return prefijo + "-" + Date.now() + "-" + Math.floor(Math.random() * 100000);
}

// "Laura Gómez" -> "LG"
function iniciales(nombre) {
  let partes = nombre.trim().split(" ");
  let resultado = partes[0].charAt(0);
  if (partes.length > 1) {
    resultado += partes[1].charAt(0);
  }
  return resultado.toUpperCase();
}

// "Laura Gómez" -> "Laura"
function primerNombre(nombre) {
  return nombre.trim().split(" ")[0];
}

// Convierte una fecha guardada en texto a algo legible: "4 oct 2026, 8:30 a. m."
function formatearFecha(fechaTexto) {
  if (!fechaTexto) return "—";
  let fecha = new Date(fechaTexto);
  return fecha.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}

// Calcula cuánto tiempo pasó entre dos fechas: "1 h 20 min" o "15 min".
// Si no se da "hasta", usa la hora actual.
function calcularDuracion(desde, hasta) {
  let fin = hasta ? new Date(hasta) : new Date();
  let minutos = Math.round((fin - new Date(desde)) / 60000); // 60000 milisegundos = 1 minuto
  if (minutos < 0) minutos = 0;
  let horas = Math.floor(minutos / 60);
  let resto = minutos % 60; // % da el residuo de la división
  if (horas > 0) {
    return horas + " h " + resto + " min";
  }
  return resto + " min";
}

/*
   MENSAJES FLOTANTES ("toast")
   Muestra un aviso en la esquina inferior derecha que desaparece solo.
   tipo: "exito" (verde), "error" (rojo), "aviso" (amarillo) o "info" (azul)
*/
function mostrarMensaje(texto, tipo, segundos) {
  if (!tipo) tipo = "info";
  if (!segundos) segundos = 4;

  // 1) Buscamos la caja que contiene los mensajes; si no existe la creamos.
  let contenedor = document.getElementById("mensajes");
  if (contenedor === null) {
    contenedor = document.createElement("div");
    contenedor.id = "mensajes";
    contenedor.className = "toast-stack";
    document.body.appendChild(contenedor);
  }

  // 2) Creamos el mensaje y lo agregamos.
  let mensaje = document.createElement("div");
  mensaje.className = "toast toast--" + tipo;
  mensaje.textContent = texto;
  contenedor.appendChild(mensaje);

  // 3) Un instante después le ponemos la clase que lo hace visible (animación).
  setTimeout(function () {
    mensaje.classList.add("is-visible");
  }, 20);

  // 4) Después de unos segundos lo ocultamos y luego lo borramos.
  setTimeout(function () {
    mensaje.classList.remove("is-visible");
    setTimeout(function () {
      mensaje.remove();
    }, 300);
  }, segundos * 1000);
}

/*
   Cambia el botón "Mi cuenta" del encabezado:
   - Si hay alguien conectado muestra sus iniciales y su primer nombre.
   - Si no, muestra "Mi cuenta".
*/
function actualizarBotonCuenta() {
  let boton = document.getElementById("botonCuenta");
  let usuario = usuarioConectado();
  if (usuario) {
    boton.classList.add("is-logged");
    boton.innerHTML = '<span class="account-avatar">' + limpiarTexto(iniciales(usuario.nombre)) + '</span>' + limpiarTexto(primerNombre(usuario.nombre));
    boton.title = usuario.nombre + " · " + NOMBRES_DE_ROL[usuario.rol];
  } else {
    boton.classList.remove("is-logged");
    boton.innerHTML = "● &nbsp; Mi cuenta";
    boton.title = "Iniciar sesión o crear cuenta";
  }
}

// Botón de idioma: cambia el texto ES / EN (la traducción es solo de ejemplo).
function cambiarIdioma() {
  let boton = document.getElementById("botonIdioma");
  if (boton.textContent.indexOf("ES") !== -1) {
    boton.innerHTML = "◎ &nbsp; EN⌄";
    mostrarMensaje("English version coming soon. La traducción estará disponible pronto.", "info");
  } else {
    boton.innerHTML = "◎ &nbsp; ES⌄";
    mostrarMensaje("Idioma: Español.", "info");
  }
}

// Íconos de redes sociales del pie de página.
function abrirRedSocial(nombre) {
  mostrarMensaje("Pronto podrás seguirnos en " + nombre + ".", "info");
}
