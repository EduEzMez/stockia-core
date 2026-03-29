// ============================================================
// STOCKIA - Utilidades Compartidas
// ============================================================

const SUPABASE_URL = 'https://ymyihifmxgtgjgbqfyys.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlteWloaWZteGd0Z2pnYnFmeXlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NDgyMTQsImV4cCI6MjA5MDMyNDIxNH0.XeQn47IdjyYin-N4heLoXuYvqRxTLUJ9GfiIqvTd520';

// ============================================================
// CLIENTE SUPABASE — singleton, se crea una sola vez
// ============================================================
let _sb = null;

function getClient() {
  if (!_sb) {
    if (!window.supabase) {
      console.error('Supabase CDN no cargó todavía');
      return null;
    }
    _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _sb;
}

// Alias global para compatibilidad con el resto del código
function initSupabase() {
  return getClient();
}

// También exponer como "supabase" global para que checkAuth/getCurrentUser funcionen
Object.defineProperty(window, 'supabaseClient', {
  get: () => getClient()
});

// ============================================================
// AUTH HELPERS
// ============================================================

async function checkAuth(redirectTo = 'login.html') {
  const client = getClient();
  if (!client) { window.location.href = redirectTo; return null; }
  const { data: { session } } = await client.auth.getSession();
  if (!session) {
    window.location.href = redirectTo;
    return null;
  }
  return session;
}

async function getCurrentUser() {
  const client = getClient();
  if (!client) return null;
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;

  // Intentar obtener perfil
  const { data: perfil, error: perfilError } = await client
    .from('perfiles')
    .select('*, empresas(nombre)')
    .eq('id', user.id)
    .single();

  if (perfilError) {
    console.warn('Perfil no encontrado, usando defaults:', perfilError.message);
    // Si no existe el perfil, devolver usuario con perfil básico
    // Intentar crear el perfil
    await client.from('perfiles').upsert({
      id: user.id,
      email: user.email,
      rol: 'operador',
      activo: true
    }, { onConflict: 'id' });
    return { ...user, perfil: { rol: 'operador', activo: true, email: user.email } };
  }

  return { ...user, perfil };
}

// LOGOUT — funciona siempre, sin importar el estado de inicialización
function logout() {
  try {
    const client = getClient();
    if (client) {
      client.auth.signOut().finally(() => {
        window.location.href = 'login.html';
      });
    } else {
      window.location.href = 'login.html';
    }
  } catch(e) {
    window.location.href = 'login.html';
  }
}

// ============================================================
// TOAST
// ============================================================
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ============================================================
// LOADING
// ============================================================
function showLoading(msg = 'Cargando...') {
  let ov = document.getElementById('loading-overlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'loading-overlay';
    ov.className = 'loading-overlay';
    ov.innerHTML = `<div class="spinner" style="width:40px;height:40px;border:3px solid rgba(31,58,138,0.2);border-top-color:var(--primary);border-radius:50%;animation:spin 0.8s linear infinite"></div><p>${msg}</p>`;
    document.body.appendChild(ov);
  }
  ov.style.display = 'flex';
}

function hideLoading() {
  const ov = document.getElementById('loading-overlay');
  if (ov) ov.style.display = 'none';
}

// ============================================================
// FORMATTERS
// ============================================================
function formatMoney(n) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', minimumFractionDigits: 0
  }).format(n || 0);
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('es-AR');
}

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

// ============================================================
// NAVBAR HAMBURGER
// ============================================================
function initHamburger() {
  const btn = document.getElementById('hamburger-btn');
  const menu = document.getElementById('nav-mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      menu.classList.remove('open');
      btn.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

// ============================================================
// NAV ACTIVE LINK
// ============================================================
function setActiveNavLink() {
  const page = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('[data-nav]').forEach(a => {
    if (a.dataset.nav === page) a.classList.add('active');
  });
}

// ============================================================
// FOOTER AÑO AUTO
// ============================================================
function setFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

// ============================================================
// MODAL HELPERS
// ============================================================
function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// ============================================================
// CONFIRM / DEBOUNCE
// ============================================================
function confirmDialog(message) {
  return confirm(message);
}

function debounce(fn, delay = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}
