/* ===============================
   ui-utils.js
   Utilidades visuales globales
   =============================== */

window.UI = (() => {
    const loader = document.getElementById('loader');

    function showLoader() {
        if (loader) loader.classList.remove('hidden');
    }

    function hideLoader() {
        if (loader) loader.classList.add('hidden');
    }

    return { showLoader, hideLoader };
})();
