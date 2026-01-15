/* ===============================
   perfil.js
   Gestión del perfil de usuario
   =============================== */

/**
 * Se ejecuta cuando se carga pages/perfil.html
 */
function perfilInit() {
  renderPerfil();
}

/* ===============================
   Renderizado
   =============================== */

function renderPerfil() {
  const nombreEl = document.getElementById("perfilNombre");
  const tokensEl = document.getElementById("perfilTokens");
  const rolEl = document.getElementById("perfilRol");

  // Usuario temporal si no hay backend
  if (!state.user) {
    state.user = {
      nombre: "Entrenador",
      rol: "Usuario"
    };
    saveState();
  }

  if (nombreEl) nombreEl.innerText = state.user.nombre;
  if (tokensEl) tokensEl.innerText = state.tokens + " 🟢";
  if (rolEl) rolEl.innerText = state.user.rol;
}

/* ===============================
   Acciones de perfil
   =============================== */

/**
 * Cambia el nombre del usuario
 */
function cambiarNombre() {
  const nuevoNombre = prompt("Nuevo nombre de usuario:");
  if (!nuevoNombre) return;

  state.user.nombre = nuevoNombre;
  saveState();
  renderPerfil();
}

/**
 * Carga tokens (modo admin / pruebas)
 */
function cargarTokens() {
  const cantidad = Number(prompt("Cantidad de tokens a cargar:"));
  if (!cantidad || cantidad <= 0) return;

  addTokens(cantidad);
  renderPerfil();
}

/**
 * Cierra sesión (frontend)
 */
function cerrarSesion() {
  if (!confirm("¿Cerrar sesión?")) return;

  logoutUser();
  location.reload();
}
