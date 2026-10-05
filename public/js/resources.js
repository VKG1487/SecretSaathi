/**
 * SecretSaathi - Resources Directory Logic
 * Handles real-time search, category filtering, and rendering of campus & national resources
 */

const escapeHTML = window.escapeHTML || function(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const onReady = window.onReady || function(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
};

const getApiUrl = window.getApiUrl || function(endpoint) {
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
};

const FALLBACK_RESOURCES = [
  {
    id: "tele-manas",
    name: "Tele-MANAS (National Mental Health Helpline)",
    category: "Helpline",
    description: "Comprehensive, 24/7, free tele-mental health support provided by the Government of India, offering multi-lingual psychological first aid and counselling.",
    phone: "14416",
    website: "https://telemanas.mohfw.gov.in/",
    availability: "24/7 Toll-Free",
    location: "National (India)",
    isDemo: false
  },
  {
    id: "kiran-helpline",
    name: "KIRAN Mental Health Helpline",
    category: "Helpline",
    description: "24/7 toll-free mental health rehabilitation helpline established by the Ministry of Social Justice and Empowerment for distress management and psychological support.",
    phone: "1800-599-0019",
    website: "https://depwd.gov.in/",
    availability: "24/7 Toll-Free",
    location: "National (India)",
    isDemo: false
  },
  {
    id: "vandrevala-foundation",
    name: "Vandrevala Foundation Helpline",
    category: "Mental Well-being",
    description: "Free, confidential emotional support and psychological counselling for individuals experiencing acute stress, relationship issues, anxiety, or depression.",
    phone: "+91 9999 666 555",
    website: "https://www.vandrevalafoundation.com/",
    availability: "24/7 Free Support",
    location: "National (India)",
    isDemo: false
  },
  {
    id: "national-emergency-112",
    name: "National Emergency Support (112)",
    category: "Emergency Support",
    description: "All-in-one emergency response helpline in India for urgent situations, safety emergencies, or immediate medical crises.",
    phone: "112",
    website: "https://112.gov.in/",
    availability: "24/7 Emergency Service",
    location: "National (India)",
    isDemo: false
  },
  {
    id: "campus-counselling-centre",
    name: "Campus Counselling & Well-being Centre",
    category: "College Counselling",
    description: "On-campus confidential psychological counselling, stress-reduction workshops, and individual guidance sessions for enrolled college students.",
    phone: "+91 98765 43210",
    website: "https://example-college.edu/wellness",
    availability: "Mon - Fri, 9:00 AM - 5:00 PM",
    location: "Student Affairs Block, Room 104 (Campus)",
    isDemo: true
  },
  {
    id: "peer-support-network",
    name: "Student Peer Mentorship Network",
    category: "Student Support",
    description: "Trained senior student mentors offering empathetic listening, academic navigation advice, and peer-to-peer orientation for juniors.",
    phone: "",
    website: "https://example-college.edu/peer-support",
    availability: "Mon - Sat, 10:00 AM - 6:00 PM",
    location: "Student Activity Centre (Campus)",
    isDemo: true
  },
  {
    id: "academic-advising-cell",
    name: "Academic Advising & Dean of Students",
    category: "General Support",
    description: "Guidance on study load adjustments, exam scheduling dispensations, attendance queries, and student administrative grievances.",
    phone: "+91 98765 43211",
    website: "https://example-college.edu/advising",
    availability: "Mon - Fri, 10:00 AM - 4:00 PM",
    location: "Administrative Wing, 2nd Floor (Campus)",
    isDemo: true
  },
  {
    id: "student-financial-aid-desk",
    name: "Student Financial Assistance & Scholarship Desk",
    category: "Student Support",
    description: "Confidential advisory for emergency student hardship grants, tuition instalment options, and state/national scholarship forms.",
    phone: "+91 98765 43212",
    website: "https://example-college.edu/financial-aid",
    availability: "Tue & Thu, 11:00 AM - 3:00 PM",
    location: "Accounts Office Counter 3 (Campus)",
    isDemo: true
  },
  {
    id: "mindfulness-meditation-circle",
    name: "Mindful Living & Yoga Club",
    category: "Mental Well-being",
    description: "Weekly non-judgmental group meditation, guided breathing exercises, and relaxation circles organized by student volunteers.",
    phone: "",
    website: "https://example-college.edu/mindfulness",
    availability: "Every Wednesday & Saturday, 5:30 PM",
    location: "Campus Sports Complex / Open Lawn",
    isDemo: true
  }
];

let allResources = [];
let currentCategory = 'All';
let currentSearch = '';

onReady(() => {
  initResources();
});

async function initResources() {
  const loadingEl = document.getElementById('resourcesLoading');
  const errorEl = document.getElementById('resourcesError');

  try {
    const targetUrl = getApiUrl('/api/resources');
    let data = null;

    try {
      const res = await fetch(targetUrl);
      if (res.ok) data = await res.json();
    } catch (netErr) {
      console.warn('Network fetch to /api/resources failed, trying direct localhost:3000:', netErr);
      try {
        const directRes = await fetch('http://localhost:3000/api/resources');
        if (directRes.ok) data = await directRes.json();
      } catch (directErr) {
        console.warn('Direct localhost fetch failed:', directErr);
      }
    }

    if (data && data.success && Array.isArray(data.resources) && data.resources.length > 0) {
      allResources = data.resources;
    } else {
      console.info('Using embedded fallback resources for seamless directory display.');
      allResources = FALLBACK_RESOURCES;
    }

    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';

    setupFilters();
    filterAndRenderResources();

  } catch (err) {
    console.error('Error loading resources, using fallback:', err);
    allResources = FALLBACK_RESOURCES;
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';
    setupFilters();
    filterAndRenderResources();
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
