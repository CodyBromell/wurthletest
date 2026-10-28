// Vercel serverless entry point. Vercel invokes this handler for every
// request (via the rewrite in vercel.json) and the Express app handles
// routing from here.

module.exports = require("../app");
