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

  // 9. Check all HTML pages
  const pages = ['index.html', 'assessment.html', 'chatbot.html', 'results.html', 'resources.html', 'about.html', 'privacy.html'];
  for (const page of pages) {
    const pRes = await request({ host: 'localhost', port: 3000, path: '/' + page, method: 'GET' });
    console.log(`PAGE /${page} -> Status:`, pRes.status, typeof pRes.body === 'string' && pRes.body.includes('SecretSaathi') ? 'OK (Brand present)' : 'MISSING BRAND');
  }

  console.log('--- ALL AUTOMATED TESTS FINISHED SUCCESSFULLY ---');
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
