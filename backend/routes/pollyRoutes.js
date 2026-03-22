const express = require("express");
const { SynthesizeSpeechCommand } = require("@aws-sdk/client-polly");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { pollyClient, s3Client } = require("../utils/awsConfig");
const logger = require("../utils/logger");

const router = express.Router();

/**
 * Text-to-Speech using Amazon Polly + S3
 * 
 * 1. Takes text input.
 * 2. Synthesizes Speech via AWS Polly.
 * 3. Uploads the audio stream to an S3 audio folder.
 * 4. Returns a temporary Pre-signed Read URL for the frontend to play the audio.
 */
router.post("/synthesize", async (req, res) => {
    try {
        const { text, voiceId = "Joanna" } = req.body; // Default voice is Joanna
        
        if (!text) {
            return res.status(400).json({ error: "No text provided for synthesis." });
        }

        logger.info(`Synthesizing speech. Length: ${text.length}`);

        // 1. Ask Polly to Synthesize
        const synthesizeCommand = new SynthesizeSpeechCommand({
            Text: text,
            OutputFormat: "mp3",
            VoiceId: voiceId,
            Engine: "neural" // Optional: using neural engine for more human-like speech
        });

        const pollyResponse = await pollyClient.send(synthesizeCommand);

        // 2. Upload the audio stream to S3 bucket
        const bucketName = process.env.S3_BUCKET_NAME || "my-default-bucket";
        const objectKey = `audio/polly-${Date.now()}.mp3`;

        const s3Upload = new Upload({
            client: s3Client,
            params: {
                Bucket: bucketName,
                Key: objectKey,
                Body: pollyResponse.AudioStream,
                ContentType: "audio/mpeg"
            }
        });

        await s3Upload.done();

        // 3. Generate a pre-signed URL so the browser can immediately hit & play it
        const getObjectCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: objectKey
        });

        const audioUrl = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 });
        
        logger.info(`Synthesized and successfully pushed to S3: ${objectKey}`);

        res.status(200).json({ 
            message: "Text synthesized to speech", 
            audioUrl,
            s3Key: objectKey 
        });

    } catch (error) {
        logger.error(`Polly Synthesis Error: ${error.message}`);
        res.status(500).json({ error: "Failed to synthesize speech and generate audio." });
    }
});

module.exports = router;
