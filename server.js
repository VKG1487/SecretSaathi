const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
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

    if (!answers) {
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
          totalScore += Number(item.score) || 0;
          answeredCount++;
        } else if (typeof item === 'number') {
          totalScore += item;
          answeredCount++;
        }
      });
    } else if (typeof answers === 'object' && answers !== null) {
      Object.values(answers).forEach(val => {
        totalScore += Number(val) || 0;
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

// Start Express Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  SecretSaathi Server Running`);
  console.log(`  URL: http://localhost:${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`===============================================`);
});
