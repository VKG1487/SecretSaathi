/**
 * SecretSaathi - Self-Assessment Logic
 * Handles question pagination, response tracking, validation, and submission
 */

let questions = [];
let responseOptions = [];
let currentIndex = 0;
const userAnswers = {}; // Map: { [questionId]: score }

document.addEventListener('DOMContentLoaded', () => {
  initAssessment();
});

/**
 * Fetch questions and scoring options from Express API
 */
async function initAssessment() {
  const loadingEl = document.getElementById('loadingState');
  const cardEl = document.getElementById('assessmentCard');
  const errorEl = document.getElementById('errorState');

  try {
    const res = await fetch('/api/questions');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    
    const data = await res.json();
    if (!data.success || !data.questions || data.questions.length === 0) {
      throw new Error('Failed to retrieve questions.');
    }

    questions = data.questions;
    responseOptions = data.responseOptions || [
      { text: "Never", score: 0 },
      { text: "Rarely", score: 1 },
      { text: "Sometimes", score: 2 },
      { text: "Often", score: 3 },
      { text: "Very Often", score: 4 }
    ];

    if (loadingEl) loadingEl.style.display = 'none';
    if (cardEl) cardEl.style.display = 'block';

    renderQuestion(currentIndex);
    setupEventListeners();

  } catch (err) {
    console.error('Assessment initialization error:', err);
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.innerHTML = `
        <p><strong>Error loading assessment questions.</strong></p>
        <p>Please check if the local server is running and try again.</p>
        <button class="btn btn-secondary btn-sm" onclick="location.reload()" style="margin-top: 10px;">Retry</button>
      `;
    }
  }
}

/**
 * Renders the question at the specified index
 */
function renderQuestion(index) {
  const q = questions[index];
  if (!q) return;

  // Clear validation alert
  hideValidationError();

  // Update progress indicators
  const total = questions.length;
  const currentNum = index + 1;
  const progressPercent = Math.round((currentNum / total) * 100);

  const progressLabel = document.getElementById('progressLabel');
  const progressBarFill = document.getElementById('progressBarFill');
  const progressPercentText = document.getElementById('progressPercent');

  if (progressLabel) progressLabel.textContent = `Question ${currentNum} of ${total}`;
  if (progressBarFill) progressBarFill.style.width = `${progressPercent}%`;
  if (progressPercentText) progressPercentText.textContent = `${progressPercent}%`;

  // Update category, question text & hint
  const categoryTag = document.getElementById('questionCategory');
  const titleEl = document.getElementById('questionTitle');
  const hintEl = document.getElementById('questionHint');

  if (categoryTag) categoryTag.textContent = q.category || 'General Well-being';
  if (titleEl) titleEl.textContent = q.question;
  if (hintEl) hintEl.textContent = q.hint || '';

  // Render options list
  const optionsList = document.getElementById('optionsList');
  if (optionsList) {
    optionsList.innerHTML = '';

    responseOptions.forEach((opt) => {
      const isSelected = userAnswers[q.id] === opt.score;

      const label = document.createElement('label');
      label.className = `option-item ${isSelected ? 'selected' : ''}`;
      label.setAttribute('for', `opt_${q.id}_${opt.score}`);

      label.innerHTML = `
        <input 
          type="radio" 
          id="opt_${q.id}_${opt.score}" 
          name="q_${q.id}" 
          value="${opt.score}" 
          class="option-radio"
          ${isSelected ? 'checked' : ''}
        >
        <span class="option-label">${opt.text}</span>
        <span class="option-score-hint">Score: ${opt.score}</span>
      `;

      // Option selection click handler
      label.addEventListener('click', () => {
        userAnswers[q.id] = opt.score;
        hideValidationError();
        // Update styling of sibling options
        document.querySelectorAll('.option-item').forEach(item => item.classList.remove('selected'));
        label.classList.add('selected');
      });

      optionsList.appendChild(label);
    });
  }

  // Update navigation buttons
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (prevBtn) {
    prevBtn.disabled = (index === 0);
  }

  if (nextBtn) {
    if (index === total - 1) {
      nextBtn.innerHTML = `Complete Assessment &rarr;`;
      nextBtn.classList.add('btn-teal');
      nextBtn.classList.remove('btn-primary');
    } else {
      nextBtn.innerHTML = `Next Question &rarr;`;
      nextBtn.classList.add('btn-primary');
      nextBtn.classList.remove('btn-teal');
    }
  }
}

/**
 * Setup Previous / Next / Submit button listeners
 */
function setupEventListeners() {
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) {
        currentIndex--;
        renderQuestion(currentIndex);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const currentQ = questions[currentIndex];

      // Validate answer selection
      if (userAnswers[currentQ.id] === undefined) {
        showValidationError('Please select an option before moving to the next question.');
        return;
      }

      // Check if last question
      if (currentIndex === questions.length - 1) {
        submitAssessment();
      } else {
        currentIndex++;
        renderQuestion(currentIndex);
      }
    });
  }
}

/**
 * Display inline validation warning
 */
function showValidationError(message) {
  const alertEl = document.getElementById('validationAlert');
  if (alertEl) {
    alertEl.textContent = message;
    alertEl.style.display = 'block';
  }
}

function hideValidationError() {
  const alertEl = document.getElementById('validationAlert');
  if (alertEl) {
    alertEl.style.display = 'none';
  }
}

/**
 * Submits the completed assessment to Express REST API
 */
async function submitAssessment() {
  const nextBtn = document.getElementById('nextBtn');
  if (nextBtn) {
    nextBtn.disabled = true;
    nextBtn.innerHTML = 'Calculating Results...';
  }

  // Format answers payload
  const formattedAnswers = Object.entries(userAnswers).map(([qId, score]) => ({
    questionId: Number(qId),
    score: Number(score)
  }));

  try {
    const res = await fetch('/api/score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ answers: formattedAnswers })
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const resultData = await res.json();

    if (!resultData.success) {
      throw new Error(resultData.message || 'Scoring calculation failed.');
    }

    // Save result to sessionStorage for results.html to consume
    sessionStorage.setItem('secretSaathiResult', JSON.stringify(resultData));

    // Redirect to Results page
    window.location.href = 'results.html';

  } catch (err) {
    console.error('Submission error:', err);
    showValidationError('There was a problem submitting your assessment. Please try again.');
    if (nextBtn) {
      nextBtn.disabled = false;
      nextBtn.innerHTML = 'Complete Assessment &rarr;';
    }
  }
}
