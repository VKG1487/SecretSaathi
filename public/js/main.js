/**
 * Safe DOM Ready helper that executes immediately if document is already parsed
 */
function onReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

/**
 * Intelligent API endpoint resolver:
 * - If running on Express port 3000, returns relative endpoint '/api/...'
 * - If running on Live Server (e.g. 5500) or other port, targets 'http://hostname:3000/api/...'
 * - If opened via file:/// protocol, targets 'http://localhost:3000/api/...'
 */
function getApiUrl(endpoint) {
  try {
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      if (window.location.port && window.location.port !== '3000') {
        const host = window.location.hostname || 'localhost';
        return `http://${host}:3000${endpoint}`;
      }
      return endpoint;
    }
    return `http://localhost:3000${endpoint}`;
  } catch (e) {
    return endpoint;
  }
}

window.onReady = onReady;
window.getApiUrl = getApiUrl;

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
});

/**
 * Automatically sets .active on the current page's navbar link
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

// Expose globally
window.escapeHTML = escapeHTML;
