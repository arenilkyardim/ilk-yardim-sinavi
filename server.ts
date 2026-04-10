import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCORES_FILE = path.join(__dirname, 'scores.json');

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/scores", async (req, res) => {
    try {
      const data = req.body;
      let scores = [];
      try {
        const fileContent = await fs.readFile(SCORES_FILE, 'utf-8');
        scores = JSON.parse(fileContent);
      } catch (e) {}
      scores.push({ ...data, date: new Date().toISOString() });
      await fs.writeFile(SCORES_FILE, JSON.stringify(scores, null, 2));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Could not save score" });
    }
  });

  app.get("/api/scores", async (req, res) => {
    const pin = req.query.pin;
    if (pin !== "2007") {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    try {
      const fileContent = await fs.readFile(SCORES_FILE, 'utf-8');
      res.json(JSON.parse(fileContent));
    } catch (e) {
      res.json([]);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
