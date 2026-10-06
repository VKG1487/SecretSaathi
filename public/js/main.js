/**
 * SecretSaathi - Core Client Utilities & API Connector
 * Ensures seamless connection between Frontend and Express Backend
 */

// Global API Base resolution
function getApiUrl(endpoint) {
  try {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;

    if (window.SECRETSAATHI_API_BASE) {
      return `${window.SECRETSAATHI_API_BASE.replace(/\/$/, '')}${cleanEndpoint}`;
    }

    const storedBase = localStorage.getItem('secretsaathi_api_base');
    if (storedBase) {
      return `${storedBase.replace(/\/$/, '')}${cleanEndpoint}`;
    }

    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      const p = window.location.port;
      // If accessed via Live Server or other dev server ports
      if (p === '5500' || p === '5501' || p === '5173' || p === '8080' || p === '3001') {
        const host = window.location.hostname || 'localhost';
        return `http://${host}:3000${cleanEndpoint}`;
      }
      // If served directly by Express (port 3000 or production host)
      return cleanEndpoint;
    }

    // Fallback for file:/// protocol
    return `http://localhost:3000${cleanEndpoint}`;
  } catch (e) {
    return endpoint;
  }
}

/**
 * Resilient API fetcher with automatic fallback and timeout
 */
async function apiFetch(endpoint, options = {}, timeoutMs = 4000) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
  const primaryUrl = getApiUrl(endpoint);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const fetchOptions = {
    ...options,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  };

  try {
    const res = await fetch(primaryUrl, fetchOptions);
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);

    // Fallback attempts for external/Live Server clients
    const fallbackPorts = ['3000', '3001'];
    for (const port of fallbackPorts) {
      const fallbackUrl = `http://localhost:${port}${cleanEndpoint}`;
      if (fallbackUrl === primaryUrl) continue;
      try {
        const fbCtrl = new AbortController();
        const fbTimer = setTimeout(() => fbCtrl.abort(), 2000);
        const fbRes = await fetch(fallbackUrl, {
          ...options,
          signal: fbCtrl.signal,
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
          }
        });
        clearTimeout(fbTimer);
        if (fbRes.ok || fbRes.status < 500) {
          return fbRes;
        }
      } catch (e) {
        // try next port
      }
    }
    throw err;
  }
}

/**
 * Safe DOM Ready helper
 */
function onReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

/**
 * Utility: Safe HTML Escape to prevent injection
 */
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Checks backend health and displays a live connection pill in the navbar
 */
async function checkBackendHealth() {
  const navContainer = document.querySelector('.nav-container');
  if (!navContainer) return;

  let statusPill = document.getElementById('backendStatusIndicator');
  if (!statusPill) {
    statusPill = document.createElement('div');
    statusPill.id = 'backendStatusIndicator';
    statusPill.className = 'backend-status-pill checking';
    statusPill.innerHTML = `<span class="status-dot"></span> <span class="status-label">Connecting...</span>`;
    
    // Insert before mobile toggle
    const mobileToggle = document.getElementById('mobileToggle');
    if (mobileToggle) {
      navContainer.insertBefore(statusPill, mobileToggle);
    } else {
      navContainer.appendChild(statusPill);
    }
  }

  try {
    const res = await apiFetch('/api/health', { method: 'GET' }, 2500);
    if (res && res.ok) {
      const data = await res.json();
      statusPill.className = 'backend-status-pill online';
      statusPill.title = `Backend Connected on port ${data.port || 3000} (${data.environment || 'development'})`;
      statusPill.innerHTML = `<span class="status-dot"></span> <span class="status-label">Backend Online</span>`;
      window.isBackendConnected = true;
      window.dispatchEvent(new CustomEvent('backendStatusChange', { detail: { online: true, data } }));
      return true;
    } else {
      throw new Error('Health check returned non-200');
    }
  } catch (err) {
    statusPill.className = 'backend-status-pill offline';
    statusPill.title = 'Backend offline or unreachable. Local fallback active.';
    statusPill.innerHTML = `<span class="status-dot"></span> <span class="status-label">Local Fallback</span>`;
    window.isBackendConnected = false;
    window.dispatchEvent(new CustomEvent('backendStatusChange', { detail: { online: false } }));
    return false;
  }
}

// Expose globally
window.onReady = onReady;
window.getApiUrl = getApiUrl;
window.apiFetch = apiFetch;
window.escapeHTML = escapeHTML;
window.checkBackendHealth = checkBackendHealth;

onReady(() => {
  // 1. Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      const isExpanded = navLinks.classList.toggle('show');
      mobileToggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !mobileToggle.contains(e.target)) {
        navLinks.classList.remove('show');
        mobileToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // 2. Highlight Active Nav Link based on URL pathname
  highlightActiveNavLink();

  // 3. Check and display backend connection health
  checkBackendHealth();
});

/**
 * Automatically sets .active on current page's navbar link
 */
function highlightActiveNavLink() {
  const pathname = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  const cleanCurrent = pathname.endsWith('.html') ? pathname.slice(0, -5) : pathname;
  const isHome = cleanCurrent === '' || cleanCurrent === '/' || cleanCurrent === '/index';

  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.classList.remove('active');
    const href = (link.getAttribute('href') || '').toLowerCase();
    const cleanHref = href.replace(/\.html$/, '').replace(/^\//, '');

    if (isHome && (cleanHref === '' || cleanHref === 'index')) {
      link.classList.add('active');
    } else if (!isHome && cleanHref && (cleanCurrent === '/' + cleanHref || cleanCurrent.endsWith('/' + cleanHref))) {
      link.classList.add('active');
    }
  });
}
