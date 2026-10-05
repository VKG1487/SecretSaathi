/**
 * SecretSaathi - Main Global JavaScript
 * Shared across all pages: mobile navigation, active link handling, utilities
 */

document.addEventListener('DOMContentLoaded', () => {
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
  const currentPath = window.location.pathname.toLowerCase();
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach(link => {
    const href = link.getAttribute('href').toLowerCase();
    
    // Exact or matching page check
    if (
      (currentPath.endsWith(href) && href !== 'index.html' && href !== '/') ||
      ((currentPath.endsWith('/') || currentPath.endsWith('index.html')) && (href === 'index.html' || href === '/'))
    ) {
      link.classList.add('active');
    }
  });
}

/**
 * Utility: Safe HTML Escape to prevent injection
 */
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
