const serverless = require('serverless-http');
const { app } = require('../../server');

const handler = serverless(app);

module.exports.handler = async (event, context) => {
  // Normalize path if coming through Netlify function route or redirect
  if (event.path && event.path.startsWith('/.netlify/functions/api')) {
    let clean = event.path.replace(/^\/\.netlify\/functions\/api/, '') || '/';
    if (!clean.startsWith('/api')) {
      clean = '/api' + clean;
    }
    event.path = clean;
  }
  return await handler(event, context);
};
