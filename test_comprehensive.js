const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: body.startsWith('{') || body.startsWith('[') ? JSON.parse(body) : body });
        } catch (e) {
          resolve({ status: res.statusCode, body: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function runComprehensiveTests() {
  console.log('====================================================');
  console.log('  STARTING COMPREHENSIVE SECRETSAATHI TEST SUITE   ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Health check
  console.log('>>> 1. Testing Health & Config Endpoints');
  const health = await request({ host: 'localhost', port: 3000, path: '/api/health', method: 'GET' });
  assert(health.status === 200 && health.body.status === 'healthy', 'GET /api/health returns 200 and healthy status');

  const config = await request({ host: 'localhost', port: 3000, path: '/api/config', method: 'GET' });
  assert(config.status === 200 && config.body.data?.appName === 'SecretSaathi', 'GET /api/config returns app configuration');

  // 2. Self-Assessment Questions & Scoring
  console.log('\n>>> 2. Testing Self-Assessment & Scoring Logic');
  const questions = await request({ host: 'localhost', port: 3000, path: '/api/questions', method: 'GET' });
  assert(questions.status === 200 && questions.body.count === 10, 'GET /api/questions returns exactly 10 questions');
  assert(Array.isArray(questions.body.responseOptions) && questions.body.responseOptions.length === 5, 'Response options contains 5-point scale (0-4)');

  const lowScore = await request({
    host: 'localhost', port: 3000, path: '/api/score', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { answers: Array.from({ length: 10 }, (_, i) => ({ questionId: i + 1, score: 0 })) });
  assert(lowScore.status === 200 && lowScore.body.tag === 'Low' && lowScore.body.totalScore === 0, 'POST /api/score correctly calculates Low Stress Indicator (score 0)');

  const modScore = await request({
    host: 'localhost', port: 3000, path: '/api/score', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { answers: Array.from({ length: 10 }, (_, i) => ({ questionId: i + 1, score: 2 })) });
  assert(modScore.status === 200 && modScore.body.tag === 'Moderate' && modScore.body.totalScore === 20, 'POST /api/score correctly calculates Moderate Stress Indicator (score 20)');

  const highScore = await request({
    host: 'localhost', port: 3000, path: '/api/score', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { answers: Array.from({ length: 10 }, (_, i) => ({ questionId: i + 1, score: 4 })) });
  assert(highScore.status === 200 && highScore.body.tag === 'High' && highScore.body.totalScore === 40, 'POST /api/score correctly calculates High Stress Indicator (score 40)');

  const emptyValidation = await request({
    host: 'localhost', port: 3000, path: '/api/score', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { answers: [] });
  assert(emptyValidation.status === 400, 'POST /api/score rejects empty answers with 400 Bad Request');

  // 3. Resources Directory Endpoints
  console.log('\n>>> 3. Testing Resources Directory API');
  const allRes = await request({ host: 'localhost', port: 3000, path: '/api/resources', method: 'GET' });
  assert(allRes.status === 200 && allRes.body.count >= 9, `GET /api/resources returns all resources (${allRes.body.count})`);

  const catFilter = await request({ host: 'localhost', port: 3000, path: '/api/resources?category=Helpline', method: 'GET' });
  assert(catFilter.status === 200 && catFilter.body.resources.every(r => r.category === 'Helpline'), 'GET /api/resources?category=Helpline filters by category');

  const searchFilter = await request({ host: 'localhost', port: 3000, path: '/api/resources?search=Tele-MANAS', method: 'GET' });
  assert(searchFilter.status === 200 && searchFilter.body.resources[0]?.id === 'tele-manas', 'GET /api/resources?search=Tele-MANAS returns Tele-MANAS');

  const singleRes = await request({ host: 'localhost', port: 3000, path: '/api/resources/tele-manas', method: 'GET' });
  assert(singleRes.status === 200 && singleRes.body.resource?.name.includes('Tele-MANAS'), 'GET /api/resources/tele-manas returns single resource');

  const invalidRes = await request({ host: 'localhost', port: 3000, path: '/api/resources/non-existent-id', method: 'GET' });
  assert(invalidRes.status === 404, 'GET /api/resources/non-existent-id returns 404 Not Found');

  // 4. Conversational Non-Diagnostic Chatbot Conversations
  console.log('\n>>> 4. Testing Chatbot Conversations & Intent Routing');
  const chatOptions = await request({ host: 'localhost', port: 3000, path: '/api/chat/options', method: 'GET' });
  assert(chatOptions.status === 200 && chatOptions.body.topics?.length >= 7, 'GET /api/chat/options returns prompt topics');

  // Conversation 1: Greeting
  const cGreeting = await request({
    host: 'localhost', port: 3000, path: '/api/chat', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { message: 'hello SecretSaathi' });
  assert(cGreeting.status === 200 && cGreeting.body.type === 'greeting', 'Conversation: Greeting recognized');

  // Conversation 2: Academic stress
  const cAcademic = await request({
    host: 'localhost', port: 3000, path: '/api/chat', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { message: 'I have severe exam stress and my finals are tomorrow' });
  assert(cAcademic.status === 200 && cAcademic.body.topicKey === 'academic', 'Conversation: Academic stress routed to Pomodoro & study suggestions');

  // Conversation 3: Feeling overwhelmed & burnout
  const cOverwhelmed = await request({
    host: 'localhost', port: 3000, path: '/api/chat', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { message: 'Everything is too much and I feel overwhelmed and tired' });
  assert(cOverwhelmed.status === 200 && cOverwhelmed.body.topicKey === 'overwhelmed', 'Conversation: Overwhelmed routed to 4-4-4 breathing guidance');

  // Conversation 4: Emotional heaviness / feeling sad
  const cEmotional = await request({
    host: 'localhost', port: 3000, path: '/api/chat', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { message: 'I have been feeling really sad, down and depressed lately' });
  assert(cEmotional.status === 200 && cEmotional.body.topicKey === 'emotional', 'Conversation: Emotional sadness routed to gentle validation & support');

  // Conversation 5: Sleep issues
  const cSleep = await request({
    host: 'localhost', port: 3000, path: '/api/chat', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { message: 'I cannot sleep at night due to racing thoughts' });
  assert(cSleep.status === 200 && cSleep.body.topicKey === 'sleep', 'Conversation: Insomnia/sleep routed to sleep hygiene tips');

  // Conversation 6: Loneliness & social disconnect
  const cLoneliness = await request({
    host: 'localhost', port: 3000, path: '/api/chat', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { message: 'I feel very lonely and isolated on campus with no friends' });
  assert(cLoneliness.status === 200 && cLoneliness.body.topicKey === 'loneliness', 'Conversation: Loneliness routed to peer support & club guidance');

  // Conversation 7: Personal / Financial concerns
  const cPersonal = await request({
    host: 'localhost', port: 3000, path: '/api/chat', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { message: 'I am stressed about money and family expectations' });
  assert(cPersonal.status === 200 && cPersonal.body.topicKey === 'personal', 'Conversation: Personal worries routed to counselling advice');

  // Conversation 8: Help & Helplines inquiry
  const cSupport = await request({
    host: 'localhost', port: 3000, path: '/api/chat', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { message: 'Can you give me helpline phone numbers for support?' });
  assert(cSupport.status === 200 && cSupport.body.topicKey === 'support', 'Conversation: Help request routed to verified helpline numbers');

  // Conversation 9: Crisis / Emergency detection
  const cCrisis = await request({
    host: 'localhost', port: 3000, path: '/api/chat', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { message: 'I want to kill myself' });
  assert(cCrisis.status === 200 && cCrisis.body.isCrisis === true && cCrisis.body.message.includes('14416'), 'Conversation: Crisis triggers emergency banner with Tele-MANAS (14416)');

  // Conversation 10: Gratitude
  const cThanks = await request({
    host: 'localhost', port: 3000, path: '/api/chat', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { message: 'thank you so much' });
  assert(cThanks.status === 200 && cThanks.body.type === 'gratitude', 'Conversation: Gratitude recognized warmly');

  // Conversation 11: Farewell
  const cBye = await request({
    host: 'localhost', port: 3000, path: '/api/chat', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { message: 'goodbye, talk to you later' });
  assert(cBye.status === 200 && cBye.body.type === 'farewell', 'Conversation: Farewell handled gracefully');

  // Conversation 12: Topic selection via button/chip
  const cTopicSleep = await request({
    host: 'localhost', port: 3000, path: '/api/chat', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { topic: 'sleep' });
  assert(cTopicSleep.status === 200 && cTopicSleep.body.title.includes('Sleep'), 'Topic selection: Sleep topic returned');

  // 5. Static Files & Routing
  console.log('\n>>> 5. Testing Static Files & Clean Routing');
  const pages = ['index.html', 'assessment.html', 'chatbot.html', 'results.html', 'resources.html', 'about.html', 'privacy.html'];
  for (const page of pages) {
    const p = await request({ host: 'localhost', port: 3000, path: '/' + page, method: 'GET' });
    assert(p.status === 200, `Page /${page} served with 200 OK`);
  }

  const cleanRoutes = ['assessment', 'chatbot', 'results', 'resources', 'about', 'privacy'];
  for (const route of cleanRoutes) {
    const c = await request({ host: 'localhost', port: 3000, path: '/' + route, method: 'GET' });
    assert(c.status === 200, `Clean URL /${route} served with 200 OK`);
  }

  const css = await request({ host: 'localhost', port: 3000, path: '/css/style.css', method: 'GET' });
  assert(css.status === 200 && css.body.includes('backend-status-pill'), 'CSS /css/style.css served and includes backend-status-pill styles');

  console.log('\n====================================================');
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

// Start server locally for test execution
const { startServer } = require('./server.js');
let server = null;

setTimeout(async () => {
  try {
    server = startServer(3000);
    await new Promise(r => setTimeout(r, 400));
    await runComprehensiveTests();
    if (server) server.close();
    process.exit(0);
  } catch (err) {
    console.error('Test execution error:', err);
    if (server) server.close();
    process.exit(1);
  }
}, 300);
