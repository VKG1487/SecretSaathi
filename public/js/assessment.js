// Fallback utilities if main.js is not loaded
if (typeof window.escapeHTML !== 'function') {
  window.escapeHTML = function(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };
}

if (typeof window.onReady !== 'function') {
  window.onReady = function(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  };
}

if (typeof window.getApiUrl !== 'function') {
  window.getApiUrl = function(endpoint) {
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
}

const FALLBACK_QUESTIONS = [
  { id: 1, category: "Academic Pressure", question: "How often have you felt overwhelmed by academic deadlines, exams, or coursework expectations?", hint: "Consider your workload and assignment schedules over the past two weeks." },
  { id: 2, category: "Feeling Overwhelmed", question: "How often have you felt that difficulties were piling up so high that you could not overcome them?", hint: "Think about moments where balancing daily tasks felt unmanageable." },
  { id: 3, category: "Sleep & Rest", question: "How often have you experienced trouble falling asleep, staying asleep, or waking up unrefreshed?", hint: "Reflect on whether stress or late hours have disrupted your normal sleep cycle." },
  { id: 4, category: "Concentration", question: "How often have you found it difficult to focus, concentrate, or absorb material while studying or attending classes?", hint: "Consider moments when racing thoughts or distraction affected your attention span." },
  { id: 5, category: "Loneliness & Isolation", question: "How often have you felt isolated, lonely, or disconnected from friends, classmates, or campus life?", hint: "Reflect on how connected or supported you felt in your social circle." },
  { id: 6, category: "Motivation & Energy", question: "How often have you felt a lack of energy, interest, or motivation to attend lectures or complete routine tasks?", hint: "Think about your drive to start and finish daily activities." },
  { id: 7, category: "Personal Concerns", question: "How often have personal, family, or relationship worries preoccupied your thoughts during the day?", hint: "Consider worries outside academic coursework that occupy your mental space." },
  { id: 8, category: "Financial Concerns", question: "How often have financial worries (e.g. tuition, living expenses, books) caused you stress or anxiety?", hint: "Reflect on whether budget constraints or student expenses have weighed on your mind." },
  { id: 9, category: "Physical Stress Signs", question: "How often have you noticed physical signs of stress, such as headaches, muscle tension, or stomach discomfort?", hint: "Notice how your body physically responds when deadlines or pressures mount." },
  { id: 10, category: "General Stress & Coping", question: "How often have you felt unable to take control of important aspects of your student life or find calm?", hint: "Reflect on your overall ability to unwind, relax, and regain balance." }
];

const DEFAULT_OPTIONS = [
  { text: "Never", score: 0 },
  { text: "Rarely", score: 1 },
  { text: "Sometimes", score: 2 },
  { text: "Often", score: 3 },
  { text: "Very Often", score: 4 }
];

let questions = [];
let responseOptions = [];
let currentIndex = 0;
const userAnswers = {}; // Map: { [questionId]: score }

onReady(() => {
  initAssessment();
});

/**
 * Fetch questions and scoring options with resilient fallback
 */
async function initAssessment() {
  const loadingEl = document.getElementById('loadingState');
  const cardEl = document.getElementById('assessmentCard');
  const errorEl = document.getElementById('errorState');

  try {
    let data = null;

    if (typeof window.apiFetch === 'function') {
      try {
        const res = await window.apiFetch('/api/questions', { method: 'GET' }, 3500);
        if (res && res.ok) {
          data = await res.json();
        }
      } catch (netErr) {
        console.warn('Backend fetch to /api/questions failed:', netErr);
      }
    }

    if (data && data.success && Array.isArray(data.questions) && data.questions.length > 0) {
      questions = data.questions;
      responseOptions = data.responseOptions || DEFAULT_OPTIONS;
    } else {
      console.info('Using fallback assessment questions for seamless operation.');
      questions = FALLBACK_QUESTIONS;
      responseOptions = DEFAULT_OPTIONS;
    }

    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';
    if (cardEl) cardEl.style.display = 'block';

    renderQuestion(currentIndex);
    setupEventListeners();

  } catch (err) {
    console.error('Assessment initialization fallback error:', err);
    // Ensure the user always gets a usable assessment
    questions = FALLBACK_QUESTIONS;
    responseOptions = DEFAULT_OPTIONS;
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';
    if (cardEl) cardEl.style.display = 'block';
    renderQuestion(currentIndex);
    setupEventListeners();
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

    responseOptions.forEach((opt, optIdx) => {
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
        <span class="option-label"><span class="key-shortcut">[${optIdx + 1}]</span> ${escapeHTML(opt.text)}</span>
        <span class="option-score-hint">Score: ${opt.score}</span>
      `;

      const radio = label.querySelector('input[type="radio"]');

      function selectOption() {
        if (radio) radio.checked = true;
        userAnswers[q.id] = opt.score;
        hideValidationError();
        optionsList.querySelectorAll('.option-item').forEach(item => item.classList.remove('selected'));
        label.classList.add('selected');
      }

      if (radio) {
        radio.addEventListener('change', selectOption);
      }

      label.addEventListener('click', (e) => {
        if (e.target !== radio) {
          selectOption();
        }
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

  // Keyboard navigation: 1-5 to select, Enter to advance
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' && e.target.type !== 'radio') return;
    if (e.key >= '1' && e.key <= '5') {
      const optIdx = parseInt(e.key, 10) - 1;
      const optionsList = document.getElementById('optionsList');
      if (optionsList) {
        const labels = optionsList.querySelectorAll('.option-item');
        if (labels[optIdx]) {
          labels[optIdx].click();
        }
      }
    } else if (e.key === 'Enter') {
      if (nextBtn && !nextBtn.disabled) {
        nextBtn.click();
      }
    }
  });
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
 * Submits the completed assessment to Express REST API with client-side fallback
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

  const targetUrl = getApiUrl('/api/score');

  try {
    let resultData = null;

    if (typeof window.apiFetch === 'function') {
      try {
        const res = await window.apiFetch('/api/score', {
          method: 'POST',
          body: JSON.stringify({ answers: formattedAnswers })
        }, 4000);
        if (res && res.ok) {
          resultData = await res.json();
        }
      } catch (fetchErr) {
        console.warn('Backend submit failed:', fetchErr);
      }
    }

    if (!resultData || !resultData.success) {
      console.info('Computing assessment score locally.');
      const total = formattedAnswers.reduce((sum, item) => sum + (Number(item.score) || 0), 0);
      resultData = calculateLocalScore(total, formattedAnswers.length);
    }

    // Save result to sessionStorage for results.html to consume
    sessionStorage.setItem('secretSaathiResult', JSON.stringify(resultData));

    // Redirect to Results page
    window.location.href = 'results.html';

  } catch (err) {
    console.error('Submission error, calculating local result:', err);
    const total = formattedAnswers.reduce((sum, item) => sum + (Number(item.score) || 0), 0);
    const resultData = calculateLocalScore(total, formattedAnswers.length);
    sessionStorage.setItem('secretSaathiResult', JSON.stringify(resultData));
    window.location.href = 'results.html';
  }
}

/**
 * Local scoring calculator (fallback if backend is unreachable)
 */
function calculateLocalScore(totalScore, answeredCount = 10) {
  let category, categoryId, badgeClass, tag, summary, explanation, suggestions;

  if (totalScore <= 12) {
    categoryId = 'low';
    tag = 'Low';
    category = 'Low Stress Indicator';
    badgeClass = 'indicator-low';
    summary = 'Your responses suggest that your current stress levels are generally balanced and manageable.';
    explanation = 'A low stress indicator reflects that you appear to be coping well with day-to-day academic and personal expectations. Continuing proactive wellness routines helps sustain this positive balance.';
    suggestions = [
      'Continue your current routine of balancing study, leisure, and restful sleep.',
      'Maintain positive social connections with friends, peers, and mentors.',
      'Practice mindful pauses and regular tech-free breaks during study sessions.',
      'Keep up with personal hobbies and physical activities that bring you joy.'
    ];
  } else if (totalScore <= 24) {
    categoryId = 'moderate';
    tag = 'Moderate';
    category = 'Moderate Stress Indicator';
    badgeClass = 'indicator-moderate';
    summary = 'Your responses suggest recurring stress that may be affecting your focus, energy, or peace of mind.';
    explanation = 'A moderate stress indicator is common among students during exam cycles, project submissions, or transitions. Addressing these feelings early helps prevent burnout and restores your daily rhythm.';
    suggestions = [
      'Take regular study breaks (such as 5-10 minutes every hour) to avoid cognitive fatigue.',
      'Maintain a consistent sleep routine aiming for 7-8 hours of quality rest.',
      'Talk to someone you trust—a friend, family member, or mentor—about what you are feeling.',
      'Make intentional time for activities and exercise outside of your academic syllabus.',
      'Consider visiting your campus student support cell if pressure feels persistent.'
    ];
  } else {
    categoryId = 'high';
    tag = 'High';
    category = 'High Stress Indicator';
    badgeClass = 'indicator-high';
    summary = 'Your responses suggest you are experiencing a significant amount of stress and emotional strain.';
    explanation = 'A high stress indicator signals that academic, personal, or emotional pressures may feel burdensome right now. Experiencing high stress is not a weakness; it is an important signal that your mind and body need care, pacing, and human support.';
    suggestions = [
      'Pause and break down large tasks into one small, manageable step at a time.',
      'Consider scheduling a confidential conversation with a college counsellor or student advisor.',
      'Reach out to trusted friends, family, or campus support staff to share your load.',
      'Give yourself permission to pause non-essential commitments temporarily.',
      'If you feel deeply overwhelmed or unable to cope, please connect with one of the free, confidential student helplines.'
    ];
  }

  const recommendedResources = [
    {
      id: 'tele-manas',
      name: 'Tele-MANAS (National Mental Health Helpline)',
      category: 'Helpline',
      description: 'Comprehensive, 24/7, free tele-mental health support provided by the Government of India, offering multi-lingual psychological first aid and counselling.',
      phone: '14416',
      website: 'https://telemanas.mohfw.gov.in/',
      availability: '24/7 Toll-Free',
      location: 'National (India)',
      isDemo: false
    },
    {
      id: 'kiran-helpline',
      name: 'KIRAN Mental Health Helpline',
      category: 'Helpline',
      description: '24/7 toll-free mental health rehabilitation helpline established by the Ministry of Social Justice and Empowerment.',
      phone: '1800-599-0019',
      website: 'https://depwd.gov.in/',
      availability: '24/7 Toll-Free',
      location: 'National (India)',
      isDemo: false
    },
    {
      id: 'campus-counselling-centre',
      name: 'Campus Counselling & Well-being Centre',
      category: 'College Counselling',
      description: 'On-campus confidential psychological counselling, stress-reduction workshops, and individual guidance sessions.',
      phone: '+91 98765 43210',
      website: 'https://example-college.edu/wellness',
      availability: 'Mon - Fri, 9:00 AM - 5:00 PM',
      location: 'Student Affairs Block, Room 104 (Campus)',
      isDemo: true
    }
  ];

  return {
    success: true,
    totalScore: totalScore,
    maxPossibleScore: 40,
    answeredCount: answeredCount,
    totalQuestions: 10,
    category: category,
    categoryId: categoryId,
    badgeClass: badgeClass,
    tag: tag,
    summary: summary,
    explanation: explanation,
    suggestions: suggestions,
    recommendedResources: recommendedResources
  };
}
