import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, doc, addDoc } from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase Config from .env
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/scores", async (req, res) => {
    try {
      const data = req.body;
      const scoreData = { ...data, date: new Date().toISOString() };
      await addDoc(collection(db, "scores"), scoreData);
      res.json({ success: true });
    } catch (e) {
      console.error("Error saving score to Firebase:", e);
      res.status(500).json({ error: "Could not save score" });
    }
  });

  app.get("/api/scores", async (req, res) => {
    const pin = req.query.pin;
    if (pin !== "3445") {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    try {
      const snapshot = await getDocs(collection(db, "scores"));
      const scores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(scores);
    } catch (e) {
      console.error("Error fetching scores from Firebase:", e);
      res.json([]);
    }
  });

  app.get("/api/questions", async (req, res) => {
    try {
      const snapshot = await getDocs(collection(db, "config"));
      const configDoc = snapshot.docs.find(d => d.id === "questions");
      if (configDoc) {
        res.json(configDoc.data().list || []);
      } else {
        res.json([]);
      }
    } catch (e) {
      console.error("Error fetching questions from Firebase:", e);
      res.status(404).json({ error: "Not found" });
    }
  });

  app.post("/api/questions", async (req, res) => {
    const pin = req.query.pin;
    if (pin !== "3445") {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    try {
      const qs = req.body;
      await setDoc(doc(db, "config", "questions"), { list: qs });
      res.json({ success: true });
    } catch (e) {
      console.error("Error saving questions to Firebase:", e);
      res.status(500).json({ error: "Could not save questions" });
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
