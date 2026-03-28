// ============================================================
// STOCKIA - Utilidades Compartidas
// ============================================================

const SUPABASE_URL = 'https://gkwtspgbpqjwvyalwymc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdrd3RzcGdicHFqd3Z5YWx3eW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjA1MDAwMDAwMH0.PLACEHOLDER';

// Cliente Supabase vía CDN (cargado en cada HTML)
let supabase;
function initSupabase() {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabase;
}

// ============================================================
// AUTH HELPERS
// ============================================================

async function checkAuth(redirectTo = 'login.html') {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = redirectTo;
    return null;
  }
  return session;
}

async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('*, empresas(nombre)')
    .eq('id', user.id)
    .single();

  return { ...user, perfil };
}

async function logout() {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
}

// ============================================================
// TOAST
// ============================================================
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container') || createToastContainer();
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function createToastContainer() {
  const div = document.createElement('div');
  div.id = 'toast-container';
  document.body.appendChild(div);
  return div;
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
    ov.innerHTML = `<div class="spinner" style="border-color:rgba(31,58,138,0.2);border-top-color:var(--primary)"></div><p>${msg}</p>`;
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
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n || 0);
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

// Cerrar modal al hacer click fuera
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// ============================================================
// CONFIRM DIALOG
// ============================================================
function confirmDialog(message) {
  return confirm(message);
}

// ============================================================
// DEBOUNCE
// ============================================================
function debounce(fn, delay = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

// ============================================================
// LOGO SVG (inline)
// ============================================================
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 44" role="img" aria-label="Stockia">
  <text x="0" y="34" font-family="Inter,sans-serif" font-weight="700" font-size="36" fill="white" letter-spacing="-1">St</text>
  <!-- "o" como caja -->
  <rect x="42" y="10" width="22" height="22" rx="3" fill="none" stroke="white" stroke-width="3"/>
  <line x1="42" y1="18" x2="64" y2="18" stroke="white" stroke-width="2"/>
  <line x1="49" y1="10" x2="49" y2="18" stroke="white" stroke-width="2"/>
  <line x1="57" y1="10" x2="57" y2="18" stroke="white" stroke-width="2"/>
  <text x="66" y="34" font-family="Inter,sans-serif" font-weight="700" font-size="36" fill="white" letter-spacing="-1">ckia</text>
</svg>`;

const LOGO_SVG_DARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 44" role="img" aria-label="Stockia">
  <text x="0" y="34" font-family="Inter,sans-serif" font-weight="700" font-size="36" fill="#1F3A8A" letter-spacing="-1">St</text>
  <rect x="42" y="10" width="22" height="22" rx="3" fill="none" stroke="#1F3A8A" stroke-width="3"/>
  <line x1="42" y1="18" x2="64" y2="18" stroke="#1F3A8A" stroke-width="2"/>
  <line x1="49" y1="10" x2="49" y2="18" stroke="#1F3A8A" stroke-width="2"/>
  <line x1="57" y1="10" x2="57" y2="18" stroke="#1F3A8A" stroke-width="2"/>
  <text x="66" y="34" font-family="Inter,sans-serif" font-weight="700" font-size="36" fill="#1F3A8A" letter-spacing="-1">ckia</text>
</svg>`;
