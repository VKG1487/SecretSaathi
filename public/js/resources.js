/**
 * SecretSaathi - Resources Directory Logic
 * Handles real-time search, category filtering, and rendering of campus & national resources
 */

let allResources = [];
let currentCategory = 'All';
let currentSearch = '';

document.addEventListener('DOMContentLoaded', () => {
  initResources();
});

async function initResources() {
  const loadingEl = document.getElementById('resourcesLoading');
  const errorEl = document.getElementById('resourcesError');

  try {
    const res = await fetch('/api/resources');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();
    if (!data.success || !Array.isArray(data.resources)) {
      throw new Error('Failed to retrieve resources.');
    }

    allResources = data.resources;

    if (loadingEl) loadingEl.style.display = 'none';

    setupFilters();
    filterAndRenderResources();

  } catch (err) {
    console.error('Error loading resources:', err);
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.innerHTML = `
        <p><strong>Unable to load resources.</strong></p>
        <p>Please ensure the local server is running and try again.</p>
        <button class="btn btn-secondary btn-sm" onclick="location.reload()" style="margin-top: 10px;">Retry</button>
      `;
    }
  }
}

/**
 * Setup category pills and search input listeners
 */
function setupFilters() {
  const searchInput = document.getElementById('resourceSearch');
  const categoryPills = document.querySelectorAll('.filter-pill');

  // Search input with small debounce
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentSearch = e.target.value.trim().toLowerCase();
        filterAndRenderResources();
      }, 200);
    });
  }

  // Category pill selection
  categoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
      categoryPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentCategory = pill.getAttribute('data-category') || 'All';
      filterAndRenderResources();
    });
  });

  // URL query parameter support (e.g. resources.html?category=Helpline)
  const urlParams = new URLSearchParams(window.location.search);
  const catParam = urlParams.get('category');
  if (catParam) {
    const matchedPill = Array.from(categoryPills).find(
      p => p.getAttribute('data-category')?.toLowerCase() === catParam.toLowerCase()
    );
    if (matchedPill) {
      categoryPills.forEach(p => p.classList.remove('active'));
      matchedPill.classList.add('active');
      currentCategory = matchedPill.getAttribute('data-category');
    }
  }
}

/**
 * Filter resources by category and search keyword, then render to grid
 */
function filterAndRenderResources() {
  const grid = document.getElementById('resourcesGrid');
  const countEl = document.getElementById('resourcesCount');
  const emptyEl = document.getElementById('emptyState');

  if (!grid) return;

  const filtered = allResources.filter(item => {
    // 1. Category check
    const matchesCategory = (currentCategory === 'All') ||
      (item.category && item.category.toLowerCase() === currentCategory.toLowerCase());

    // 2. Search check
    const matchesSearch = !currentSearch ||
      item.name.toLowerCase().includes(currentSearch) ||
      item.description.toLowerCase().includes(currentSearch) ||
      (item.category && item.category.toLowerCase().includes(currentSearch)) ||
      (item.location && item.location.toLowerCase().includes(currentSearch));

    return matchesCategory && matchesSearch;
  });

  // Update counter
  if (countEl) {
    countEl.textContent = `Showing ${filtered.length} of ${allResources.length} support resources`;
  }

  // Handle empty state
  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  // Render cards
  grid.innerHTML = '';
  filtered.forEach(res => {
    const card = document.createElement('article');
    card.className = 'resource-card';

    card.innerHTML = `
      <div class="resource-card-top">
        <span class="badge badge-category">${escapeHTML(res.category)}</span>
        ${res.isDemo ? '<span class="badge badge-demo">Campus Demo</span>' : '<span class="badge badge-category" style="background:#e0f2fe; color:#0369a1; border-color:#bae6fd;">National Service</span>'}
      </div>

      <h3 class="resource-name">${escapeHTML(res.name)}</h3>
      <p class="resource-desc">${escapeHTML(res.description)}</p>

      <div class="resource-meta-details">
        ${res.availability ? `<div><strong>Availability:</strong> ${escapeHTML(res.availability)}</div>` : ''}
        ${res.location ? `<div><strong>Location:</strong> ${escapeHTML(res.location)}</div>` : ''}
        ${res.phone ? `<div><strong>Phone:</strong> ${escapeHTML(res.phone)}</div>` : ''}
      </div>

      <div class="resource-actions">
        ${res.phone ? `<a href="tel:${escapeHTML(res.phone)}" class="btn btn-secondary btn-sm" title="Call ${escapeHTML(res.name)}">&#9742; Call</a>` : ''}
        ${res.website ? `<a href="${escapeHTML(res.website)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-primary btn-sm" title="Open website">&#127760; Website</a>` : ''}
      </div>
    `;

    grid.appendChild(card);
  });
}

/**
 * Reset all filters back to default
 */
window.resetResourceFilters = function() {
  const searchInput = document.getElementById('resourceSearch');
  if (searchInput) searchInput.value = '';
  currentSearch = '';

  const categoryPills = document.querySelectorAll('.filter-pill');
  categoryPills.forEach(p => p.classList.remove('active'));
  const allPill = Array.from(categoryPills).find(p => p.getAttribute('data-category') === 'All');
  if (allPill) allPill.classList.add('active');
  currentCategory = 'All';

  filterAndRenderResources();
};
