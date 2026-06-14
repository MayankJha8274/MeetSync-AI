import { Router } from "express";
import multer from "multer";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ dest: path.join(__dirname, "../../uploads") });

const router = Router();

router.post("/", upload.single("audio"), async (req, res) => {
  const openaiKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "your_openai_api_key_here"
    ? process.env.OPENAI_API_KEY
    : null;

  if (!openaiKey) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(503).json({ error: "OpenAI API key not configured" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "No audio file provided" });
  }

  const openai = new OpenAI({ apiKey: openaiKey });

  try {
    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: fs.createReadStream(req.file.path),
      language: "en",
      response_format: "text"
    });

    fs.unlink(req.file.path, () => {});

    return res.json({ text: transcription || "" });
  } catch (err) {
    console.error("Whisper transcription error:", err.message);
    if (err.status) console.error("OpenAI HTTP status:", err.status);
    if (err.code) console.error("OpenAI error code:", err.code);
    if (err.type) console.error("OpenAI error type:", err.type);
    // Log full error in dev for debugging
    if (process.env.NODE_ENV !== 'production') console.error("Full error:", err);
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(500).json({ error: "Transcription failed: " + err.message });
  }
});

export default router;
