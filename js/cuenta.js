/* ================================================================
   cuenta.js
   ----------------------------------------------------------------
   Todo lo que pasa en la página "MI CUENTA" (cuenta.html).

   Cada rol ve un menú distinto:
     Todos          -> Mi perfil, Seguridad
     Usuario        -> + Rutas favoritas
     Administrador  -> + Gestión de usuarios (aquí ASIGNA ROLES) y Flota
     Operativo      -> + Centro de control y Estado de la flota
     Conductor      -> + Mi bus y turno
     Propietario    -> + Mis buses

   Cómo funciona:
     - Cada sección es una función que DEVUELVE un texto con HTML
       (por ejemplo seccionPerfil()).
     - mostrarSeccion() toma ese HTML y lo pone dentro de <section id="contenido">.
     - Cuando algo cambia (guardar, borrar, etc.) volvemos a llamar a
       mostrarSeccion() para que la pantalla se actualice.

   Usamos comillas invertidas ` ` para escribir HTML largo.
   Dentro de ellas, ${variable} pone el valor de la variable en el texto.
   ================================================================ */


/* ================================================================
   1. ¿QUIÉN ESTÁ CONECTADO?
   ================================================================ */

let usuario = usuarioConectado();

// Si nadie inició sesión, lo mandamos a la página de inicio para que entre.
// location.replace cambia de página sin dejar esta en el historial.
if (usuario === null) {
  location.replace("index.html?login=1");
}

// Variables que recuerdan el estado de la pantalla:
let vistaActual = "perfil"; // sección que se está viendo
let filtroTexto = "";       // texto del buscador de usuarios (administrador)
let filtroRol = "";         // rol elegido en el filtro de usuarios (administrador)
let busEditando = null;     // id del bus que el propietario está modificando

// Dirección del tablero del centro de control (otra carpeta del proyecto).
const RUTA_CENTRO_CONTROL = "../mockup Operacion/mockup Ubic/html/index.html";


/* ================================================================
   2. MENÚ LATERAL
   ================================================================ */

// Devuelve la lista de opciones del menú según el rol del usuario.
function menuDelUsuario() {
  let menu = [{ id: "perfil", texto: "Mi perfil", icono: "◉" }];

  if (usuario.rol === "cliente") {
    menu.push({ id: "favoritos", texto: "Rutas favoritas", icono: "★" });
  }
  if (usuario.rol === "administrador") {
    menu.push({ id: "usuarios", texto: "Gestión de usuarios", icono: "◎" });
    menu.push({ id: "flota", texto: "Flota", icono: "▣" });
  }
  if (usuario.rol === "operativo") {
    menu.push({ id: "control", texto: "Centro de control", icono: "◈" });
    menu.push({ id: "flota", texto: "Estado de la flota", icono: "▣" });
  }
  if (usuario.rol === "conductor") {
    menu.push({ id: "mibus", texto: "Mi bus y turno", icono: "▣" });
  }
  if (usuario.rol === "propietario") {
    menu.push({ id: "misbuses", texto: "Mis buses", icono: "▣" });
  }

  menu.push({ id: "seguridad", texto: "Seguridad", icono: "⚿" });
  return menu;
}

// Pinta la columna izquierda: avatar, nombre, rol, menú y botón de salir.
function mostrarMenuLateral() {
  let botones = "";
  let menu = menuDelUsuario();
  for (let i = 0; i < menu.length; i++) {
    let opcion = menu[i];
    let activo = opcion.id === vistaActual ? "is-active" : "";
    botones += `
      <button type="button" class="${activo}" onclick="irA('${opcion.id}')">
        <span>${opcion.icono}</span>${opcion.texto}
      </button>`;
  }

  document.getElementById("menuLateral").innerHTML = `
    <div class="acc-profile">
      <div class="acc-avatar acc-avatar--${usuario.rol}">${limpiarTexto(iniciales(usuario.nombre))}</div>
      <b>${limpiarTexto(usuario.nombre)}</b>
      <span>${limpiarTexto(usuario.correo)}</span>
      <em class="acc-role acc-role--${usuario.rol}">${NOMBRES_DE_ROL[usuario.rol]}</em>
      <p>${limpiarTexto(descripcionDelRol(usuario))}</p>
    </div>
    <nav class="acc-menu">${botones}</nav>
    <button type="button" class="acc-logout" onclick="cerrarSesion()">⏻ &nbsp; Cerrar sesión</button>`;
}

// Pone en la parte derecha el HTML de la sección elegida.
function mostrarSeccion() {
  let html = "";

  // "switch" compara vistaActual con cada "case" y ejecuta el que coincida.
  switch (vistaActual) {
    case "perfil":    html = seccionPerfil(); break;
    case "seguridad": html = seccionSeguridad(); break;
    case "favoritos": html = seccionFavoritos(); break;
    case "usuarios":  html = seccionUsuarios(); break;
    case "flota":     html = seccionFlota(); break;
    case "control":   html = seccionControl(); break;
    case "mibus":     html = seccionMiBus(); break;
    case "misbuses":  html = seccionMisBuses(); break;
  }

  document.getElementById("contenido").innerHTML = html;
}

// Actualiza todo: botón del encabezado, menú y sección.
function mostrarTodo() {
  actualizarBotonCuenta();
  mostrarMenuLateral();
  mostrarSeccion();
}

// Cambia de sección (se usa en los botones del menú).
function irA(vista) {
  vistaActual = vista;
  busEditando = null;
  location.hash = vista; // agrega "#perfil", "#flota"... al final de la dirección
  mostrarMenuLateral();
  mostrarSeccion();
  document.getElementById("contenido").scrollIntoView({ behavior: "smooth", block: "start" });
}

function cerrarSesion() {
  mostrarMensaje("Hasta pronto, " + primerNombre(usuario.nombre) + ".", "info");
  borrarDato("sesion");
  setTimeout(function () {
    location.href = "index.html";
  }, 600);
}


/* ================================================================
   3. PIEZAS QUE SE REPITEN EN VARIAS SECCIONES
   ================================================================ */

// Título y subtítulo de cada sección. "extra" es algo opcional a la derecha.
function cabecera(titulo, subtitulo, extra) {
  return `
    <header class="acc-head">
      <div><h1>${titulo}</h1><p>${subtitulo}</p></div>
      ${extra || ""}
    </header>`;
}

/*
   Fila de tarjetitas con números (KPI).
   Recibe una lista así: [ ["Total", 5, "is-main"], ["Activos", 3] ]
   El tercer valor es opcional: "is-main" pinta la tarjeta de verde oscuro.
*/
function tarjetasDeDatos(lista) {
  let html = '<div class="acc-kpis">';
  for (let i = 0; i < lista.length; i++) {
    let etiqueta = lista[i][0];
    let valor = lista[i][1];
    let clase = lista[i][2] || "";
    html += `<div class="acc-kpi ${clase}"><span>${etiqueta}</span><b>${valor}</b></div>`;
  }
  return html + '</div>';
}

// Etiqueta de color para un estado: verde, amarillo o rojo.
function etiquetaEstado(texto) {
  let color = "info";
  if (texto === "Activo") color = "ok";
  if (texto === "En mantenimiento") color = "warn";
  if (texto === "Inactivo" || texto === "Bloqueado") color = "off";
  return `<span class="acc-badge acc-badge--${color}">${texto}</span>`;
}

// Opciones (<option>) de una lista desplegable. Marca como elegida la que sea igual a "elegida".
function opcionesHTML(valores, textos, elegida) {
  let html = "";
  for (let i = 0; i < valores.length; i++) {
    let seleccion = valores[i] === elegida ? " selected" : "";
    html += `<option value="${valores[i]}"${seleccion}>${textos[i]}</option>`;
  }
  return html;
}

// Lista con los nombres en pantalla de todos los roles (en el mismo orden que LISTA_DE_ROLES).
function textosDeRoles() {
  let textos = [];
  for (let i = 0; i < LISTA_DE_ROLES.length; i++) {
    textos.push(NOMBRES_DE_ROL[LISTA_DE_ROLES[i]]);
  }
  return textos;
}


/* ================================================================
   4. SECCIONES PARA TODOS LOS ROLES
   ================================================================ */

/* ---------------- MI PERFIL ---------------- */

function seccionPerfil() {
  // Los campos cambian según el rol (ver camposDelRol en datos.js).
  let campos = crearCamposHTML(camposDelRol(usuario.rol), usuario);

  return `
    ${cabecera("Mi perfil", "Mantén tu información personal actualizada.")}
    <form class="acc-card" id="formPerfil" onsubmit="guardarPerfil(event)" novalidate>
      <div class="acc-grid">
        <label class="auth-field"><span>Correo electrónico</span>
          <input type="email" value="${limpiarTexto(usuario.correo)}" readonly>
          <small>El correo identifica tu cuenta y no se puede cambiar.</small>
        </label>
        ${campos}
      </div>
      <p class="auth-error"></p>
      <div class="acc-actions">
        <button type="button" class="btn-ghost" onclick="mostrarSeccion()">Descartar</button>
        <button type="submit" class="primary-btn">Guardar cambios</button>
      </div>
    </form>`;
}

function guardarPerfil(evento) {
  evento.preventDefault();
  let formulario = document.getElementById("formPerfil");
  let datos = leerFormulario(formulario);
  let campos = camposDelRol(usuario.rol);

  let error = validarCampos(campos, datos);
  if (error) {
    mostrarError(formulario, error.campo, error.mensaje);
    return;
  }

  copiarValores(usuario, campos, datos);
  guardarUsuarios();
  mostrarMensaje("Perfil actualizado.", "exito");
  mostrarTodo();
}

/* ---------------- SEGURIDAD ---------------- */

function seccionSeguridad() {
  return `
    ${cabecera("Seguridad", "Gestiona tu contraseña y revisa la actividad de tu cuenta.")}
    ${tarjetasDeDatos([
      ["Último acceso", formatearFecha(usuario.ultimoAcceso)],
      ["Miembro desde", formatearFecha(usuario.fechaRegistro)],
      ["Intentos permitidos", MAX_INTENTOS + " por inicio de sesión"]
    ])}
    <form class="acc-card" id="formContrasena" onsubmit="cambiarContrasena(event)" novalidate>
      <h2>Cambiar contraseña</h2>
      <div class="acc-grid">
        <label class="auth-field" data-campo="actual"><span>Contraseña actual <em>*</em></span><input type="password" name="actual"></label>
        <span></span>
        <label class="auth-field" data-campo="nueva"><span>Nueva contraseña <em>*</em></span><input type="password" name="nueva"><small>Mínimo 8 caracteres; puede ser solo números.</small></label>
        <label class="auth-field" data-campo="confirmar"><span>Confirmar contraseña <em>*</em></span><input type="password" name="confirmar"></label>
      </div>
      <p class="auth-error"></p>
      <div class="acc-actions"><button type="submit" class="primary-btn">Actualizar contraseña</button></div>
    </form>`;
}

function cambiarContrasena(evento) {
  evento.preventDefault();
  let formulario = document.getElementById("formContrasena");
  let datos = leerFormulario(formulario);

  if (datos.nueva !== datos.confirmar) {
    mostrarError(formulario, "confirmar", "Las contraseñas no coinciden.");
    return;
  }
  if (datos.actual !== usuario.contrasena) {
    mostrarError(formulario, "actual", "La contraseña actual no es correcta.");
    return;
  }
  let errorContrasena = validarContrasena(datos.nueva);
  if (errorContrasena) {
    mostrarError(formulario, "nueva", errorContrasena);
    return;
  }
  if (datos.nueva === datos.actual) {
    mostrarError(formulario, "nueva", "La nueva contraseña debe ser diferente a la actual.");
    return;
  }

  usuario.contrasena = datos.nueva;
  guardarUsuarios();
  formulario.reset();
  limpiarErrores(formulario);
  mostrarMensaje("Tu contraseña fue actualizada.", "exito");
}


/* ================================================================
   5. USUARIO (PASAJERO): RUTAS FAVORITAS
   ================================================================ */

function seccionFavoritos() {
  let filas = "";
  for (let i = 0; i < RUTAS.length; i++) {
    let ruta = RUTAS[i];
    let esFavorita = usuario.rutasFavoritas.indexOf(ruta.codigo) !== -1;
    filas += `
      <div class="route-row">
        <span class="route-code ${ruta.color}">${ruta.codigo}</span>
        <span class="route-info"><b>${nombreRuta(ruta)}</b><small>${ruta.paradas} paradas · pasa por ${ruta.lugares.join(", ")}</small></span>
        <span class="route-time">${ruta.minutos} min<small>Tiempo estimado</small></span>
        <button type="button" class="fav-btn ${esFavorita ? "is-on" : ""}" onclick="alternarFavorita('${ruta.codigo}')"
          title="${esFavorita ? "Quitar de favoritas" : "Agregar a favoritas"}">${esFavorita ? "★" : "☆"}</button>
      </div>`;
  }

  return `
    ${cabecera("Rutas favoritas", "Marca con ★ las rutas que usas con frecuencia para tenerlas a mano.",
      `<span class="acc-badge acc-badge--info">${usuario.rutasFavoritas.length} guardadas</span>`)}
    <div class="acc-card acc-card--flush">${filas}</div>`;
}

// Si la ruta es favorita la quita; si no, la agrega.
function alternarFavorita(codigo) {
  let posicion = usuario.rutasFavoritas.indexOf(codigo);
  if (posicion === -1) {
    usuario.rutasFavoritas.push(codigo);
    mostrarMensaje("Ruta " + codigo + " agregada a favoritas.", "info");
  } else {
    usuario.rutasFavoritas.splice(posicion, 1); // splice(posición, 1) borra 1 elemento de la lista
    mostrarMensaje("Ruta " + codigo + " eliminada de favoritas.", "info");
  }
  guardarUsuarios();
  mostrarSeccion();
}


/* ================================================================
   6. ADMINISTRADOR: GESTIÓN DE USUARIOS Y ROLES
   ================================================================ */

function seccionUsuarios() {
  // Contamos cuántos usuarios hay de cada rol para las tarjetas de arriba.
  let tarjetas = [["Total", usuarios.length, "is-main"]];
  for (let i = 0; i < LISTA_DE_ROLES.length; i++) {
    let rol = LISTA_DE_ROLES[i];
    tarjetas.push([NOMBRES_DE_ROL[rol], usuariosDelRol(rol).length]);
  }

  return `
    ${cabecera("Gestión de usuarios", "Asigna roles, bloquea o elimina cuentas y registra nuevos actores.")}
    ${tarjetasDeDatos(tarjetas)}

    <div class="acc-card">
      <h2>Usuarios registrados</h2>
      <p class="auth-hint">Las personas que se registran desde la página entran como "Usuario". Cambia su rol con la lista de la columna <b>Rol</b>.</p>
      <br>
      <div class="acc-toolbar">
        <input type="search" placeholder="Buscar por nombre, correo o documento" value="${limpiarTexto(filtroTexto)}" oninput="filtrarUsuarios(this.value, null)">
        <select onchange="filtrarUsuarios(null, this.value)">
          <option value="">Todos los roles</option>
          ${opcionesHTML(LISTA_DE_ROLES, textosDeRoles(), filtroRol)}
        </select>
      </div>
      <div class="acc-table-wrap">
        <table class="acc-table">
          <thead><tr><th>Nombre</th><th>Rol</th><th>Documento</th><th>Estado</th><th>Último acceso</th><th></th></tr></thead>
          <tbody id="tablaUsuarios">${filasDeUsuarios()}</tbody>
        </table>
      </div>
    </div>

    <form class="acc-card" id="formNuevoActor" onsubmit="crearActor(event)" novalidate>
      <h2>Registrar nuevo actor</h2>
      <div class="acc-grid">
        <label class="auth-field"><span>Rol <em>*</em></span>
          <select name="rol" onchange="cambiarCamposNuevoActor(this.value)">
            ${opcionesHTML(LISTA_DE_ROLES, textosDeRoles(), "cliente")}
          </select>
        </label>
        <label class="auth-field" data-campo="correo"><span>Correo <em>*</em></span><input type="email" name="correo"></label>
        <label class="auth-field" data-campo="contrasena"><span>Contraseña temporal <em>*</em></span><input type="text" name="contrasena"><small>Mínimo 8 caracteres; puede ser solo números.</small></label>
      </div>
      <div class="acc-grid" id="camposNuevoActor">${crearCamposHTML(camposDelRol("cliente"), {})}</div>
      <p class="auth-error"></p>
      <div class="acc-actions">
        <button type="button" class="btn-ghost" onclick="mostrarSeccion()">Limpiar</button>
        <button type="submit" class="primary-btn">Crear cuenta</button>
      </div>
    </form>`;
}

// Crea las filas de la tabla de usuarios aplicando los filtros.
function filasDeUsuarios() {
  let buscado = filtroTexto.toLowerCase();
  let lista = [];

  // 1) Filtramos
  for (let i = 0; i < usuarios.length; i++) {
    let u = usuarios[i];
    let pasaRol = filtroRol === "" || u.rol === filtroRol;
    let pasaTexto = buscado === "" ||
      u.nombre.toLowerCase().indexOf(buscado) !== -1 ||
      u.correo.indexOf(buscado) !== -1 ||
      u.documento.indexOf(buscado) !== -1;
    if (pasaRol && pasaTexto) {
      lista.push(u);
    }
  }

  // 2) Ordenamos por nombre (localeCompare compara textos en orden alfabético)
  lista.sort(function (a, b) {
    return a.nombre.localeCompare(b.nombre);
  });

  if (lista.length === 0) {
    return '<tr><td colspan="6" class="acc-empty">No hay usuarios con ese filtro.</td></tr>';
  }

  // 3) Armamos el HTML de cada fila
  let html = "";
  for (let i = 0; i < lista.length; i++) {
    let u = lista[i];
    let soyYo = u.id === usuario.id;

    // Columna "Rol": a los demás se les puede cambiar con una lista; a mí mismo no.
    let columnaRol = "";
    if (soyYo) {
      columnaRol = `<em class="acc-role acc-role--${u.rol}">${NOMBRES_DE_ROL[u.rol]}</em>`;
    } else {
      columnaRol = `
        <select class="acc-select-sm" onchange="cambiarRol('${u.id}', this.value)" title="Asignar rol">
          ${opcionesHTML(LISTA_DE_ROLES, textosDeRoles(), u.rol)}
        </select>`;
    }

    // Botones de bloquear y eliminar (no aparecen en mi propia fila).
    let botones = "";
    if (!soyYo) {
      botones = `
        <button type="button" class="btn-small" onclick="cambiarBloqueo('${u.id}')">${u.bloqueado ? "Desbloquear" : "Bloquear"}</button>
        <button type="button" class="btn-small btn-danger" onclick="eliminarUsuario('${u.id}')">Eliminar</button>`;
    }

    html += `
      <tr>
        <td><div class="acc-cell-user">
          <span class="acc-mini acc-avatar--${u.rol}">${limpiarTexto(iniciales(u.nombre))}</span>
          <div><b>${limpiarTexto(u.nombre)}${soyYo ? " (tú)" : ""}</b><small>${limpiarTexto(u.correo)}</small></div>
        </div></td>
        <td>${columnaRol}</td>
        <td>${limpiarTexto(u.documento || "—")}</td>
        <td>${u.bloqueado ? etiquetaEstado("Bloqueado") : etiquetaEstado("Activo")}</td>
        <td><small>${formatearFecha(u.ultimoAcceso)}</small></td>
        <td class="acc-row-actions">${botones}</td>
      </tr>`;
  }
  return html;
}

/*
   Filtros de la tabla. Solo cambiamos las filas (no toda la sección)
   para que el cursor no se salga del buscador mientras se escribe.
   Si un valor llega como null, ese filtro no cambia.
*/
function filtrarUsuarios(texto, rol) {
  if (texto !== null) filtroTexto = texto;
  if (rol !== null) filtroRol = rol;
  document.getElementById("tablaUsuarios").innerHTML = filasDeUsuarios();
}

/*
   ASIGNAR ROL
   El administrador elige un rol nuevo en la lista de la tabla.
   Reglas para no dañar los datos:
     - Si era conductor y está en un turno, no se puede cambiar.
       Si no está en turno, se le quita de los buses que manejaba.
     - Si era propietario y tiene buses, primero hay que eliminarlos.
*/
function cambiarRol(id, nuevoRol) {
  let persona = buscarUsuarioPorId(id);
  if (persona === null || persona.rol === nuevoRol) return;

  // Revisamos los buses relacionados con esta persona.
  for (let i = 0; i < buses.length; i++) {
    let bus = buses[i];
    if (persona.rol === "conductor" && bus.conductorId === id && bus.turnoInicio) {
      mostrarMensaje(persona.nombre + " tiene un turno activo en el bus " + bus.placa + ". Debe cerrarlo antes.", "error");
      mostrarSeccion(); // volvemos a pintar para que la lista muestre el rol anterior
      return;
    }
    if (persona.rol === "propietario" && bus.propietarioId === id) {
      mostrarMensaje(persona.nombre + " tiene buses registrados. Elimínalos antes de cambiar su rol.", "error");
      mostrarSeccion();
      return;
    }
  }

  // confirm() muestra una pregunta con "Aceptar" y "Cancelar". Devuelve true si aceptan.
  let pregunta = "¿Cambiar el rol de " + persona.nombre + " de " + NOMBRES_DE_ROL[persona.rol] + " a " + NOMBRES_DE_ROL[nuevoRol] + "?";
  if (!confirm(pregunta)) {
    mostrarSeccion();
    return;
  }

  // Si era conductor, lo quitamos de los buses que tenía asignados.
  if (persona.rol === "conductor") {
    for (let i = 0; i < buses.length; i++) {
      if (buses[i].conductorId === id) {
        buses[i].conductorId = null;
      }
    }
    guardarBuses();
  }

  persona.rol = nuevoRol;
  agregarDatosDelRol(persona, persona); // le agrega los datos propios del nuevo rol
  guardarUsuarios();

  mostrarMensaje(persona.nombre + " ahora es " + NOMBRES_DE_ROL[nuevoRol] + ". Podrá completar los datos de su rol en \"Mi perfil\".", "exito", 6);
  mostrarSeccion();
}

// Bloquear o desbloquear una cuenta.
function cambiarBloqueo(id) {
  let persona = buscarUsuarioPorId(id);
  if (persona.bloqueado) {
    persona.bloqueado = false;
    persona.intentosFallidos = 0;
    mostrarMensaje(persona.nombre + " fue desbloqueado.", "info");
  } else {
    persona.bloqueado = true;
    mostrarMensaje(persona.nombre + " fue bloqueado.", "info");
  }
  guardarUsuarios();
  mostrarSeccion();
}

function eliminarUsuario(id) {
  let persona = buscarUsuarioPorId(id);

  // No dejamos borrar a quien tenga buses o un turno abierto.
  for (let i = 0; i < buses.length; i++) {
    if (buses[i].propietarioId === id) {
      mostrarMensaje(persona.nombre + " tiene buses registrados. Elimínalos primero.", "error");
      return;
    }
    if (buses[i].conductorId === id && buses[i].turnoInicio) {
      mostrarMensaje(persona.nombre + " tiene un turno activo. Debe cerrarlo primero.", "error");
      return;
    }
  }

  if (!confirm("¿Eliminar la cuenta de " + persona.nombre + "? Esta acción no se puede deshacer.")) return;

  // Si era conductor de algún bus, ese bus queda sin conductor.
  for (let i = 0; i < buses.length; i++) {
    if (buses[i].conductorId === id) buses[i].conductorId = null;
  }
  guardarBuses();

  // filter crea una lista nueva SIN la persona eliminada.
  usuarios = usuarios.filter(function (u) {
    return u.id !== id;
  });
  guardarUsuarios();

  mostrarMensaje("Cuenta de " + persona.nombre + " eliminada.", "info");
  mostrarSeccion();
}

// Cuando cambian el rol en "Registrar nuevo actor", cambian los campos.
function cambiarCamposNuevoActor(rol) {
  document.getElementById("camposNuevoActor").innerHTML = crearCamposHTML(camposDelRol(rol), {});
}

// El administrador crea una cuenta con cualquier rol.
function crearActor(evento) {
  evento.preventDefault();
  let formulario = document.getElementById("formNuevoActor");
  let datos = leerFormulario(formulario);
  datos.correo = datos.correo.toLowerCase();

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

  let campos = camposDelRol(datos.rol);
  let error = validarCampos(campos, datos);
  if (error) {
    mostrarError(formulario, error.campo, error.mensaje);
    return;
  }

  let nuevo = crearUsuario(datos.rol, datos);
  copiarValores(nuevo, campos, datos); // así los números quedan como números
  usuarios.push(nuevo);
  guardarUsuarios();

  mostrarMensaje(NOMBRES_DE_ROL[nuevo.rol] + " " + nuevo.nombre + " registrado correctamente.", "exito");
  mostrarSeccion();
}


/* ================================================================
   7. FLOTA (ADMINISTRADOR Y OPERATIVO)
   ================================================================ */

// Cuenta buses activos, en mantenimiento, en turno y la capacidad total.
function resumenDeBuses(lista) {
  let resumen = { total: lista.length, activos: 0, mantenimiento: 0, enTurno: 0, capacidad: 0 };
  for (let i = 0; i < lista.length; i++) {
    if (lista[i].estado === "Activo") resumen.activos++;
    if (lista[i].estado === "En mantenimiento") resumen.mantenimiento++;
    if (lista[i].turnoInicio) resumen.enTurno++;
    resumen.capacidad += capacidadTotal(lista[i]);
  }
  return resumen;
}

// Ordena una lista de buses por placa.
function ordenarPorPlaca(lista) {
  return lista.sort(function (a, b) {
    return a.placa.localeCompare(b.placa);
  });
}

function seccionFlota() {
  let lista = ordenarPorPlaca(buses.slice()); // slice() hace una copia para no desordenar la original
  let r = resumenDeBuses(lista);
  let esAdmin = usuario.rol === "administrador";

  let titulo = esAdmin ? "Flota registrada" : "Estado de la flota";
  let encabezado = cabecera(titulo, "Unidades registradas por los propietarios en transUbic.") +
    tarjetasDeDatos([
      ["Unidades", r.total, "is-main"],
      ["Activas", r.activos],
      ["En mantenimiento", r.mantenimiento],
      ["En turno ahora", r.enTurno],
      ["Capacidad total", r.capacidad + " pas."]
    ]);

  if (lista.length === 0) {
    return encabezado + '<div class="acc-card"><p class="acc-empty">Aún no hay buses registrados.</p></div>';
  }

  let filas = "";
  for (let i = 0; i < lista.length; i++) {
    let bus = lista[i];
    let ruta = buscarRuta(bus.ruta);

    let columnaRuta = "—";
    if (ruta) {
      columnaRuta = `<span class="route-code ${ruta.color} route-code--sm">${ruta.codigo}</span>`;
    }

    let columnaTurno = "<small>Sin turno</small>";
    if (bus.turnoInicio) {
      columnaTurno = `<span class="acc-live">● ${calcularDuracion(bus.turnoInicio)}</span>`;
    }

    // Solo el administrador ve el botón Eliminar.
    let columnaEliminar = "";
    if (esAdmin) {
      columnaEliminar = `<td><button type="button" class="btn-small btn-danger" onclick="eliminarBus('${bus.id}')">Eliminar</button></td>`;
    }

    filas += `
      <tr>
        <td><b class="mono">${limpiarTexto(bus.placa)}</b><small>${nombreTipoBus(bus)} · ${limpiarTexto(bus.marca)} ${limpiarTexto(bus.modelo)}</small></td>
        <td>${columnaRuta}</td>
        <td>${limpiarTexto(nombreConductor(bus))}</td>
        <td>${capacidadTotal(bus)}</td>
        <td>
          <select class="acc-select-sm" onchange="cambiarEstadoBus('${bus.id}', this.value)">
            ${opcionesHTML(ESTADOS_BUS, ESTADOS_BUS, bus.estado)}
          </select>
        </td>
        <td>${columnaTurno}</td>
        ${columnaEliminar}
      </tr>`;
  }

  return encabezado + `
    <div class="acc-card">
      <div class="acc-table-wrap">
        <table class="acc-table">
          <thead><tr><th>Placa</th><th>Ruta</th><th>Conductor</th><th>Capacidad</th><th>Estado</th><th>Turno</th>${esAdmin ? "<th></th>" : ""}</tr></thead>
          <tbody>${filas}</tbody>
        </table>
      </div>
    </div>`;
}

// Cambiar el estado de un bus (Activo, En mantenimiento, Inactivo).
function cambiarEstadoBus(id, nuevoEstado) {
  let bus = buscarBusPorId(id);
  if (bus.turnoInicio && nuevoEstado !== "Activo") {
    mostrarMensaje("El bus tiene un turno activo; ciérralo antes de cambiar su estado.", "error");
  } else {
    bus.estado = nuevoEstado;
    guardarBuses();
    mostrarMensaje("Bus " + bus.placa + ": " + nuevoEstado + ".", "info");
  }
  mostrarSeccion();
}

// Eliminar un bus (lo usan el administrador y el propietario).
function eliminarBus(id) {
  let bus = buscarBusPorId(id);
  if (bus.turnoInicio) {
    mostrarMensaje("No puedes eliminar un bus con turno activo.", "error");
    return;
  }
  if (!confirm("¿Eliminar el bus " + bus.placa + " de la flota?")) return;

  buses = buses.filter(function (b) {
    return b.id !== id;
  });
  guardarBuses();
  mostrarMensaje("Bus " + bus.placa + " eliminado.", "info");
  mostrarSeccion();
}


/* ================================================================
   8. OPERATIVO: CENTRO DE CONTROL
   ================================================================ */

function seccionControl() {
  let r = resumenDeBuses(buses);
  return `
    ${cabecera("Centro de control", "Turno " + usuario.turno.toLowerCase() + " · monitoreo de la operación en tiempo real.")}
    <div class="acc-card acc-hero">
      <div>
        <h2>Operación en tiempo real</h2>
        <p>Abre el tablero con el mapa de la red, el estado de la flota, el headway y las alertas operativas.</p>
        <a class="primary-btn acc-btn-link" href="${RUTA_CENTRO_CONTROL}">◈ &nbsp; Abrir centro de control</a>
      </div>
      <div class="acc-hero-icon">◈</div>
    </div>
    ${tarjetasDeDatos([
      ["Buses activos", r.activos, "is-main"],
      ["En turno", r.enTurno],
      ["En mantenimiento", r.mantenimiento],
      ["Capacidad disponible", r.capacidad + " pas."]
    ])}`;
}


/* ================================================================
   9. CONDUCTOR: MI BUS Y TURNO
   ================================================================ */

function seccionMiBus() {
  // Buscamos los buses que tienen asignado a este conductor.
  let misBuses = [];
  for (let i = 0; i < buses.length; i++) {
    if (buses[i].conductorId === usuario.id) misBuses.push(buses[i]);
  }

  if (misBuses.length === 0) {
    return cabecera("Mi bus y turno", "Aquí verás el bus que te asigne el propietario.") +
      '<div class="acc-card"><p class="acc-empty">Todavía no tienes un bus asignado. Comunícate con el propietario del vehículo.</p></div>';
  }

  let html = cabecera("Mi bus y turno", "Inicia tu turno al subir al bus y ciérralo al terminar el recorrido.");

  for (let i = 0; i < misBuses.length; i++) {
    let bus = misBuses[i];
    let ruta = buscarRuta(bus.ruta);
    let textoRuta = ruta ? ruta.codigo + " · " + nombreRuta(ruta) : "Sin ruta";

    // El botón cambia si el turno está abierto o cerrado.
    let textoTurno = "Sin turno activo";
    let boton = `<button type="button" class="primary-btn" onclick="iniciarTurno('${bus.id}')">▶ &nbsp; Iniciar turno</button>`;
    if (bus.turnoInicio) {
      textoTurno = "En curso desde " + formatearFecha(bus.turnoInicio) + " (" + calcularDuracion(bus.turnoInicio) + ")";
      boton = `<button type="button" class="primary-btn btn-danger-solid" onclick="cerrarTurno('${bus.id}')">■ &nbsp; Cerrar turno</button>`;
    }

    // Historial de los últimos turnos.
    let historial = "";
    if (bus.historialTurnos.length > 0) {
      historial = '<h3>Últimos turnos</h3><ul class="acc-history">';
      for (let j = 0; j < bus.historialTurnos.length; j++) {
        let turno = bus.historialTurnos[j];
        historial += `<li><span>${formatearFecha(turno.inicio)}</span><b>${calcularDuracion(turno.inicio, turno.fin)}</b></li>`;
      }
      historial += '</ul>';
    }

    html += `
      <div class="acc-card acc-bus">
        <div class="acc-bus-head">
          <div class="acc-plate">${limpiarTexto(bus.placa)}</div>
          <div>
            <h2>${nombreTipoBus(bus)} · ${limpiarTexto(bus.marca)} ${limpiarTexto(bus.modelo)}</h2>
            <p>${limpiarTexto(describirBus(bus))}</p>
          </div>
          ${etiquetaEstado(bus.estado)}
        </div>
        <div class="acc-bus-info">
          <div><span>Ruta</span><b>${textoRuta}</b></div>
          <div><span>Turno</span><b>${textoTurno}</b></div>
        </div>
        <div class="acc-actions">${boton}</div>
        ${historial}
      </div>`;
  }
  return html;
}

function iniciarTurno(id) {
  let bus = buscarBusPorId(id);

  if (bus.conductorId !== usuario.id) {
    mostrarMensaje("Este bus no está asignado a ti.", "error");
    return;
  }
  if (bus.estado !== "Activo") {
    mostrarMensaje("No puedes iniciar turno: el bus está \"" + bus.estado + "\".", "error");
    return;
  }
  if (bus.turnoInicio) {
    mostrarMensaje("Ya hay un turno activo en este bus.", "error");
    return;
  }
  // Un conductor no puede tener dos turnos abiertos a la vez.
  for (let i = 0; i < buses.length; i++) {
    if (buses[i].id !== id && buses[i].conductorId === usuario.id && buses[i].turnoInicio) {
      mostrarMensaje("Ya tienes un turno abierto en otro bus.", "error");
      return;
    }
  }

  bus.turnoInicio = new Date().toISOString();
  guardarBuses();
  mostrarMensaje("Turno iniciado en el bus " + bus.placa + ". ¡Buen viaje!", "exito");
  mostrarSeccion();
}

function cerrarTurno(id) {
  let bus = buscarBusPorId(id);
  let turno = { inicio: bus.turnoInicio, fin: new Date().toISOString() };

  // unshift agrega al INICIO de la lista. Guardamos solo los últimos 5 turnos.
  bus.historialTurnos.unshift(turno);
  if (bus.historialTurnos.length > 5) {
    bus.historialTurnos.pop(); // pop quita el último
  }
  bus.turnoInicio = null;
  guardarBuses();

  mostrarMensaje("Turno cerrado · duración " + calcularDuracion(turno.inicio, turno.fin) + ".", "exito");
  mostrarSeccion();
}


/* ================================================================
   10. PROPIETARIO: MIS BUSES
   ================================================================ */

function seccionMisBuses() {
  // Buses de este propietario
  let misBuses = [];
  for (let i = 0; i < buses.length; i++) {
    if (buses[i].propietarioId === usuario.id) misBuses.push(buses[i]);
  }
  ordenarPorPlaca(misBuses);
  let r = resumenDeBuses(misBuses);

  // Para la lista de conductores: guardamos los ids y los textos.
  let conductores = usuariosDelRol("conductor");
  let idsConductores = [""];
  let textosConductores = ["— Sin asignar —"];
  for (let i = 0; i < conductores.length; i++) {
    idsConductores.push(conductores[i].id);
    textosConductores.push(limpiarTexto(conductores[i].nombre) + " · " + conductores[i].categoriaLicencia);
  }

  let html = cabecera("Mis buses", "Registra tus vehículos, actualiza sus datos y asigna conductores.") +
    tarjetasDeDatos([
      ["Mis buses", r.total, "is-main"],
      ["Activos", r.activos],
      ["En turno", r.enTurno],
      ["Capacidad total", r.capacidad + " pas."]
    ]);

  // Una tarjeta por cada bus
  for (let i = 0; i < misBuses.length; i++) {
    let bus = misBuses[i];
    let ruta = buscarRuta(bus.ruta);
    let textoRuta = ruta ? ruta.codigo + " · " + nombreRuta(ruta) : "Sin ruta";
    let textoTurno = bus.turnoInicio ? "En curso (" + calcularDuracion(bus.turnoInicio) + ")" : "Sin turno activo";
    let observaciones = bus.observaciones ? " · " + limpiarTexto(bus.observaciones) : "";

    // Parte de abajo: o el formulario para editar, o los botones.
    let parteDeAbajo = "";
    if (busEditando === bus.id) {
      parteDeAbajo = `
        <form id="formEditarBus" onsubmit="guardarBus(event, '${bus.id}')" novalidate>
          <div class="acc-grid">${crearCamposHTML(camposDelBus(bus.tipo), bus)}</div>
          <p class="auth-error"></p>
          <div class="acc-actions">
            <button type="button" class="btn-ghost" onclick="editarBus(null)">Cancelar</button>
            <button type="submit" class="primary-btn">Guardar datos</button>
          </div>
        </form>`;
    } else {
      parteDeAbajo = `
        <div class="acc-actions">
          <button type="button" class="btn-small btn-danger" onclick="eliminarBus('${bus.id}')">Eliminar</button>
          <button type="button" class="btn-ghost" onclick="editarBus('${bus.id}')">✎ &nbsp; Modificar datos</button>
        </div>`;
    }

    html += `
      <div class="acc-card acc-bus">
        <div class="acc-bus-head">
          <div class="acc-plate">${limpiarTexto(bus.placa)}</div>
          <div>
            <h2>${nombreTipoBus(bus)}</h2>
            <p>${limpiarTexto(describirBus(bus))}${observaciones}</p>
          </div>
          ${etiquetaEstado(bus.estado)}
        </div>
        <div class="acc-bus-info">
          <div><span>Ruta</span><b>${textoRuta}</b></div>
          <div><span>Turno</span><b>${textoTurno}</b></div>
          <label class="auth-field"><span>Conductor asignado</span>
            <select onchange="asignarConductor('${bus.id}', this.value)" ${bus.turnoInicio ? "disabled" : ""}>
              ${opcionesHTML(idsConductores, textosConductores, bus.conductorId || "")}
            </select>
          </label>
        </div>
        ${parteDeAbajo}
      </div>`;
  }

  // Formulario para registrar un bus nuevo
  html += `
    <form class="acc-card" id="formRegistrarBus" onsubmit="registrarBus(event)" novalidate>
      <h2>Registrar nuevo bus</h2>
      <div class="acc-grid">
        <label class="auth-field"><span>Tipo de vehículo <em>*</em></span>
          <select name="tipo" onchange="cambiarTipoBusNuevo(this.value)">
            <option value="bus">Bus convencional</option>
            <option value="articulado">Bus articulado</option>
          </select>
        </label>
        <label class="auth-field" data-campo="placa"><span>Placa <em>*</em></span><input name="placa" placeholder="ABC123" maxlength="7"></label>
      </div>
      <div class="acc-grid" id="camposBusNuevo">${crearCamposHTML(camposDelBus("bus"), { estado: "Activo" })}</div>
      <p class="auth-error"></p>
      <div class="acc-actions">
        <button type="button" class="btn-ghost" onclick="mostrarSeccion()">Limpiar</button>
        <button type="submit" class="primary-btn">Registrar bus</button>
      </div>
    </form>`;

  return html;
}

// Cuando cambian el tipo de bus en el formulario de registro, cambian los campos.
function cambiarTipoBusNuevo(tipo) {
  document.getElementById("camposBusNuevo").innerHTML = crearCamposHTML(camposDelBus(tipo), { estado: "Activo" });
}

function asignarConductor(idBus, idConductor) {
  let bus = buscarBusPorId(idBus);
  if (bus.turnoInicio) {
    mostrarMensaje("No puedes cambiar el conductor durante un turno activo.", "error");
    mostrarSeccion();
    return;
  }
  bus.conductorId = idConductor || null; // si eligieron "Sin asignar" queda null
  guardarBuses();
  mostrarMensaje("Conductor de " + bus.placa + ": " + nombreConductor(bus) + ".", "info");
  mostrarSeccion();
}

// Abre (o cierra con null) el formulario para modificar un bus.
function editarBus(id) {
  busEditando = id;
  mostrarSeccion();
}

function guardarBus(evento, id) {
  evento.preventDefault();
  let formulario = document.getElementById("formEditarBus");
  let bus = buscarBusPorId(id);
  let datos = leerFormulario(formulario);
  let campos = camposDelBus(bus.tipo);

  let error = validarCampos(campos, datos);
  if (error) {
    mostrarError(formulario, error.campo, error.mensaje);
    return;
  }
  if (bus.turnoInicio && datos.estado !== "Activo") {
    mostrarError(formulario, "estado", "El bus tiene un turno activo; ciérralo antes de cambiar su estado.");
    return;
  }

  copiarValores(bus, campos, datos);
  guardarBuses();
  busEditando = null;
  mostrarMensaje("Datos del bus " + bus.placa + " actualizados.", "exito");
  mostrarSeccion();
}

function registrarBus(evento) {
  evento.preventDefault();
  let formulario = document.getElementById("formRegistrarBus");
  let datos = leerFormulario(formulario);

  // La placa en mayúsculas y sin espacios ni guiones: "abc-123" -> "ABC123"
  datos.placa = datos.placa.toUpperCase().replace(/[\s-]/g, "");

  if (datos.placa === "") {
    mostrarError(formulario, "placa", "La placa es obligatoria.");
    return;
  }
  let errorPlaca = validarCampo("placa", datos.placa);
  if (errorPlaca) {
    mostrarError(formulario, "placa", errorPlaca);
    return;
  }
  for (let i = 0; i < buses.length; i++) {
    if (buses[i].placa === datos.placa) {
      mostrarError(formulario, "placa", "Ya existe un bus con esa placa.");
      return;
    }
  }

  let error = validarCampos(camposDelBus(datos.tipo), datos);
  if (error) {
    mostrarError(formulario, error.campo, error.mensaje);
    return;
  }

  datos.propietarioId = usuario.id;
  let nuevo = crearBus(datos.tipo, datos);
  buses.push(nuevo);
  guardarBuses();

  mostrarMensaje("Bus " + nuevo.placa + " registrado en tu flota.", "exito");
  mostrarSeccion();
}


/* ================================================================
   11. AL CARGAR LA PÁGINA
   ================================================================ */

if (usuario !== null) {
  // Si la dirección trae una sección (ej: cuenta.html#favoritos) y el usuario
  // la tiene en su menú, empezamos en esa sección.
  let desdeLaDireccion = location.hash.replace("#", "");
  let menu = menuDelUsuario();
  for (let i = 0; i < menu.length; i++) {
    if (menu[i].id === desdeLaDireccion) {
      vistaActual = desdeLaDireccion;
    }
  }

  mostrarTodo();

  // Cada minuto (60000 ms) volvemos a pintar las secciones con turnos,
  // para que el tiempo del turno se actualice solo.
  // No lo hacemos si la persona está escribiendo en un campo.
  setInterval(function () {
    let escribiendo = document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "SELECT";
    if ((vistaActual === "mibus" || vistaActual === "misbuses" || vistaActual === "flota") && !escribiendo) {
      mostrarSeccion();
    }
  }, 60000);
}
