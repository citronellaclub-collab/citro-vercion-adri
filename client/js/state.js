/* ===============================
   state.js (Refactorizado Fullstack)
   =============================== */

const API_URL = '/api';

const state = {
  user: null,
  tokens: 0,
  crops: [],
  cart: []
};

// Helper para headers con JWT
function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// === AUTH ===

async function login(username, password) {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) throw new Error('Credenciales inválidas');

    const data = await res.json();
    localStorage.setItem('token', data.token);
    state.user = { username: data.username };
    state.tokens = data.tokens;
    updateUI();
    return true;
  } catch (err) {
    console.error(err);
    alert('Error al iniciar sesión');
    return false;
  }
}

async function register(username, password) {
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Error al registrar");
    }

    const data = await res.json();
    localStorage.setItem("token", data.token);
    state.user = { username: data.username };
    state.tokens = data.tokens;
    updateUI();
    return true;
  } catch (e) {
    alert(e.message);
    return false;
  }
}

async function logout() {
  localStorage.removeItem('token');
  state.user = null;
  location.reload();
}

// === CROPS (BALDES) ===

async function loadCrops() {
  try {
    const res = await fetch(`${API_URL}/crops`, { headers: authHeader() });
    if (res.ok) {
      state.crops = await res.json();
      // Notificamos renderizado si existe la función en el contexto actual
      if (window.Cultivo?.render) window.Cultivo.render();
      return state.crops;
    }
  } catch (e) { console.error('Error loading crops', e); }
}

async function saveWeek(cropId, weekData) {
  // weekData: { week, ph, ec, grow, micro, bloom, imageUrl }
  try {
    const res = await fetch(`${API_URL}/crops/${cropId}/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader()
      },
      body: JSON.stringify(weekData)
    });

    if (res.ok) {
      alert('Registro guardado');
      loadCrops(); // Recargar para ver actualización de estado
      return true;
    }
  } catch (e) {
    console.error('Error saving week', e);
    return false;
  }
}

// === MARKET & INIT ===

async function getMarketItems() {
  try {
    const res = await fetch(`${API_URL}/market`, { headers: authHeader() });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error('Error fetching market', e);
  }
}

function updateUI() {
  const el = document.getElementById('tokenCounter');
  if (el) el.innerText = `${state.tokens} 🟢`;
}

// Exponer al window
window.State = {
  state,
  login,
  register,
  logout,
  loadCrops,
  saveWeek,
  getMarketItems
};

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('token')) {
    // Restaurar sesión simple (en app real verificaríamos token)
    // Por ahora cargamos datos
    loadCrops();
  }
});
