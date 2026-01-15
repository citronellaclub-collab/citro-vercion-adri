/* ===============================
   publicar.js
   Publicación y administración
   =============================== */

/**
 * Se ejecuta cuando se carga pages/publicar.html
 */
function publicarInit() {
  cargarItemsPublicados();
  renderListaAdmin();
}

/* ===============================
   Datos
   =============================== */

let itemsPublicados = [];

/* ===============================
   Persistencia
   =============================== */

function guardarItems() {
  localStorage.setItem("items_publicados", JSON.stringify(itemsPublicados));
}

function cargarItemsPublicados() {
  const data = localStorage.getItem("items_publicados");
  if (data) {
    itemsPublicados = JSON.parse(data);
  }
}

/* ===============================
   Publicar item
   =============================== */

function publicarItem() {
  const nombre = document.getElementById("pubNombre").value;
  const precio = Number(document.getElementById("pubPrecio").value);
  const imagenInput = document.getElementById("pubImagen");

  if (!nombre || !precio || !imagenInput.files[0]) {
    alert("Completa todos los campos");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const item = {
      id: "item_" + Date.now(),
      nombre,
      precio,
      imagen: reader.result
    };

    itemsPublicados.push(item);
    guardarItems();
    renderListaAdmin();
    limpiarFormulario();
  };

  reader.readAsDataURL(imagenInput.files[0]);
}

/* ===============================
   Render admin
   =============================== */

function renderListaAdmin() {
  const container = document.getElementById("adminLista");
  if (!container) return;

  container.innerHTML = "";

  if (itemsPublicados.length === 0) {
    container.innerHTML = "<p>No hay items publicados</p>";
    return;
  }

  itemsPublicados.forEach(item => {
    const row = document.createElement("div");
    row.className = "admin-item";

    row.innerHTML = `
      <img src="${item.imagen}" />
      <input value="${item.nombre}" 
             onchange="editarNombre('${item.id}', this.value)" />
      <input type="number" value="${item.precio}" 
             onchange="editarPrecio('${item.id}', this.value)" />
      <button onclick="eliminarItem('${item.id}')">Eliminar</button>
    `;

    container.appendChild(row);
  });
}

/* ===============================
   Edición
   =============================== */

function editarNombre(id, nuevoNombre) {
  const item = itemsPublicados.find(i => i.id === id);
  if (!item) return;
  item.nombre = nuevoNombre;
  guardarItems();
}

function editarPrecio(id, nuevoPrecio) {
  const item = itemsPublicados.find(i => i.id === id);
  if (!item) return;
  item.precio = Number(nuevoPrecio);
  guardarItems();
}

function eliminarItem(id) {
  if (!confirm("Eliminar item?")) return;
  itemsPublicados = itemsPublicados.filter(i => i.id !== id);
  guardarItems();
  renderListaAdmin();
}

/* ===============================
   Utilidades
   =============================== */

function limpiarFormulario() {
  document.getElementById("pubNombre").value = "";
  document.getElementById("pubPrecio").value = "";
  document.getElementById("pubImagen").value = "";
}
