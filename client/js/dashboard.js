/* ===============================
   dashboard.js
   Lógica del panel principal
   =============================== */

/**
 * Se ejecuta automáticamente cuando
 * se carga pages/dashboard.html
 */
function dashboardInit() {
  actualizarResumen();
}

/* ===============================
   Funciones internas
   =============================== */

/**
 * Actualiza los datos visibles del dashboard
 */
function actualizarResumen() {
  const plantasEl = document.getElementById("dashboardPlantas");
  const tokensEl = document.getElementById("dashboardTokens");
  const carritoEl = document.getElementById("dashboardCarrito");

  if (plantasEl) {
    plantasEl.innerText = state.plants.length;
  }

  if (tokensEl) {
    tokensEl.innerText = state.tokens;
  }

  if (carritoEl) {
    carritoEl.innerText = state.cart.length;
  }
}

/* ===============================
   Acciones rápidas (opcional)
   =============================== */

/**
 * Acceso rápido al catálogo
 */
function irAlCatalogo() {
  loadPage("catalogo");
}

/**
 * Acceso rápido al perfil
 */
function irAlPerfil() {
  loadPage("perfil");
}
