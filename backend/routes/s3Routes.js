const express = require("express");
const multer = require("multer");
const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3Client } = require("../utils/awsConfig");
const logger = require("../utils/logger");
const { analyzeResume } = require("../services/nlpService");
const verifyToken = require("../middleware/authMiddleware");
const { isSafeS3ObjectKey } = require("../utils/safeS3ObjectKey");

const router = express.Router();

const MAX_RESUME_MB = Number.parseInt(process.env.MAX_RESUME_UPLOAD_MB || "15", 10) || 15;
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_RESUME_MB * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            return cb(null, true);
        }
        cb(new Error("Only PDF resumes are allowed."));
    },
});

function handleResumeUpload(req, res, next) {
    upload.single("resume")(req, res, (err) => {
        if (!err) return next();
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({ error: `Resume must be under ${MAX_RESUME_MB} MB.` });
            }
            return res.status(400).json({ error: "Upload failed." });
        }
        return res.status(400).json({ error: err.message || "Invalid upload." });
    });
}

/**
 * Upload directly to S3 via backend (Server-side routing via Multer).
 */
router.post("/upload-resume", verifyToken, handleResumeUpload, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No resume file in request." });
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
        logger.info(`Resume uploaded to S3: ${objectKey}`);

        let analysis = null;
        if (req.file.mimetype === "application/pdf") {
            const targetRole = req.body.targetRole || null;
            const jobDescription = req.body.jobDescription || null;
            analysis = await analyzeResume(req.file.buffer, targetRole, jobDescription);
            logger.info("Resume NLP analysis finished.");
        } else {
            logger.warn("Non-PDF upload; skipping Gemini analysis.");
        }

        res.status(200).json({
            message: "File uploaded to S3",
            objectKey,
            analysis,
        });
    } catch (error) {
        logger.error(`Resume upload failed: ${error.message}`);
        res.status(500).json({ error: "Failed to upload resume to storage." });
    }
});

/**
 * Generate Pre-signed URL for uploading (legacy / alternate clients)
 */
router.post("/generate-upload-url", verifyToken, async (req, res) => {
    try {
        const { fileName, fileType, isAudio } = req.body;

        if (!fileName || !fileType) {
            return res.status(400).json({ error: "fileName and fileType are required." });
        }

        const bucketName = process.env.S3_BUCKET_NAME || "my-default-bucket";
        const folder = isAudio ? "audio" : "resumes";
        const sanitizedFileName = String(fileName).replace(/[^a-zA-Z0-9.-]/g, "_");
        const objectKey = `${folder}/${Date.now()}_${sanitizedFileName}`;

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: objectKey,
            ContentType: fileType,
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        logger.info(`Pre-signed upload URL for S3 key: ${objectKey}`);

        res.status(200).json({
            message: "Pre-signed URL generated successfully",
            uploadUrl,
            objectKey,
        });
    } catch (error) {
        logger.error(`Pre-signed upload URL failed: ${error.message}`);
        res.status(500).json({ error: "Failed to generate upload URL." });
    }
});

/**
 * Generate Pre-signed URL for reading a file (resume PDF or audio from Polly)
 */
router.post("/generate-read-url", verifyToken, async (req, res) => {
    try {
        const { objectKey } = req.body;

        if (!objectKey || typeof objectKey !== "string") {
            return res.status(400).json({ error: "objectKey is required." });
        }

        if (!isSafeS3ObjectKey(objectKey)) {
            return res.status(400).json({ error: "Invalid or disallowed object key." });
        }

        const bucketName = process.env.S3_BUCKET_NAME || "my-default-bucket";

        const responseContentType = objectKey.startsWith("audio/")
            ? "audio/mpeg"
            : "application/pdf";

        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: objectKey,
            ResponseContentType: responseContentType,
            ResponseContentDisposition: "inline",
        });

        const readUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        res.status(200).json({ readUrl });
    } catch (error) {
        logger.error(`Pre-signed read URL failed: ${error.message}`);
        res.status(500).json({ error: "Failed to generate read URL." });
    }
});

module.exports = router;
