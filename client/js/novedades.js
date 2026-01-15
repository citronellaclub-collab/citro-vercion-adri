/* ===========================
   NOVEDADES.JS
   Panel de novedades dinámico
   =========================== */

/*
Estructura de una novedad:
{
  id: number,
  titulo: string,
  contenido: string,
  fecha: timestamp,
  tipo: 'info' | 'update' | 'evento'
}
*/

const Novedades = (() => {

  const STORAGE_KEY = 'novedades';
  let novedades = [];

  /* =====================
     CARGA / GUARDADO
     ===================== */

  function cargar() {
    const data = localStorage.getItem(STORAGE_KEY);
    novedades = data ? JSON.parse(data) : generarDemo();
    guardar();
  }

  function guardar() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novedades));
  }

  /* =====================
     DATOS DEMO
     ===================== */

  function generarDemo() {
    return [
      {
        id: 1,
        titulo: '🌱 Bienvenido a Cultivo Virtual',
        contenido: 'Ya podés gestionar tu cultivo, catálogo, pedidos y licitaciones desde el dashboard.',
        fecha: Date.now(),
        tipo: 'info'
      },
      {
        id: 2,
        titulo: '🛒 Sistema de pedidos activo',
        contenido: 'El carrito permite agrupar productos y enviar solicitudes completas.',
        fecha: Date.now() - 1000 * 60 * 60 * 6,
        tipo: 'update'
      },
      {
        id: 3,
        titulo: '🔥 Evento especial',
        contenido: 'Licitaciones activas por tiempo limitado. Revisá la sección de subastas.',
        fecha: Date.now() - 1000 * 60 * 60 * 24,
        tipo: 'evento'
      }
    ];
  }

  /* =====================
     RENDER
     ===================== */

  function render() {
    const contenedor = document.getElementById('novedadesContainer');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    if (novedades.length === 0) {
      contenedor.innerHTML = '<p>No hay novedades por el momento.</p>';
      return;
    }

    novedades
      .sort((a, b) => b.fecha - a.fecha)
      .forEach(n => {
        const card = document.createElement('div');
        card.className = `novedad-card ${n.tipo}`;

        card.innerHTML = `
          <h3>${n.titulo}</h3>
          <small>${formatearFecha(n.fecha)}</small>
          <p>${n.contenido}</p>
        `;

        contenedor.appendChild(card);
      });
  }

  /* =====================
     UTILIDADES
     ===================== */

  function formatearFecha(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString().slice(0,5);
  }

  /* =====================
     ADMIN (FUTURO)
     ===================== */

  function agregarNovedad(titulo, contenido, tipo = 'info') {
    const nueva = {
      id: Date.now(),
      titulo,
      contenido,
      fecha: Date.now(),
      tipo
    };

    novedades.unshift(nueva);
    guardar();
    render();
  }

  /* =====================
     API PÚBLICA
     ===================== */

  function init() {
    cargar();
    render();
  }

  return {
    init,
    agregarNovedad // listo para panel admin futuro
  };

})();

/* =====================
   AUTO-INICIO
   ===================== */

document.addEventListener('DOMContentLoaded', () => {
  Novedades.init();
});
