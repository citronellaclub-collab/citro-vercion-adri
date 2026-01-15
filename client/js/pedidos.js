/* ===============================
   pedidos.js
   Gestión del carrito y pedidos
   =============================== */

/**
 * Se ejecuta cuando se carga pages/pedidos.html
 */
function pedidosInit() {
  renderCarrito();
  actualizarResumenPedido();
}

/* ===============================
   Renderizado del carrito
   =============================== */

function renderCarrito() {
  const container = document.getElementById("pedidoLista");
  if (!container) return;

  container.innerHTML = "";

  if (state.cart.length === 0) {
    container.innerHTML = "<p>El carrito está vacío</p>";
    return;
  }

  state.cart.forEach(item => {
    const row = document.createElement("div");
    row.className = "pedido-item";

    row.innerHTML = `
      <span>${item.name}</span>
      <span>x${item.quantity}</span>
      <span>${item.price * item.quantity} 🟢</span>
      <button onclick="eliminarItemPedido('${item.id}')">✖</button>
    `;

    container.appendChild(row);
  });
}

/* ===============================
   Resumen
   =============================== */

function actualizarResumenPedido() {
  const totalEl = document.getElementById("pedidoTotal");
  const countEl = document.getElementById("pedidoCantidad");

  if (totalEl) {
    totalEl.innerText = getCartTotal() + " 🟢";
  }

  if (countEl) {
    countEl.innerText = getCartCount();
  }
}

/* ===============================
   Acciones
   =============================== */

/**
 * Elimina un item del carrito
 */
function eliminarItemPedido(id) {
  removeFromCart(id);
  renderCarrito();
  actualizarResumenPedido();
}

/**
 * Confirma el pedido completo
 */
function confirmarPedido() {
  if (state.cart.length === 0) {
    alert("No hay items en el carrito");
    return;
  }

  const confirmar = confirm(
    `Confirmar pedido por ${getCartTotal()} tokens?`
  );

  if (!confirmar) return;

  // En backend real, acá se enviaría el pedido
  clearCart();

  alert("Pedido enviado correctamente");
  renderCarrito();
  actualizarResumenPedido();
}
