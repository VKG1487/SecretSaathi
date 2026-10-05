/**
 * SecretSaathi - Assessment Results Display
 * Renders calculated stress indicators, suggestions, and personalized resources
 */

document.addEventListener('DOMContentLoaded', () => {
  loadResults();
});

function loadResults() {
  const stored = sessionStorage.getItem('secretSaathiResult');
  const noResultEl = document.getElementById('noResultsState');
  const resultContentEl = document.getElementById('resultsContent');

  if (!stored) {
    if (noResultEl) noResultEl.style.display = 'block';
    if (resultContentEl) resultContentEl.style.display = 'none';
    return;
  }

  try {
    const data = JSON.parse(stored);
    if (noResultEl) noResultEl.style.display = 'none';
    if (resultContentEl) resultContentEl.style.display = 'block';

    renderResultsData(data);
  } catch (err) {
    console.error('Error parsing stored assessment result:', err);
    if (noResultEl) noResultEl.style.display = 'block';
    if (resultContentEl) resultContentEl.style.display = 'none';
  }
}

/**
 * Populate DOM elements with the scoring results
 */
function renderResultsData(data) {
  // Score & Indicator Header
  const badgeEl = document.getElementById('indicatorBadge');
  const scoreEl = document.getElementById('scoreText');
  const summaryEl = document.getElementById('summaryText');
  const explanationEl = document.getElementById('explanationText');

  const tag = data.tag || 'Assessment Result';
  const categoryName = data.category || 'Stress Indicator';
  const totalScore = data.totalScore !== undefined ? data.totalScore : 0;
  const maxScore = data.maxPossibleScore || 40;

  if (badgeEl) {
    badgeEl.textContent = `Stress Indicator: ${tag}`;
    badgeEl.className = `indicator-badge-large ${data.badgeClass || 'indicator-low'}`;
  }

  if (scoreEl) {
    scoreEl.textContent = `Score: ${totalScore} / ${maxScore}`;
  }

  if (summaryEl) {
    summaryEl.textContent = data.summary || 'Thank you for completing the self-assessment.';
  }

  if (explanationEl) {
    explanationEl.textContent = data.explanation || '';
  }

  // Suggestions List
  const suggestionsListEl = document.getElementById('suggestionsList');
  if (suggestionsListEl) {
    suggestionsListEl.innerHTML = '';
    const suggestions = data.suggestions || [
      'Take regular study breaks to restore focus.',
      'Maintain a consistent sleep routine.',
      'Talk to someone you trust about your feelings.',
      'Schedule dedicated time for non-academic activities.'
    ];

    suggestions.forEach(suggestion => {
      const li = document.createElement('li');
      li.className = 'suggestion-item';
      li.innerHTML = `
        <span class="suggestion-bullet">&#10003;</span>
        <span>${escapeHTML(suggestion)}</span>
      `;
      suggestionsListEl.appendChild(li);
    });
  }

  // Recommended Resources
  const recGrid = document.getElementById('recommendedResourcesGrid');
  if (recGrid) {
    recGrid.innerHTML = '';
    const resources = data.recommendedResources || [];

    if (resources.length === 0) {
      recGrid.innerHTML = `
        <p style="grid-column: 1 / -1; color: var(--text-muted); font-size: 0.9rem;">
          Visit the <a href="resources.html">Resources page</a> to view all campus and helpline services.
        </p>
      `;
    } else {
      resources.forEach(res => {
        const card = document.createElement('div');
        card.className = 'rec-card';
        card.innerHTML = `
          <div style="margin-bottom: 6px;">
            <span class="badge badge-category">${escapeHTML(res.category)}</span>
            ${res.isDemo ? '<span class="badge badge-demo">Campus Demo</span>' : ''}
          </div>
          <h4>${escapeHTML(res.name)}</h4>
          <p>${escapeHTML(res.description)}</p>
          <div style="font-size: 0.78rem; color: var(--text-light); margin-bottom: 10px;">
            ${res.availability ? `<span>&#128337; ${escapeHTML(res.availability)}</span>` : ''}
          </div>
          <div style="display: flex; gap: 6px; margin-top: auto;">
            ${res.phone ? `<a href="tel:${escapeHTML(res.phone)}" class="btn btn-secondary btn-sm">&#9742; Call</a>` : ''}
            ${res.website ? `<a href="${escapeHTML(res.website)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">&#127760; Website</a>` : ''}
          </div>
        `;
        recGrid.appendChild(card);
      });
    }
  }
}
