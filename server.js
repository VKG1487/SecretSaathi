require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper to safely read JSON files
function readJsonFile(relativePath) {
  const filePath = path.join(__dirname, relativePath);
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

// -------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------

/**
 * GET /api/health
 * Health check & environment status endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    message: 'SecretSaathi API is operational',
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/config
 * Returns general configuration and scoring scale
 */
app.get('/api/config', (req, res) => {
  try {
    const config = readJsonFile('data/config.json');
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error reading config.json:', error);
    res.status(500).json({ success: false, message: 'Could not load configuration data.' });
  }
});

/**
 * GET /api/questions
 * Returns list of non-diagnostic student well-being questions
 */
app.get('/api/questions', (req, res) => {
  try {
    const questions = readJsonFile('data/questions.json');
    const config = readJsonFile('data/config.json');
    res.json({
      success: true,
      count: questions.length,
      responseOptions: config.responseOptions,
      questions: questions
    });
  } catch (error) {
    console.error('Error reading questions.json:', error);
    res.status(500).json({ success: false, message: 'Could not load assessment questions.' });
  }
});

/**
 * GET /api/resources
 * Returns support resources with optional ?category= and ?search= filtering
 */
app.get('/api/resources', (req, res) => {
  try {
    const resources = readJsonFile('data/resources.json');
    const { category, search } = req.query;

    let filtered = [...resources];

    // Category filter
    if (category && category !== 'All') {
      filtered = filtered.filter(item => 
        item.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Search filter across name, description, category, and location
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.location && item.location.toLowerCase().includes(q))
      );
    }

    res.json({
      success: true,
      count: filtered.length,
      total: resources.length,
      resources: filtered
    });
  } catch (error) {
    console.error('Error reading resources.json:', error);
    res.status(500).json({ success: false, message: 'Could not load resources.' });
  }
});

/**
 * GET /api/resources/:id
 * Returns a single resource by its unique identifier
 */
app.get('/api/resources/:id', (req, res) => {
  try {
    const resources = readJsonFile('data/resources.json');
    const targetId = req.params.id;
    const resource = resources.find(r => String(r.id) === targetId);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: `Resource with id '${targetId}' was not found.`
      });
    }

    res.json({
      success: true,
      resource: resource
    });
  } catch (error) {
    console.error('Error reading resource by id:', error);
    res.status(500).json({ success: false, message: 'Could not load resource details.' });
  }
});

/**
 * Core scoring handler function (used by both /api/score and /api/assessment)
 */
function calculateAssessmentScore(req, res) {
  try {
    const config = readJsonFile('data/config.json');
    const questions = readJsonFile('data/questions.json');
    const allResources = readJsonFile('data/resources.json');

    const { answers } = req.body;

    if (!answers || (Array.isArray(answers) && answers.length === 0) || (typeof answers === 'object' && Object.keys(answers).length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'No answers were provided in the request body.'
      });
    }

    let totalScore = 0;
    let answeredCount = 0;

    // Support multiple incoming formats:
    // Format A: [ { questionId: 1, score: 2 }, ... ]
    // Format B: [ 2, 1, 0, 3, ... ]
    // Format C: { "1": 2, "2": 1, ... }
    if (Array.isArray(answers)) {
      answers.forEach(item => {
        if (typeof item === 'object' && item !== null && 'score' in item) {
          const s = Math.max(0, Math.min(4, Number(item.score) || 0));
          totalScore += s;
          answeredCount++;
        } else if (typeof item === 'number') {
          const s = Math.max(0, Math.min(4, item || 0));
          totalScore += s;
          answeredCount++;
        }
      });
    } else if (typeof answers === 'object' && answers !== null) {
      Object.values(answers).forEach(val => {
        const s = Math.max(0, Math.min(4, Number(val) || 0));
        totalScore += s;
        answeredCount++;
      });
    }

    // Determine category based on config thresholds
    const categories = config.categories || [];
    let matchedCategory = categories.find(cat => 
      totalScore >= cat.minScore && totalScore <= cat.maxScore
    );

    // Fallback if score exceeds highest bracket or falls below
    if (!matchedCategory && categories.length > 0) {
      if (totalScore < categories[0].minScore) {
        matchedCategory = categories[0];
      } else {
        matchedCategory = categories[categories.length - 1];
      }
    }

    // Find recommended resources for this category
    const recommendedCategories = (matchedCategory && matchedCategory.recommendedCategories) || [];
    const recommendedResources = allResources.filter(r => 
      recommendedCategories.includes(r.category)
    ).slice(0, 4);

    const maxPossibleScore = (questions.length || 10) * 4;

    res.json({
      success: true,
      totalScore: totalScore,
      maxPossibleScore: maxPossibleScore,
      answeredCount: answeredCount,
      totalQuestions: questions.length,
      category: matchedCategory ? matchedCategory.name : 'Unknown Indicator',
      categoryId: matchedCategory ? matchedCategory.id : 'unknown',
      badgeClass: matchedCategory ? matchedCategory.badgeClass : 'indicator-low',
      tag: matchedCategory ? matchedCategory.tag : 'Low',
      summary: matchedCategory ? matchedCategory.summary : '',
      explanation: matchedCategory ? matchedCategory.explanation : '',
      suggestions: matchedCategory ? matchedCategory.suggestions : [],
      recommendedResources: recommendedResources,
      disclaimer: config.disclaimer
    });

  } catch (error) {
    console.error('Error computing assessment score:', error);
    res.status(500).json({ success: false, message: 'Could not process assessment scoring.' });
  }
}

/**
 * POST /api/assessment
 * Submits assessment answers and returns calculated score and category
 */
app.post('/api/assessment', calculateAssessmentScore);

/**
 * POST /api/score
 * Alias endpoint for assessment scoring
 */
app.post('/api/score', calculateAssessmentScore);

// -------------------------------------------------------------
// CHATBOT API ROUTES
// -------------------------------------------------------------

/**
 * GET /api/chat/options
 * Returns initial greeting message and quick option chips
 */
app.get('/api/chat/options', (req, res) => {
  try {
    const chatData = readJsonFile('data/chatbot.json');
    res.json({
      success: true,
      greeting: chatData.greeting,
      topics: Object.keys(chatData.topics).map(key => ({
        key: key,
        title: chatData.topics[key].title
      }))
    });
  } catch (error) {
    console.error('Error reading chatbot.json for options:', error);
    res.status(500).json({ success: false, message: 'Could not load chatbot configuration.' });
  }
});

/**
 * POST /api/chat
 * Handles conversational queries and topic selection from the chatbot UI
 */
app.post('/api/chat', (req, res) => {
  try {
    const chatData = readJsonFile('data/chatbot.json');
    const { message, topic } = req.body;

    // 1. Topic selection handling (e.g. user clicked chip or button)
    if (topic) {
      if (topic === 'menu') {
        return res.json({
          success: true,
          type: 'greeting',
          title: chatData.greeting.title,
          message: chatData.greeting.message,
          actions: chatData.greeting.promptOptions.map(p => ({
            label: p.label,
            key: p.key,
            url: p.url
          }))
        });
      }

      if (chatData.topics[topic]) {
        const t = chatData.topics[topic];
        return res.json({
          success: true,
          type: 'topic',
          title: t.title,
          message: t.text,
          suggestions: t.suggestions || [],
          actions: t.actions || []
        });
      }
    }

    // 2. Freeform message processing
    const userText = (message || '').trim();
    if (!userText) {
      return res.status(400).json({
        success: false,
        message: 'No message text or topic was provided.'
      });
    }

    const lower = userText.toLowerCase();

    // Check Crisis / Emergency safety keywords
    const crisisMatch = chatData.crisisKeywords.some(kw => lower.includes(kw));
    if (crisisMatch) {
      return res.json({
        success: true,
        type: 'crisis',
        isCrisis: true,
        title: chatData.crisisResponse.title,
        message: chatData.crisisResponse.message,
        actions: chatData.crisisResponse.actions
      });
    }

    // Check Greetings (hi, hello, hey, etc.)
    const greetings = ['hi', 'hello', 'hey', 'start', 'begin', 'help me', 'namaste', 'good morning', 'good afternoon', 'good evening'];
    if (greetings.some(g => lower === g || lower.startsWith(g + ' '))) {
      return res.json({
        success: true,
        type: 'greeting',
        title: "Hello from SecretSaathi",
        message: "Hello! I am your student well-being companion. How can I support you today?",
        actions: chatData.greeting.promptOptions.map(p => ({
          label: p.label,
          key: p.key,
          url: p.url
        }))
      });
    }

    // Check Gratitude (thank you, thanks, etc.)
    const gratitudeWords = ['thank you', 'thanks', 'thx', 'thank u', 'appreciate it', 'grateful'];
    if (gratitudeWords.some(g => lower.includes(g))) {
      return res.json({
        success: true,
        type: 'gratitude',
        title: "You're Very Welcome!",
        message: "Taking time to reflect on your well-being is a brave and proactive step. SecretSaathi is always here for you whenever you need a pause, guidance, or support.",
        actions: [
          { text: "Take Self-Assessment", url: "assessment.html" },
          { text: "Browse Resources", url: "resources.html" },
          { text: "Main Menu", action: "menu" }
        ]
      });
    }

    // Check Farewells (bye, goodbye, see you, etc.)
    const farewellWords = ['bye', 'goodbye', 'see you', 'good night', 'take care', 'cya'];
    if (farewellWords.some(f => lower.includes(f))) {
      return res.json({
        success: true,
        type: 'farewell',
        title: "Take Care of Yourself",
        message: "Wishing you peace of mind, good rest, and success in your academic journey. Remember to pace yourself, and come back whenever you'd like to chat.",
        actions: [
          { text: "Main Menu", action: "menu" }
        ]
      });
    }

    // Check Identity / About (who are you, what can you do, etc.)
    const identityWords = ['who are you', 'what are you', 'what is secretsaathi', 'what can you do', 'tell me about yourself'];
    if (identityWords.some(i => lower.includes(i))) {
      return res.json({
        success: true,
        type: 'identity',
        title: "About SecretSaathi",
        message: "SecretSaathi is an approachable, confidential student well-being companion. I help you reflect on academic deadlines, burnout, sleep habits, and feelings of isolation, and connect you with campus support cells and verified national crisis helplines.",
        actions: chatData.greeting.promptOptions.map(p => ({
          label: p.label,
          key: p.key,
          url: p.url
        }))
      });
    }

    // Intelligent weighted keyword matching across topics
    let bestMatchKey = null;
    let bestTopicObj = null;
    let highestScore = 0;

    for (const [key, topicObj] of Object.entries(chatData.topics)) {
      if (topicObj.keywords && Array.isArray(topicObj.keywords)) {
        let score = 0;
        for (const kw of topicObj.keywords) {
          if (lower.includes(kw)) {
            // Reward exact whole word matches and longer specific keywords
            const regex = new RegExp(`\\b${kw}\\b`, 'i');
            score += regex.test(lower) ? (kw.length * 3) : kw.length;
          }
        }
        if (score > highestScore) {
          highestScore = score;
          bestMatchKey = key;
          bestTopicObj = topicObj;
        }
      }
    }

    if (bestTopicObj && highestScore > 0) {
      return res.json({
        success: true,
        type: 'topic',
        topicKey: bestMatchKey,
        title: bestTopicObj.title,
        message: bestTopicObj.text,
        suggestions: bestTopicObj.suggestions || [],
        actions: bestTopicObj.actions || []
      });
    }

    // Default conversational fallback
    res.json({
      success: true,
      type: 'fallback',
      title: "How SecretSaathi Can Help",
      message: `Thank you for sharing. SecretSaathi is a non-diagnostic companion designed to support student well-being. While I cannot provide clinical medical diagnosis, here are helpful topics we can explore:`,
      actions: chatData.greeting.promptOptions.map(p => ({
        label: p.label,
        key: p.key,
        url: p.url
      }))
    });

  } catch (error) {
    console.error('Error handling chat message:', error);
    res.status(500).json({ success: false, message: 'Could not process chat message.' });
  }
});

// -------------------------------------------------------------
// Fallback for HTML routes (direct access support)
// -------------------------------------------------------------
app.get('/assessment', (req, res) => res.sendFile(path.join(__dirname, 'public', 'assessment.html')));
app.get('/chatbot', (req, res) => res.sendFile(path.join(__dirname, 'public', 'chatbot.html')));
app.get('/results', (req, res) => res.sendFile(path.join(__dirname, 'public', 'results.html')));
app.get('/resources', (req, res) => res.sendFile(path.join(__dirname, 'public', 'resources.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'public', 'about.html')));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'public', 'privacy.html')));

// Global 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found.' });
});

// Function to start Express server with automatic fallback if port is in use
function startServer(portToUse) {
  const s = app.listen(portToUse, () => {
    console.log(`===============================================`);
    console.log(`  SecretSaathi Server Running`);
    console.log(`  URL: http://localhost:${portToUse}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`===============================================`);
  });

  s.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = Number(portToUse) + 1;
      console.warn(`[NOTICE] Port ${portToUse} is in use. Attempting port ${nextPort}...`);
      startServer(nextPort);
    } else {
      console.error('Server error:', err);
    }
  });

  return s;
}

let server = null;
if (require.main === module) {
  server = startServer(PORT);
}

module.exports = { app, startServer, server };

