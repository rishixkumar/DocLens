/**
 * DocLens Express Server
 *
 * Serves the React frontend build and proxies /api/* requests to the FastAPI backend.
 * Run with: node index.js
 *
 * Environment variables:
 *   PORT - Server port (default: 5000)
 *   API_URL - FastAPI backend URL (default: http://localhost:8000)
 *   NODE_ENV - 'production' to serve static build, else dev mode
 */

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");

const PORT = process.env.PORT || 5000;
const API_URL = process.env.API_URL || "http://localhost:8000";
const isProduction = process.env.NODE_ENV === "production";

const app = express();

// Proxy API requests to FastAPI backend
app.use(
  "/api",
  createProxyMiddleware({
    target: API_URL,
    changeOrigin: true,
    pathRewrite: { "^/api": "/api" },
    onError: (err, req, res) => {
      console.error("API proxy error:", err.message);
      res.status(502).json({ error: "Backend unavailable" });
    },
  })
);

if (isProduction) {
  // Serve React build in production
  const buildPath = path.join(__dirname, "../frontend/build");
  app.use(express.static(buildPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
} else {
  // In development, redirect to React dev server (run separately)
  app.get("/", (req, res) => {
    res.send(`
      <h1>DocLens Server</h1>
      <p>API proxy is running. Start the React dev server:</p>
      <pre>cd frontend && npm start</pre>
      <p>Then open <a href="http://localhost:3000">http://localhost:3000</a></p>
    `);
  });
}

app.listen(PORT, () => {
  console.log(`DocLens server running on port ${PORT}`);
  console.log(`API proxy target: ${API_URL}`);
  if (!isProduction) {
    console.log("Start React dev server: cd frontend && npm start");
  }
});
