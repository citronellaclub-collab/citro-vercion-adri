/* ===========================
   LICITACIONES.JS
   Sistema de subastas frontend
   =========================== */

/*
Estructura de una licitación:
{
  id: number,
  titulo: string,
  descripcion: string,
  precioInicial: number,
  mejorOferta: number,
  mejorPostor: string,
  fechaFin: timestamp
}
*/

const Licitaciones = (() => {

  const STORAGE_KEY = 'licitaciones';
  let licitaciones = [];

  /* =====================
     CARGA / GUARDADO
     ===================== */

  function cargar() {
    const data = localStorage.getItem(STORAGE_KEY);
    licitaciones = data ? JSON.parse(data) : generarDemo();
    guardar();
  }

  function guardar() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(licitaciones));
  }

  /* =====================
     DEMO INICIAL
     ===================== */

  function generarDemo() {
    const ahora = Date.now();
    return [
      {
        id: 1,
        titulo: 'Flor Premium Indoor',
        descripcion: 'Flor AAA cultivada indoor, alta resina.',
        precioInicial: 8000,
        mejorOferta: 8000,
        mejorPostor: 'Sistema',
        fechaFin: ahora + 1000 * 60 * 60 * 24
      },
      {
        id: 2,
        titulo: 'Aceite CBD Full Spectrum',
        descripcion: 'Aceite medicinal certificado.',
        precioInicial: 12000,
        mejorOferta: 12000,
        mejorPostor: 'Sistema',
        fechaFin: ahora + 1000 * 60 * 60 * 12
      }
    ];
  }

  /* =====================
     RENDER
     ===================== */

  function render() {
    const contenedor = document.getElementById('licitacionesContainer');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    licitaciones.forEach(l => {
      const tiempo = calcularTiempoRestante(l.fechaFin);

      const card = document.createElement('div');
      card.className = 'licitacion-card';

      card.innerHTML = `
        <h3>${l.titulo}</h3>
        <p>${l.descripcion}</p>
        <p><strong>Oferta actual:</strong> $${l.mejorOferta}</p>
        <p><strong>Mejor postor:</strong> ${l.mejorPostor}</p>
        <p class="tiempo">${tiempo}</p>
        <input type="number" min="${l.mejorOferta + 1}" placeholder="Tu oferta">
        <button>Ofertar</button>
      `;

      const btn = card.querySelector('button');
      const input = card.querySelector('input');

      btn.onclick = () => ofertar(l.id, input.value);

      contenedor.appendChild(card);
    });
  }

  /* =====================
     OFERTAR
     ===================== */

  function ofertar(id, monto) {
    monto = parseInt(monto);

    if (isNaN(monto)) {
      alert('Ingresá una oferta válida');
      return;
    }

    const lic = licitaciones.find(l => l.id === id);
    if (!lic) return;

    if (monto <= lic.mejorOferta) {
      alert('La oferta debe ser mayor a la actual');
      return;
    }

    lic.mejorOferta = monto;
    lic.mejorPostor = State.getUser()?.username || 'Invitado';

    guardar();
    render();
  }

  /* =====================
     TIEMPO RESTANTE
     ===================== */

  function calcularTiempoRestante(fechaFin) {
    const diff = fechaFin - Date.now();
    if (diff <= 0) return '⛔ Subasta finalizada';

    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff / (1000 * 60)) % 60);

    return `⏳ ${horas}h ${minutos}m restantes`;
  }

  /* =====================
     LOOP DE ACTUALIZACIÓN
     ===================== */

  function iniciarReloj() {
    setInterval(render, 60000);
  }

  /* =====================
     API PÚBLICA
     ===================== */

  function init() {
    cargar();
    render();
    iniciarReloj();
  }

  return {
    init
  };

})();

/* =====================
   AUTO-INICIO
   ===================== */

document.addEventListener('DOMContentLoaded', () => {
  Licitaciones.init();
});
