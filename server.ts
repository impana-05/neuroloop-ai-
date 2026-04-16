import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { PDFParse } from "pdf-parse";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // MongoDB Connection
  const MONGODB_URI = process.env.MONGODB_URI;
  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log("Connected to MongoDB successfully");
    } catch (error) {
      console.error("MongoDB connection error:", error);
    }
  } else {
    console.warn("MONGODB_URI not found in environment variables");
  }

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // PDF Extraction Route
  app.post("/api/extract-pdf", async (req, res) => {
    try {
      const { base64 } = req.body;
      if (!base64) {
        return res.status(400).json({ error: "No PDF data provided" });
      }

      console.log(`Received PDF data, size: ${base64.length} characters`);
      const buffer = Buffer.from(base64, 'base64');
      console.log(`Converted to buffer, size: ${buffer.length} bytes`);
      
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      
      if (!result || typeof result.text === 'undefined') {
        return res.status(500).json({ error: "Failed to extract text from PDF" });
      }

      console.log(`Extracted ${result.text.length} characters of text`);
      res.json({ text: result.text });
    } catch (error) {
      console.error("PDF extraction error:", error);
      res.status(500).json({ error: `Failed to extract PDF text: ${error instanceof Error ? error.message : String(error)}` });
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
