/* ===============================
   catalogo.js
   Sistema de catálogo y pedidos
   =============================== */

/**
 * Se ejecuta cuando se carga pages/catalogo.html
 */
function catalogoInit() {
  renderCatalogo();
}

/* ===============================
   Datos del catálogo (temporal)
   Luego vendrá del backend
   =============================== */

const catalogoItems = [
  {
    id: "semilla_1",
    nombre: "Semilla Básica",
    precio: 5,
    imagen: "assets/items/semilla1.png"
  },
  {
    id: "fertilizante_1",
    nombre: "Fertilizante",
    precio: 8,
    imagen: "assets/items/fertilizante.png"
  },
  {
    id: "maceta_1",
    nombre: "Maceta",
    precio: 12,
    imagen: "assets/items/maceta.png"
  }
];

/* ===============================
   Renderizado
   =============================== */

function renderCatalogo() {
  const container = document.getElementById("catalogoGrid");
  if (!container) return;

  container.innerHTML = "";

  catalogoItems.forEach(item => {
    const card = document.createElement("div");
    card.className = "catalogo-item";

    card.innerHTML = `
      <div class="item-img" style="background-image:url('${item.imagen}')"></div>
      <h3>${item.nombre}</h3>
      <p>${item.precio} 🟢</p>
      <button onclick="abrirPedido('${item.id}')">Adquirir</button>
    `;

    container.appendChild(card);
  });
}

/* ===============================
   Pedido / Carrito
   =============================== */

/**
 * Abre un pedido para un item
 */
function abrirPedido(itemId) {
  const item = catalogoItems.find(i => i.id === itemId);
  if (!item) return;

  const cantidad = prompt(`Cantidad de "${item.nombre}"`, 1);
  if (!cantidad || cantidad <= 0) return;

  const total = item.precio * cantidad;

  if (!spendTokens(total)) return;

  addToCart({
    id: item.id,
    name: item.nombre,
    price: item.precio,
    quantity: Number(cantidad)
  });

  alert("Item agregado al carrito");
}
