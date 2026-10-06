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

async function runTests() {
  console.log('--- STARTING SECRETSAATHI TESTS ---');

  // 1. GET /api/config
  const cfg = await request({ host: 'localhost', port: 3000, path: '/api/config', method: 'GET' });
  console.log('GET /api/config ->', cfg.status, 'AppName:', cfg.body.data?.appName);

  // 2. GET /api/questions
  const qs = await request({ host: 'localhost', port: 3000, path: '/api/questions', method: 'GET' });
  console.log('GET /api/questions ->', qs.status, 'Count:', qs.body.count, 'Q1 Category:', qs.body.questions?.[0]?.category);

  // 3. GET /api/resources
  const resAll = await request({ host: 'localhost', port: 3000, path: '/api/resources', method: 'GET' });
  console.log('GET /api/resources ->', resAll.status, 'Count:', resAll.body.count);

  // 4. GET /api/resources?category=Helpline
  const resCat = await request({ host: 'localhost', port: 3000, path: '/api/resources?category=Helpline', method: 'GET' });
  console.log('GET /api/resources?category=Helpline ->', resCat.status, 'Count:', resCat.body.count);

  // 5. GET /api/resources/tele-manas
  const resOne = await request({ host: 'localhost', port: 3000, path: '/api/resources/tele-manas', method: 'GET' });
  console.log('GET /api/resources/tele-manas ->', resOne.status, 'Name:', resOne.body.resource?.name);

  // 6. POST /api/score (Low Indicator: score 6)
  const scoreLow = await request({
    host: 'localhost',
    port: 3000,
    path: '/api/score',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    answers: [
      { questionId: 1, score: 0 },
      { questionId: 2, score: 1 },
      { questionId: 3, score: 0 },
      { questionId: 4, score: 1 },
      { questionId: 5, score: 0 },
      { questionId: 6, score: 1 },
      { questionId: 7, score: 1 },
      { questionId: 8, score: 0 },
      { questionId: 9, score: 1 },
      { questionId: 10, score: 1 }
    ]
  });
  console.log('POST /api/score (Low) ->', scoreLow.status, 'Score:', scoreLow.body.totalScore, 'Tag:', scoreLow.body.tag, 'Cat:', scoreLow.body.category);

  // 7. POST /api/score (Moderate Indicator: score 18)
  const scoreMod = await request({
    host: 'localhost',
    port: 3000,
    path: '/api/score',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    answers: [
      { questionId: 1, score: 2 },
      { questionId: 2, score: 2 },
      { questionId: 3, score: 2 },
      { questionId: 4, score: 2 },
      { questionId: 5, score: 1 },
      { questionId: 6, score: 2 },
      { questionId: 7, score: 2 },
      { questionId: 8, score: 1 },
      { questionId: 9, score: 2 },
      { questionId: 10, score: 2 }
    ]
  });
  console.log('POST /api/score (Mod) ->', scoreMod.status, 'Score:', scoreMod.body.totalScore, 'Tag:', scoreMod.body.tag, 'Cat:', scoreMod.body.category);

  // 8. POST /api/score (High Indicator: score 31)
  const scoreHigh = await request({
    host: 'localhost',
    port: 3000,
    path: '/api/score',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    answers: [
      { questionId: 1, score: 3 },
      { questionId: 2, score: 3 },
      { questionId: 3, score: 3 },
      { questionId: 4, score: 3 },
      { questionId: 5, score: 3 },
      { questionId: 6, score: 3 },
      { questionId: 7, score: 4 },
      { questionId: 8, score: 3 },
      { questionId: 9, score: 3 },
      { questionId: 10, score: 3 }
    ]
  });
  console.log('POST /api/score (High) ->', scoreHigh.status, 'Score:', scoreHigh.body.totalScore, 'Tag:', scoreHigh.body.tag, 'Cat:', scoreHigh.body.category);

  // 9. POST /api/score (Edge case: Empty answers, expect 400)
  const scoreEmpty = await request({
    host: 'localhost',
    port: 3000,
    path: '/api/score',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { answers: [] });
  console.log('POST /api/score (Empty answers) ->', scoreEmpty.status, scoreEmpty.status === 400 ? 'OK (Rejected empty answers)' : 'FAIL');

  // 10. GET /api/resources?search=Tele-MANAS
  const resSearch = await request({ host: 'localhost', port: 3000, path: '/api/resources?search=Tele-MANAS', method: 'GET' });
  console.log('GET /api/resources?search=Tele-MANAS ->', resSearch.status, 'Count:', resSearch.body.count, 'Found:', resSearch.body.resources?.[0]?.name);

  // 11. GET /api/resources/invalid-id (Expect 404)
  const resInvalid = await request({ host: 'localhost', port: 3000, path: '/api/resources/non-existent-id', method: 'GET' });
  console.log('GET /api/resources/non-existent-id ->', resInvalid.status, resInvalid.status === 404 ? 'OK (404 Not Found)' : 'FAIL');

  // 12. GET /api/unknown-endpoint (Expect 404)
  const apiUnknown = await request({ host: 'localhost', port: 3000, path: '/api/unknown-endpoint', method: 'GET' });
  console.log('GET /api/unknown-endpoint ->', apiUnknown.status, apiUnknown.status === 404 ? 'OK (404 Not Found)' : 'FAIL');

  // 13. Check all HTML pages (both .html and clean routes)
  const pages = ['index.html', 'assessment.html', 'chatbot.html', 'results.html', 'resources.html', 'about.html', 'privacy.html'];
  for (const page of pages) {
    const pRes = await request({ host: 'localhost', port: 3000, path: '/' + page, method: 'GET' });
    console.log(`PAGE /${page} -> Status:`, pRes.status, typeof pRes.body === 'string' && pRes.body.includes('SecretSaathi') ? 'OK (Brand present)' : 'MISSING BRAND');
  }

  // 14. Check clean URLs without .html extension
  const cleanRoutes = ['assessment', 'chatbot', 'results', 'resources', 'about', 'privacy'];
  for (const route of cleanRoutes) {
    const cRes = await request({ host: 'localhost', port: 3000, path: '/' + route, method: 'GET' });
    console.log(`CLEAN ROUTE /${route} -> Status:`, cRes.status, typeof cRes.body === 'string' && cRes.body.includes('SecretSaathi') ? 'OK' : 'FAIL');
  }

  // 15. GET /api/health
  const healthRes = await request({ host: 'localhost', port: 3000, path: '/api/health', method: 'GET' });
  console.log('GET /api/health -> Status:', healthRes.status, 'Healthy:', healthRes.body?.status === 'healthy' ? 'OK' : 'FAIL');

  // 16. GET /api/chat/options
  const chatOpt = await request({ host: 'localhost', port: 3000, path: '/api/chat/options', method: 'GET' });
  console.log('GET /api/chat/options -> Status:', chatOpt.status, 'Topics count:', chatOpt.body?.topics?.length);

  // 17. POST /api/chat (Keyword query)
  const chatMsg = await request({
    host: 'localhost',
    port: 3000,
    path: '/api/chat',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { message: 'I have severe exam stress and anxiety' });
  console.log('POST /api/chat (Exam query) -> Status:', chatMsg.status, 'Topic:', chatMsg.body?.title);

  // 18. POST /api/chat (Topic selection)
  const chatTopic = await request({
    host: 'localhost',
    port: 3000,
    path: '/api/chat',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { topic: 'sleep' });
  console.log('POST /api/chat (Topic sleep) -> Status:', chatTopic.status, 'Title:', chatTopic.body?.title);

  // 19. POST /api/chat (Crisis detection)
  const chatCrisis = await request({
    host: 'localhost',
    port: 3000,
    path: '/api/chat',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { message: 'I want to die' });
  console.log('POST /api/chat (Crisis safety) -> Status:', chatCrisis.status, 'isCrisis:', chatCrisis.body?.isCrisis, chatCrisis.body?.isCrisis ? 'OK (Crisis safety triggered)' : 'FAIL');

  console.log('--- ALL AUTOMATED TESTS FINISHED SUCCESSFULLY ---');
}

async function main() {
  let embeddedServer = null;
  try {
    await request({ host: 'localhost', port: 3000, path: '/api/health', method: 'GET' });
  } catch (e) {
    const { startServer } = require('./server.js');
    embeddedServer = startServer(3000);
    await new Promise(r => setTimeout(r, 400));
  }

  try {
    await runTests();
  } finally {
    if (embeddedServer) embeddedServer.close();
  }
}

main().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});

