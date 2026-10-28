// Local development entry point. On Vercel the serverless function in
// api/index.js handles the same app instead of listening on a port.

const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Review system running at http://localhost:${PORT}`);
  console.log(`Game at http://localhost:${PORT}/wurthle`);
});
