/* ================================================================
   inicio.js
   ----------------------------------------------------------------
   Todo lo que pasa en la PÁGINA DE INICIO (index.html):
     1. Menú, idioma y botón "Mi cuenta"
     2. Buscador de rutas
     3. Otros botones de la página (planificador, novedades...)
     4. Ventana de acceso: iniciar sesión, crear cuenta y
        recuperar contraseña
     5. Lo que se hace apenas carga la página

   Usa funciones y datos de datos.js (por eso datos.js se carga antes).
   ================================================================ */


/* ================================================================
   1. MENÚ Y BOTÓN "MI CUENTA"
   ================================================================ */

/*
   Se ejecuta al hacer clic en un enlace del menú.
   "enlace" es el <a> que tocaron (en el HTML lo pasamos con "this").
   El enlace mismo ya hace bajar la página hasta la sección (href="#...").
   Aquí solo marcamos cuál está activo y, si hay, mostramos un mensaje.
*/
function marcarMenu(enlace, mensaje) {
  let enlaces = document.querySelectorAll("#menuPrincipal a");
  for (let i = 0; i < enlaces.length; i++) {
    enlaces[i].classList.remove("active");
  }
  enlace.classList.add("active");

  if (mensaje) {
    mostrarMensaje(mensaje, "info", 6);
  }
}

// Botón "Mi cuenta": si ya inició sesión va a su cuenta; si no, abre la ventana de acceso.
function clicEnMiCuenta() {
  if (usuarioConectado()) {
    location.href = "cuenta.html"; // location.href cambia de página
  } else {
    abrirVentana("login");
  }
}


/* ================================================================
   2. BUSCADOR DE RUTAS
   ================================================================ */

/*
   Pinta la lista de rutas dentro del panel "Rutas".
   "lista"    -> las rutas que se van a mostrar
   "busqueda" -> el texto buscado (para cambiar el título)
*/
function mostrarRutas(lista, busqueda) {
  let titulo = document.getElementById("tituloRutas");
  let contenedor = document.getElementById("listaRutas");

  if (busqueda) {
    titulo.textContent = "Rutas hacia “" + busqueda + "”";
  } else {
    titulo.textContent = "Rutas más utilizadas";
  }

  // Si no hay rutas, mostramos un aviso y salimos de la función con "return".
  if (lista.length === 0) {
    contenedor.innerHTML = '<p class="route-empty">No encontramos rutas para “' + limpiarTexto(busqueda) +
      '”. Prueba con Centro, Terminal Sur o Universidad.</p>';
    return;
  }

  // Si la persona es un pasajero, marcamos con ★ sus rutas favoritas.
  let favoritas = [];
  let usuario = usuarioConectado();
  if (usuario && usuario.rol === "cliente") {
    favoritas = usuario.rutasFavoritas;
  }

  // Armamos el HTML de cada ruta y lo vamos sumando en "html".
  // Las comillas invertidas ` ` permiten meter variables con ${ }.
  let html = "";
  for (let i = 0; i < lista.length; i++) {
    let ruta = lista[i];
    let estrella = favoritas.indexOf(ruta.codigo) !== -1 ? "★ " : "";
    html += `
      <a class="route-row" href="#rutas" onclick="verDetalleRuta('${ruta.codigo}')">
        <span class="route-code ${ruta.color}">${ruta.codigo}</span>
        <span class="route-info"><b>${estrella}${nombreRuta(ruta)}</b><small>${ruta.paradas} paradas</small></span>
        <span class="route-time">${ruta.minutos} min<small>Tiempo estimado</small></span>
        <span>›</span>
      </a>`;
  }
  contenedor.innerHTML = html;
}

/*
   Busca las rutas que coinciden con el texto escrito en "Hasta".
   Compara contra el código, el origen, el destino y los lugares.
*/
function buscarRutas() {
  let texto = document.getElementById("destino").value.trim();
  let buscado = texto.toLowerCase();
  let encontradas = [];

  for (let i = 0; i < RUTAS.length; i++) {
    let ruta = RUTAS[i];
    // Juntamos todo el texto de la ruta en uno solo para buscar más fácil.
    let todoElTexto = (ruta.codigo + " " + ruta.origen + " " + ruta.destino + " " + ruta.lugares.join(" ")).toLowerCase();
    // indexOf devuelve -1 cuando NO encuentra el texto.
    if (todoElTexto.indexOf(buscado) !== -1) {
      encontradas.push(ruta);
    }
  }

  mostrarRutas(encontradas, texto);
  document.getElementById("rutas").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// Si la persona presiona Enter en el campo "Hasta", buscamos.
function teclaEnDestino(evento) {
  if (evento.key === "Enter") {
    buscarRutas();
  }
}

// Botones de "Búsquedas rápidas": escriben el lugar y buscan.
function busquedaRapida(lugar) {
  document.getElementById("destino").value = lugar;
  buscarRutas();
}

// "Ver todas" del panel de rutas: borra la búsqueda y muestra todas.
function verTodasLasRutas() {
  document.getElementById("destino").value = "";
  mostrarRutas(RUTAS, "");
}

// Al tocar una ruta mostramos su información.
function verDetalleRuta(codigo) {
  let ruta = buscarRuta(codigo);
  mostrarMensaje(ruta.codigo + ": " + nombreRuta(ruta) + " · " + ruta.paradas + " paradas · " + ruta.minutos +
    " min. Pasa por " + ruta.lugares.join(", ") + ".", "info", 6);
}

// Botón ⇄: intercambia lo que dice "Desde" con lo que dice "Hasta".
function intercambiar() {
  let origen = document.getElementById("origen");
  let destino = document.getElementById("destino");

  if (destino.value.trim() === "") {
    mostrarMensaje("Primero escribe a dónde vas.", "aviso");
    destino.focus();
    return;
  }

  let guardado = origen.textContent; // guardamos el origen en una variable temporal
  origen.textContent = destino.value;
  destino.value = guardado;
}

// Ícono ⌾ del campo "Desde": vuelve a poner "Ubicación actual".
function usarUbicacionActual() {
  document.getElementById("origen").textContent = "Ubicación actual";
  mostrarMensaje("Usaremos tu ubicación actual como punto de partida.", "info");
}


/* ================================================================
   3. OTROS BOTONES DE LA PÁGINA
   ================================================================ */

// "Planificar viaje": sube al buscador y pone el cursor en "Hasta".
function planificarViaje() {
  let destino = document.getElementById("destino");
  destino.scrollIntoView({ behavior: "smooth", block: "center" });
  destino.focus();
}

// Botón ↻: cambia la hora de "Actualizado" por la hora actual.
function actualizarEstado() {
  let hora = new Date().toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
  document.getElementById("horaActualizado").textContent = "Actualizado: Hoy, " + hora;
  mostrarMensaje("Estado del servicio actualizado.", "exito");
}

// "Ver todas" de novedades: muestra la novedad que estaba oculta.
function verTodasLasNovedades() {
  let extra = document.getElementById("novedadExtra");
  if (extra.hidden) {
    extra.hidden = false;
  } else {
    mostrarMensaje("No hay más novedades por ahora.", "info");
  }
}

// Tarjetas de beneficios
function beneficioTiempoReal() {
  document.getElementById("rutas").scrollIntoView({ behavior: "smooth" });
  mostrarMensaje("Elige una ruta para ver su tiempo estimado de llegada.", "info");
}

function beneficioAlertas() {
  if (usuarioConectado()) {
    mostrarMensaje("Ya recibes las alertas de tus rutas en tu cuenta.", "exito");
  } else {
    abrirVentana("registro");
  }
}

function beneficioFavoritos() {
  let usuario = usuarioConectado();
  if (usuario === null) {
    abrirVentana("login");
  } else if (usuario.rol === "cliente") {
    location.href = "cuenta.html#favoritos";
  } else {
    mostrarMensaje("Las rutas favoritas son para las cuentas de tipo Usuario (pasajero).", "aviso");
  }
}


/* ================================================================
   4. VENTANA DE ACCESO (MODAL)
   ================================================================ */

// Guarda los intentos de correos que NO existen (solo mientras la página está abierta).
let intentosDesconocidos = {};

// Correo de la persona que está recuperando su contraseña.
let correoEnRecuperacion = "";

// Muestra la ventana con la vista indicada: "login", "registro" o "recuperar".
function abrirVentana(vista) {
  document.getElementById("ventanaAcceso").hidden = false;
  document.body.classList.add("no-scroll"); // evita que la página de atrás se mueva
  cambiarVista(vista);
}

function cerrarVentana() {
  document.getElementById("ventanaAcceso").hidden = true;
  document.body.classList.remove("no-scroll");
}

// Si hacen clic en el fondo oscuro (fuera de la tarjeta blanca), se cierra.
function clicFueraDeLaVentana(evento) {
  if (evento.target.id === "ventanaAcceso") {
    cerrarVentana();
  }
}

// Muestra un formulario y oculta los otros dos.
function cambiarVista(vista) {
  let login = document.getElementById("formLogin");
  let registro = document.getElementById("formRegistro");
  let recuperar = document.getElementById("formRecuperar");

  login.hidden = (vista !== "login");
  registro.hidden = (vista !== "registro");
  recuperar.hidden = (vista !== "recuperar");

  limpiarErrores(login);
  limpiarErrores(registro);
  limpiarErrores(recuperar);

  // Pestañas: se marca la que corresponde. En "recuperar" se ocultan.
  document.getElementById("pestanas").hidden = (vista === "recuperar");
  if (vista === "login") {
    document.getElementById("pestanaLogin").classList.add("is-active");
    document.getElementById("pestanaRegistro").classList.remove("is-active");
  } else {
    document.getElementById("pestanaLogin").classList.remove("is-active");
    document.getElementById("pestanaRegistro").classList.add("is-active");
  }

  if (vista === "recuperar") {
    mostrarPasoRecuperacion(1);
  }

  // Ponemos el cursor en el primer campo del formulario visible.
  let formularioVisible = document.querySelector(".auth-form:not([hidden]) input");
  if (formularioVisible) formularioVisible.focus();
}

// Botón "Ver" / "Ocultar" de la contraseña.
function verContrasena(boton) {
  // previousElementSibling = el elemento que está justo antes del botón (el input)
  let input = boton.previousElementSibling;
  if (input.type === "password") {
    input.type = "text";
    boton.textContent = "Ocultar";
  } else {
    input.type = "password";
    boton.textContent = "Ver";
  }
}

// Pinta los botones de las cuentas de prueba dentro de la ventana.
function mostrarCuentasDePrueba() {
  let html = "";
  for (let i = 0; i < CUENTAS_DE_PRUEBA.length; i++) {
    let cuenta = CUENTAS_DE_PRUEBA[i];
    html += `
      <button type="button" onclick="usarCuentaDePrueba(${i})">
        <b>${NOMBRES_DE_ROL[cuenta.rol]}</b>
        <span>${cuenta.correo}</span>
      </button>`;
  }
  document.getElementById("listaCuentasPrueba").innerHTML = html;
}

// Llena el formulario con la cuenta de prueba elegida.
function usarCuentaDePrueba(posicion) {
  let cuenta = CUENTAS_DE_PRUEBA[posicion];
  let formulario = document.getElementById("formLogin");
  formulario.correo.value = cuenta.correo;
  formulario.contrasena.value = cuenta.contrasena;
  formulario.contrasena.focus();
}


/* ---------------- A) INICIAR SESIÓN (máximo 3 intentos) ---------------- */

function iniciarSesion(evento) {
  // preventDefault evita que el formulario recargue la página (su comportamiento normal).
  evento.preventDefault();

  let formulario = document.getElementById("formLogin");
  limpiarErrores(formulario);

  let correo = formulario.correo.value.trim().toLowerCase();
  let contrasena = formulario.contrasena.value;

  if (correo === "" || contrasena === "") {
    mostrarError(formulario, "", "Ingresa tu correo y tu contraseña.");
    return;
  }

  let usuario = buscarUsuarioPorCorreo(correo);

  // CASO 1: el correo no existe. Contamos el intento igual.
  if (usuario === null) {
    if (!intentosDesconocidos[correo]) {
      intentosDesconocidos[correo] = 0;
    }
    intentosDesconocidos[correo] = intentosDesconocidos[correo] + 1;
    let restantes = Math.max(0, MAX_INTENTOS - intentosDesconocidos[correo]);

    if (restantes === 0) {
      falloAlIniciar(formulario, 0, true, "Superaste los 3 intentos permitidos. Recarga la página o recupera tu contraseña.");
    } else {
      falloAlIniciar(formulario, restantes, false, "Correo o contraseña incorrectos.");
    }
    return;
  }

  // CASO 2: la cuenta está bloqueada.
  if (usuario.bloqueado) {
    falloAlIniciar(formulario, 0, true, "Cuenta bloqueada por superar 3 intentos fallidos. Recupera tu contraseña para desbloquearla.");
    return;
  }

  // CASO 3: la contraseña está mal. Sumamos un intento fallido.
  if (usuario.contrasena !== contrasena) {
    usuario.intentosFallidos = usuario.intentosFallidos + 1;

    if (usuario.intentosFallidos >= MAX_INTENTOS) {
      usuario.bloqueado = true;
      guardarUsuarios();
      falloAlIniciar(formulario, 0, true, "Superaste los 3 intentos permitidos. Tu cuenta fue bloqueada.");
    } else {
      guardarUsuarios();
      falloAlIniciar(formulario, MAX_INTENTOS - usuario.intentosFallidos, false, "Correo o contraseña incorrectos.");
    }
    return;
  }

  // CASO 4: ¡todo bien! Guardamos la sesión y vamos a "Mi cuenta".
  usuario.intentosFallidos = 0;
  usuario.ultimoAcceso = new Date().toISOString();
  guardarUsuarios();
  guardarDato("sesion", usuario.id);

  document.getElementById("cajaIntentos").hidden = true;
  formulario.reset(); // reset() borra lo escrito en el formulario
  mostrarMensaje("¡Hola, " + primerNombre(usuario.nombre) + "! Sesión iniciada como " + NOMBRES_DE_ROL[usuario.rol] + ".", "exito");
  cerrarVentana();
  actualizarBotonCuenta();

  // Esperamos 0,7 segundos para que se alcance a leer el mensaje y cambiamos de página.
  setTimeout(function () {
    location.href = "cuenta.html";
  }, 700);
}

// Muestra el error del inicio de sesión y los puntos de intentos.
function falloAlIniciar(formulario, restantes, bloqueado, mensaje) {
  mostrarIntentos(restantes, bloqueado);
  mostrarError(formulario, "", mensaje);
  formulario.contrasena.value = "";
  formulario.contrasena.focus();
}

// Dibuja los 3 puntos: verde = intento disponible, rojo = intento usado.
function mostrarIntentos(restantes, bloqueado) {
  let caja = document.getElementById("cajaIntentos");
  let usados = MAX_INTENTOS - restantes;

  let puntos = "";
  for (let i = 0; i < MAX_INTENTOS; i++) {
    if (i < usados) {
      puntos += '<i class="is-used"></i>';
    } else {
      puntos += '<i></i>';
    }
  }

  caja.hidden = false;

  if (bloqueado) {
    caja.classList.add("is-locked");
    caja.innerHTML = '<span class="auth-dots">' + puntos + '</span> Acceso bloqueado. ' +
      '<button type="button" class="auth-link" onclick="cambiarVista(\'recuperar\')">Recuperar contraseña</button>';
  } else {
    caja.classList.remove("is-locked");
    let texto = restantes === 1 ? "Te queda 1 intento" : "Te quedan " + restantes + " intentos";
    caja.innerHTML = '<span class="auth-dots">' + puntos + '</span> ' + texto + ' de ' + MAX_INTENTOS + '.';
  }
}


/* ---------------- B) CREAR CUENTA ---------------- */

function crearCuenta(evento) {
  evento.preventDefault();
  let formulario = document.getElementById("formRegistro");
  let datos = leerFormulario(formulario);
  datos.correo = datos.correo.toLowerCase();

  // Revisamos cada cosa en orden. Si algo falla, mostramos el error y paramos (return).
  let error = validarCampos(camposDelRol("cliente"), datos);
  if (error) {
    mostrarError(formulario, error.campo, error.mensaje);
    return;
  }

  let errorCorreo = validarCorreo(datos.correo);
  if (errorCorreo) {
    mostrarError(formulario, "correo", errorCorreo);
    return;
  }

  if (buscarUsuarioPorCorreo(datos.correo)) {
    mostrarError(formulario, "correo", "Ya existe una cuenta con ese correo.");
    return;
  }

  let errorContrasena = validarContrasena(datos.contrasena);
  if (errorContrasena) {
    mostrarError(formulario, "contrasena", errorContrasena);
    return;
  }

  if (datos.contrasena !== datos.confirmar) {
    mostrarError(formulario, "confirmar", "Las contraseñas no coinciden.");
    return;
  }

  if (!datos.terminos) {
    mostrarError(formulario, "terminos", "Debes aceptar los términos y la política de datos.");
    return;
  }

  // Todo está bien: creamos el usuario como "cliente" y lo guardamos.
  // El administrador luego le puede cambiar el rol desde "Gestión de usuarios".
  let nuevo = crearUsuario("cliente", datos);
  usuarios.push(nuevo);
  guardarUsuarios();

  formulario.reset();
  mostrarMensaje("¡Cuenta creada, " + primerNombre(nuevo.nombre) + "! Ya puedes iniciar sesión.", "exito");

  // Pasamos a "Iniciar sesión" con el correo ya escrito.
  cambiarVista("login");
  document.getElementById("formLogin").correo.value = nuevo.correo;
  document.getElementById("formLogin").contrasena.focus();
}


/* ---------------- C) RECUPERAR CONTRASEÑA (2 pasos) ---------------- */

// Muestra el paso 1 o el paso 2 del formulario.
function mostrarPasoRecuperacion(paso) {
  let formulario = document.getElementById("formRecuperar");
  document.getElementById("pasoUno").hidden = (paso !== 1);
  document.getElementById("pasoDos").hidden = (paso !== 2);
  formulario.dataset.paso = paso; // guardamos en qué paso vamos (atributo data-paso)

  let boton = document.getElementById("botonRecuperar");
  if (paso === 1) {
    boton.textContent = "Enviar código";
    formulario.reset();
    correoEnRecuperacion = "";
  } else {
    boton.textContent = "Restablecer contraseña";
  }
}

function recuperarContrasena(evento) {
  evento.preventDefault();
  let formulario = document.getElementById("formRecuperar");
  limpiarErrores(formulario);
  let datos = leerFormulario(formulario);

  if (formulario.dataset.paso === "1") {
    pasoUnoEnviarCodigo(formulario, datos);
  } else {
    pasoDosCambiarContrasena(formulario, datos);
  }
}

// PASO 1: revisa el correo y "envía" un código de 6 dígitos.
function pasoUnoEnviarCodigo(formulario, datos) {
  let correo = datos.correo.toLowerCase();

  let errorCorreo = validarCorreo(correo);
  if (errorCorreo) {
    mostrarError(formulario, "correo", errorCorreo);
    return;
  }

  let usuario = buscarUsuarioPorCorreo(correo);
  if (usuario === null) {
    mostrarError(formulario, "correo", "No encontramos una cuenta con ese correo.");
    return;
  }

  // Número al azar entre 100000 y 999999.
  let codigo = String(Math.floor(100000 + Math.random() * 900000));
  usuario.codigoRecuperacion = codigo;
  usuario.codigoVence = Date.now() + 10 * 60000; // vence en 10 minutos
  guardarUsuarios();
  correoEnRecuperacion = correo;

  mostrarPasoRecuperacion(2);
  document.getElementById("textoCodigoEnviado").innerHTML =
    "Enviamos un código a <b>" + limpiarTexto(correo) + "</b>. Vence en 10 minutos.";

  // No enviamos correos de verdad: mostramos el código en pantalla (simulación).
  mostrarMensaje("📧 Correo simulado · Tu código de recuperación es " + codigo, "info", 15);
  formulario.codigo.focus();
}

// PASO 2: revisa el código y guarda la nueva contraseña.
function pasoDosCambiarContrasena(formulario, datos) {
  let usuario = buscarUsuarioPorCorreo(correoEnRecuperacion);

  if (datos.nueva !== datos.confirmar) {
    mostrarError(formulario, "confirmar", "Las contraseñas no coinciden.");
    return;
  }

  if (Date.now() > usuario.codigoVence) {
    mostrarError(formulario, "codigo", "El código expiró. Solicita uno nuevo.");
    return;
  }

  if (datos.codigo !== usuario.codigoRecuperacion) {
    mostrarError(formulario, "codigo", "El código no es correcto.");
    return;
  }

  let errorContrasena = validarContrasena(datos.nueva);
  if (errorContrasena) {
    mostrarError(formulario, "nueva", errorContrasena);
    return;
  }

  // Guardamos la nueva contraseña y desbloqueamos la cuenta.
  usuario.contrasena = datos.nueva;
  usuario.codigoRecuperacion = null;
  usuario.codigoVence = null;
  usuario.intentosFallidos = 0;
  usuario.bloqueado = false;
  guardarUsuarios();
  delete intentosDesconocidos[usuario.correo]; // "delete" borra una propiedad del objeto

  mostrarMensaje("Contraseña actualizada y cuenta desbloqueada. Inicia sesión.", "exito");
  cambiarVista("login");
  document.getElementById("cajaIntentos").hidden = true;
  document.getElementById("formLogin").correo.value = usuario.correo;
  document.getElementById("formLogin").contrasena.focus();
}


/* ================================================================
   5. AL CARGAR LA PÁGINA
   ----------------------------------------------------------------
   Este código se ejecuta UNA vez, apenas se abre la página.
   ================================================================ */

actualizarBotonCuenta();      // muestra el nombre si hay sesión
mostrarRutas(RUTAS, "");      // pinta las rutas
mostrarCuentasDePrueba();     // pinta las cuentas de prueba en la ventana

// Tecla Escape: cierra la ventana de acceso si está abierta.
document.addEventListener("keydown", function (evento) {
  if (evento.key === "Escape") {
    cerrarVentana();
  }
});

// Si la dirección termina en "?login=1" (nos mandaron desde cuenta.html), abrimos la ventana.
if (location.search.indexOf("login=1") !== -1) {
  abrirVentana("login");
}
