/* ===============================
   app.js - Navigation & Sidebar Logic
   =============================== */

const App = (() => {

  const viewEl = document.getElementById('app-view');
  const sidebarEl = document.getElementById('sidebar');
  const overlayEl = document.getElementById('sidebarOverlay');
  const menuToggle = document.getElementById('menuToggle');

  // Routes configuration
  const ROUTES = {
    'micultivo': 'pages/micultivo.html',
    'gtl': 'pages/gtl.html',
    'foro': 'pages/foro.html',
    'pedidos': 'pages/pedidos.html'
  };

  /* === NAVIGATION ENGINE === */
  async function navigate(routeKey) {
    // 1. Security Check
    const token = localStorage.getItem('token');
    if (!token && routeKey !== 'login') {
      window.location.href = 'login.html';
      return;
    }

    // 2. UI Updates
    updateSidebarUI(routeKey);
    closeSidebarMobile();

    // Usar la nueva utilidad global UI si existe
    if (window.UI) window.UI.showLoader();

    try {
      // 3. Load Content
      const url = ROUTES[routeKey] || `pages/${routeKey}.html`;
      const res = await fetch(url);

      if (!res.ok) throw new Error(`Error ${res.status}: ${url} not found`);

      const html = await res.text();

      // 4. Inject
      viewEl.style.opacity = 0;

      setTimeout(() => {
        viewEl.innerHTML = html;
        viewEl.style.opacity = 1;
        initPageScripts(routeKey);
      }, 150);

    } catch (err) {
      console.error(err);
      viewEl.innerHTML = `<div style="text-align:center;padding:40px">
        <h3>Sección no disponible</h3>
      </div>`;
    } finally {
      if (window.UI) window.UI.hideLoader();
    }
  }

  /* === SCRIPT INJECTION HACK === */
  function initPageScripts(key) {
    // Ejecutar inicializadores específicos de cada módulo
    // NOTA: Es importante que micultivo.html, etc definan estos objetos globalmente
    if (key === 'micultivo') {
      // Recargar datos frescos antes de renderizar
      window.State?.loadCrops().then(() => {
        if (window.Cultivo?.init) window.Cultivo.init();
      });
    }
    else if (key === 'gtl' && window.GTL?.render) window.GTL.render();
    else if (key === 'foro' && window.Foro?.render) window.Foro.render();
    else if (key === 'pedidos' && window.Pedidos?.init) window.Pedidos.init();
  }

  /* === SIDEBAR LOGIC === */
  function updateSidebarUI(activeKey) {
    document.querySelectorAll('.sidebar-menu button').forEach(btn => {
      btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(`nav-${activeKey}`);
    if (activeBtn) activeBtn.classList.add('active');
  }

  function toggleSidebar() {
    sidebarEl.classList.toggle('open');
    overlayEl.classList.toggle('hidden');
  }

  function closeSidebarMobile() {
    sidebarEl.classList.remove('open');
    overlayEl.classList.add('hidden');
  }

  /* === INIT === */
  function init() {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'login.html';
      return;
    }

    const user = window.State?.state?.user;
    if (user) {
      const el = document.getElementById('usernameDisplay');
      if (el) el.innerText = user.username || 'Cultivador';
    }
    window.State?.updateUI?.();

    if (menuToggle) menuToggle.onclick = toggleSidebar;
    if (overlayEl) overlayEl.onclick = closeSidebarMobile;

    navigate('micultivo');
  }

  return { navigate, init };

})();

// EXPONER GLOBAMENTE PARA EL HTML
window.App = App;

document.addEventListener('DOMContentLoaded', App.init);
