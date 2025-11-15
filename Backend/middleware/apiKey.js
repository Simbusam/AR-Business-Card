// middleware/apiKey.js
// Optional API key auth. If X-API-Key header matches AR_API_KEY, mark request as apiKeyValid.
module.exports = function apiKeyOptional(req, _res, next) {
  try {
    const provided = req.header('X-API-Key') || req.header('x-api-key');
    const expected = process.env.AR_API_KEY;
    req.apiKeyValid = !!(expected && provided && provided === expected);
  } catch (_) {
    req.apiKeyValid = false;
  }
  next();
}
