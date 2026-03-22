const express = require("express");
const multer = require("multer");
const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3Client } = require("../utils/awsConfig");
const logger = require("../utils/logger");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Upload directly to S3 via backend (Server-side routing via Multer).
 * This completely ignores pesky Frontend generic Browser CORS settings because we do server-to-server buffer pushes!
 */
router.post("/upload-resume", upload.single("resume"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No mapped multi-part file found in request." });
        }

        const bucketName = process.env.S3_BUCKET_NAME || "my-default-bucket";
        const sanitizedFileName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
        const objectKey = `resumes/${Date.now()}_${sanitizedFileName}`;

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: objectKey,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        });

        await s3Client.send(command);
        logger.info(`Backend Node gracefully uploaded file directly to S3: ${objectKey}`);

        res.status(200).json({
            message: "File streamed securely to S3 bypassing UI CORS",
            objectKey
        });
    } catch (error) {
        logger.error(`Error uploading file to S3 strictly via server middleware: ${error.message}`);
        res.status(500).json({ error: "Backend failed to push file payload to S3 Bucket! Check AWS IAM keys in .env." });
    }
});

/**
 * Generate Pre-signed URL for uploading a resume (Deprecated Frontend Model - Retained for legacy checks)
 */
router.post("/generate-upload-url", async (req, res) => {
    try {
        const { fileName, fileType, isAudio } = req.body;
        const bucketName = process.env.S3_BUCKET_NAME || "my-default-bucket";

        let folder = isAudio ? "audio" : "resumes";
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
        const objectKey = `${folder}/${Date.now()}_${sanitizedFileName}`;

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: objectKey,
            ContentType: fileType,
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
        
        logger.info(`Generated pre-signed upload URL for S3 key: ${objectKey}`);
        
        res.status(200).json({
            message: "Pre-signed URL generated successfully",
            uploadUrl,
            objectKey // Useful to save in DB later for fetching
        });

    } catch (error) {
        logger.error(`Error generating pre-signed URL: ${error.message}`);
        res.status(500).json({ error: "Failed to generate S3 pre-signed URL" });
    }
});

/**
 * Generate Pre-signed URL for reading a file (audio response or resume)
 */
router.post("/generate-read-url", async (req, res) => {
    try {
        const { objectKey } = req.body;
        const bucketName = process.env.S3_BUCKET_NAME || "my-default-bucket";

        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: objectKey,
        });

        const readUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        
        res.status(200).json({ readUrl });
    } catch (error) {
        logger.error(`Error reading from S3: ${error.message}`);
        res.status(500).json({ error: "Failed to read file from S3" });
    }
});

module.exports = router;
