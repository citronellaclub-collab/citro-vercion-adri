/* ===============================
   sidebar.js
   Control de la barra lateral
   =============================== */

/**
 * Inicializa la barra lateral.
 * Busca todos los botones con atributo data-page
 * y los conecta con loadPage().
 */
function initSidebar() {
  const buttons = document.querySelectorAll("[data-page]");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const page = button.getAttribute("data-page");

      if (!page) {
        console.warn("Botón sin data-page");
        return;
      }

      // Marcar botón activo
      setActiveButton(button);

      // Cargar la página correspondiente
      loadPage(page);
    });
  });
}

/**
 * Marca el botón activo y desmarca los demás
 * @param {HTMLElement} activeButton
 */
function setActiveButton(activeButton) {
  const buttons = document.querySelectorAll("[data-page]");
  buttons.forEach(btn => btn.classList.remove("active"));
  activeButton.classList.add("active");
}

/* ===============================
   Inicialización
   =============================== */

document.addEventListener("DOMContentLoaded", () => {
  initSidebar();
});
