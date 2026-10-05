/**
 * SecretSaathi - Predefined Rule-Based Chatbot
 * Provides guided, non-diagnostic student well-being conversations and suggestions.
 */

// Predefined Conversation Knowledge Base
const CHATBOT_KNOWLEDGE_BASE = {
  academic: {
    title: "Academic Stress",
    text: "Academic pressure is very common during coursework submissions and exam periods. When syllabus loads feel heavy, it helps to break assignments into 25-30 minute focused blocks (the Pomodoro technique), organize a simple daily checklist, and celebrate small completions.",
    suggestions: [
      "Break study sessions into 25-minute focused blocks with 5-minute pauses.",
      "Reach out to course professors or peer study groups for conceptual doubts.",
      "Remember that your worth as a person is not defined solely by grades."
    ],
    actions: [
      { text: "Start Self-Assessment", url: "assessment.html" },
      { text: "View Campus & Study Resources", url: "resources.html" },
      { text: "Return to Main Menu", action: "menu" }
    ]
  },
  overwhelmed: {
    title: "Feeling Overwhelmed",
    text: "When things pile up all at once, your mind can feel saturated. Take a deep, slow breath right now. Inhale for 4 seconds, hold for 4 seconds, and exhale slowly for 4 seconds. Right now, you do not need to solve everything today—just identify one small thing you can control.",
    suggestions: [
      "Step away from your screen or study desk for 10 minutes.",
      "Write down everything on your mind on paper to declutter your thoughts.",
      "Pick just ONE small task to complete, and defer the rest."
    ],
    actions: [
      { text: "Take 3-Minute Assessment", url: "assessment.html" },
      { text: "Find Support Resources", url: "resources.html" },
      { text: "Return to Main Menu", action: "menu" }
    ]
  },
  sleep: {
    title: "Sleep & Rest",
    text: "Sleep directly influences emotional stability, memory retention, and energy levels. Late-night cramming often causes diminishing returns because your brain needs REM sleep to consolidate what you have learned.",
    suggestions: [
      "Put away phone and laptop screens 30 minutes before bed.",
      "Keep a consistent wake-up time, even on weekends.",
      "Limit caffeinated drinks (tea, coffee, energy drinks) after 5:00 PM."
    ],
    actions: [
      { text: "Explore Well-being Resources", url: "resources.html" },
      { text: "Check Your Stress Indicator", url: "assessment.html" },
      { text: "Return to Main Menu", action: "menu" }
    ]
  },
  loneliness: {
    title: "Loneliness & Feeling Disconnected",
    text: "College campuses can feel crowded yet lonely at the same time. Many students quietly experience feelings of isolation while assuming everyone else has it figured out. You are not alone in feeling this way.",
    suggestions: [
      "Try sending a simple check-in message to an old friend or family member.",
      "Consider joining a campus club, volunteer group, or sports activity.",
      "Spend some study time in a shared campus library or student commons."
    ],
    actions: [
      { text: "Find Peer Support & Clubs", url: "resources.html" },
      { text: "Start Self-Assessment", url: "assessment.html" },
      { text: "Return to Main Menu", action: "menu" }
    ]
  },
  personal: {
    title: "Personal Concerns & Worries",
    text: "Balancing family expectations, relationship changes, financial adjustments, and personal identity can create substantial background stress for students.",
    suggestions: [
      "Acknowledge your feelings without judging yourself for having them.",
      "Speak with a trusted confidant, mentor, or campus counsellor.",
      "Remember that seeking support is a sign of proactive strength, not weakness."
    ],
    actions: [
      { text: "View Counselling Services", url: "resources.html" },
      { text: "Start Self-Assessment", url: "assessment.html" },
      { text: "Return to Main Menu", action: "menu" }
    ]
  },
  support: {
    title: "Find Support",
    text: "SecretSaathi maintains a curated list of both verified national student helplines (such as Tele-MANAS and KIRAN) and template campus counselling services for confidential assistance.",
    suggestions: [
      "Helpline services are free, confidential, and available 24/7.",
      "Campus counselling cells offer student-friendly guidance for daily challenges."
    ],
    actions: [
      { text: "Open Resources Directory", url: "resources.html" },
      { text: "Start Self-Assessment", url: "assessment.html" },
      { text: "Return to Main Menu", action: "menu" }
    ]
  }
};

const MAIN_OPTIONS = [
  { label: "Academic Stress", key: "academic" },
  { label: "Feeling Overwhelmed", key: "overwhelmed" },
  { label: "Sleep & Rest", key: "sleep" },
  { label: "Loneliness", key: "loneliness" },
  { label: "Personal Concerns", key: "personal" },
  { label: "Start Self-Assessment", url: "assessment.html" },
  { label: "Find Support", key: "support" }
];

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

onReady(() => {
  initChatbot();
});

function initChatbot() {
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const quickOptionsEl = document.getElementById('chatQuickOptions');
  const resetBtn = document.getElementById('clearChatBtn');

  // Render initial greeting
  renderBotGreeting();

  // Setup quick option chips at bottom
  renderQuickOptionChips();

  // Send message listeners
  if (sendBtn && chatInput) {
    sendBtn.addEventListener('click', handleUserSend);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleUserSend();
      }
    });
  }

  // Clear chat listener
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (chatMessages) chatMessages.innerHTML = '';
      renderBotGreeting();
      renderQuickOptionChips();
    });
  }
}

function renderBotGreeting() {
  appendBotMessage(
    "Hi, I'm <strong>SecretSaathi</strong>, your student well-being companion. What would you like help with today?",
    MAIN_OPTIONS
  );
}

function renderQuickOptionChips() {
  const quickOptionsEl = document.getElementById('chatQuickOptions');
  if (!quickOptionsEl) return;

  quickOptionsEl.innerHTML = '';
  MAIN_OPTIONS.forEach(opt => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'quick-chip';
    chip.textContent = opt.label;
    chip.addEventListener('click', () => {
      if (opt.url) {
        window.location.href = opt.url;
      } else {
        handleOptionSelection(opt.label, opt.key);
      }
    });
    quickOptionsEl.appendChild(chip);
  });
}

/**
 * Handle when user clicks an option chip or interactive button
 */
function handleOptionSelection(label, key) {
  // Append user bubble
  appendUserMessage(label);
  showTypingIndicator();

  // Bot response after short natural delay
  setTimeout(() => {
    removeTypingIndicator();
    respondToTopic(key);
  }, 450);
}

/**
 * Renders bot response for a specific knowledge base key
 */
function respondToTopic(key) {
  if (key === 'menu') {
    renderBotGreeting();
    return;
  }

  const topic = CHATBOT_KNOWLEDGE_BASE[key];
  if (topic) {
    let html = `<p><strong>${escapeHTML(topic.title)}</strong></p>`;
    html += `<p style="margin-top: 6px;">${escapeHTML(topic.text)}</p>`;
    
    if (topic.suggestions && topic.suggestions.length > 0) {
      html += `<ul style="margin: 8px 0 8px 18px; font-size: 0.88rem;">`;
      topic.suggestions.forEach(s => {
        html += `<li>${escapeHTML(s)}</li>`;
      });
      html += `</ul>`;
    }

    appendBotMessage(html, topic.actions);
  } else {
    appendBotMessage(
      "I'm here to assist you with student well-being topics. Please select an area you'd like to explore:",
      MAIN_OPTIONS
    );
  }
}

/**
 * Handle freeform text input with keyword matching
 */
function handleUserSend() {
  const inputEl = document.getElementById('chatInput');
  if (!inputEl) return;

  const rawText = inputEl.value.trim();
  if (!rawText) return;

  // Clear input
  inputEl.value = '';

  // Append user message
  appendUserMessage(rawText);
  showTypingIndicator();

  // Bot processes query without adding a duplicate user bubble
  setTimeout(() => {
    removeTypingIndicator();
    processUserInput(rawText);
  }, 500);
}

window.handleUserSend = handleUserSend;

function processUserInput(text) {
  const q = text.toLowerCase();

  // 1. Safety & Crisis keywords check
  if (q.includes('suicid') || q.includes('kill myself') || q.includes('end my life') || q.includes('die') || q.includes('self-harm') || q.includes('harm myself')) {
    appendBotMessage(
      `<div style="color: #991b1b; font-weight: 600; margin-bottom: 6px;">&#9888; Immediate Confidential Support Available</div>
       <p>If you are experiencing acute emotional pain or having thoughts of self-harm, please know that you are not alone and free, confidential support is available right now:</p>
       <ul style="margin: 8px 0 8px 18px; font-size: 0.9rem;">
         <li><strong>Tele-MANAS (Govt. of India):</strong> Call <a href="tel:14416" style="color:var(--teal); font-weight:700;">14416</a> (24/7 Toll-Free)</li>
         <li><strong>KIRAN Helpline:</strong> Call <a href="tel:18005990019" style="color:var(--teal); font-weight:700;">1800-599-0019</a> (24/7 Toll-Free)</li>
         <li><strong>National Emergency Services:</strong> Call <a href="tel:112" style="color:#991b1b; font-weight:700;">112</a></li>
       </ul>
       <p style="margin-top: 6px;">Please reach out to one of these free helplines or contact a trusted friend or counsellor.</p>`,
      [
        { text: "View Emergency Support", url: "resources.html?category=Emergency%20Support" },
        { text: "Return to Menu", action: "menu" }
      ]
    );
    return;
  }

  // 2. Thematic keyword routing
  if (q.includes('exam') || q.includes('study') || q.includes('academic') || q.includes('assignment') || q.includes('grade') || q.includes('marks')) {
    respondToTopic("academic");
  } else if (q.includes('overwhelm') || q.includes('stress') || q.includes('pressure') || q.includes('burnout') || q.includes('tired')) {
    respondToTopic("overwhelmed");
  } else if (q.includes('sleep') || q.includes('insomnia') || q.includes('rest') || q.includes('night') || q.includes('wake')) {
    respondToTopic("sleep");
  } else if (q.includes('lonel') || q.includes('alone') || q.includes('friend') || q.includes('isolate') || q.includes('connect')) {
    respondToTopic("loneliness");
  } else if (q.includes('personal') || q.includes('family') || q.includes('relation') || q.includes('money') || q.includes('finance')) {
    respondToTopic("personal");
  } else if (q.includes('assess') || q.includes('test') || q.includes('quiz') || q.includes('score') || q.includes('indicator')) {
    appendBotMessage(
      "You can take our non-diagnostic 10-question self-assessment right now. It takes about 2-3 minutes.",
      [
        { text: "Start Self-Assessment &rarr;", url: "assessment.html" },
        { text: "Return to Menu", action: "menu" }
      ]
    );
  } else if (q.includes('help') || q.includes('resource') || q.includes('counsel') || q.includes('contact') || q.includes('call') || q.includes('number')) {
    respondToTopic("support");
  } else {
    // Helpful default response
    appendBotMessage(
      `Thank you for sharing. SecretSaathi is a non-diagnostic informational companion for student well-being. While I cannot offer therapy, here are common areas we can explore:`,
      MAIN_OPTIONS
    );
  }
}

/**
 * Display typing indicator
 */
function showTypingIndicator() {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;

  removeTypingIndicator();

  const typingRow = document.createElement('div');
  typingRow.id = 'typingIndicatorRow';
  typingRow.className = 'message-row message-bot';
  typingRow.innerHTML = `
    <div class="message-bubble typing-bubble" aria-label="SecretSaathi is typing">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
  `;
  chatMessages.appendChild(typingRow);
  scrollToBottom();
}

function removeTypingIndicator() {
  const row = document.getElementById('typingIndicatorRow');
  if (row) row.remove();
}

/**
 * Append bot message bubble with optional action buttons
 */
function appendBotMessage(htmlContent, actionButtons = []) {
  removeTypingIndicator();
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;

  const row = document.createElement('div');
  row.className = 'message-row message-bot';

  let actionsHtml = '';
  if (actionButtons && actionButtons.length > 0) {
    actionsHtml = `<div class="message-actions">`;
    actionButtons.forEach(btn => {
      if (btn.url) {
        actionsHtml += `<a href="${btn.url}" class="btn btn-outline-primary btn-sm">${escapeHTML(btn.text || btn.label)}</a>`;
      } else if (btn.action === 'menu') {
        actionsHtml += `<button type="button" class="btn btn-secondary btn-sm action-btn-menu">${escapeHTML(btn.text || 'Menu')}</button>`;
      } else if (btn.key) {
        actionsHtml += `<button type="button" class="btn btn-secondary btn-sm action-btn-topic" data-key="${btn.key}" data-label="${escapeHTML(btn.label || btn.text)}">${escapeHTML(btn.label || btn.text)}</button>`;
      }
    });
    actionsHtml += `</div>`;
  }

  row.innerHTML = `
    <div class="message-bubble">
      ${htmlContent}
      ${actionsHtml}
    </div>
    <span class="message-time">${getCurrentTimeString()}</span>
  `;

  chatMessages.appendChild(row);

  // Attach button event listeners
  row.querySelectorAll('.action-btn-menu').forEach(btn => {
    btn.addEventListener('click', () => {
      handleOptionSelection("Return to Main Menu", "menu");
    });
  });

  row.querySelectorAll('.action-btn-topic').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-key');
      const label = btn.getAttribute('data-label');
      handleOptionSelection(label, key);
    });
  });

  scrollToBottom();
}

/**
 * Append user message bubble
 */
function appendUserMessage(text) {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;

  const row = document.createElement('div');
  row.className = 'message-row message-user';
  row.innerHTML = `
    <div class="message-bubble">
      ${escapeHTML(text)}
    </div>
    <span class="message-time">${getCurrentTimeString()}</span>
  `;

  chatMessages.appendChild(row);
  scrollToBottom();
}

function scrollToBottom() {
  const chatMessages = document.getElementById('chatMessages');
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

function getCurrentTimeString() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}
