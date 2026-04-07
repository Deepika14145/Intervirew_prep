const express = require("express");
const multer = require("multer");
const logger = require("../utils/logger");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// Store file in memory (RAM) temporarily instead of uploading to local disk or S3
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// POST /api/transcribe/deepgram
// Expects: multipart/form-data with a file field named "audio"
router.post("/deepgram", verifyToken, upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided" });
    }

    if (!process.env.DEEPGRAM_API_KEY || process.env.DEEPGRAM_API_KEY.includes("YOUR_")) {
         return res.status(401).json({ error: "DEEPGRAM_API_KEY is missing or invalid in backend/.env" });
    }

    logger.info(`Received audio for Deepgram transcription: ${req.file.size} bytes`);

    // Send the raw audio buffer directly to Deepgram API
    // We use the Nova-2 model which is their absolute fastest/most accurate English model
    const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true", {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
        "Content-Type": req.file.mimetype || "audio/webm",
      },
      body: req.file.buffer,
    });

    const result = await response.json();

    if (!response.ok) {
      logger.error(`Deepgram API error: ${JSON.stringify(result)}`);
      return res.status(response.status).json({ error: "Deepgram API failed", details: result });
    }

    // Extract the final text from Deepgram's deeply nested JSON response
    const transcript = result?.results?.channels[0]?.alternatives[0]?.transcript || "";
    
    logger.info(`Transcription successful: "${transcript.substring(0, 30)}..."`);
    
    return res.status(200).json({ 
      status: "COMPLETED", 
      transcript: transcript 
    });

  } catch (error) {
    logger.error(`Deepgram routing error: ${error.message}`);
    res.status(500).json({ error: "Internal server error during transcription" });
  }
});

module.exports = router;
