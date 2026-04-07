const express = require("express");
const { PutCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamoDocClient } = require("../utils/awsConfig");
const { analyzeTranscription } = require("../services/nlpService");
const verifyToken = require("../middleware/authMiddleware");
const logger = require("../utils/logger");

const router = express.Router();

/**
 * POST /api/evaluation/process-transcription
 *
 * Evaluates a candidate's transcribed answer using Gemini AI and persists
 * the NLP metrics back to DynamoDB. Protected by Firebase JWT auth.
 *
 * Body: { answerId, sessionId, transcribedText, question? }
 */
router.post("/process-transcription", verifyToken, async (req, res) => {
    try {
        const { answerId, sessionId, transcribedText, question } = req.body;

        if (!transcribedText || !answerId) {
            return res.status(400).json({ error: "Missing transcribedText or answerId." });
        }

        // Sanitize input to prevent prompt injection — strip backticks and control chars
        const safeText = transcribedText.replace(/[`\u0000-\u001F\u007F]/g, " ").trim();
        const safeQuestion = question ? question.replace(/[`\u0000-\u001F\u007F]/g, " ").trim() : null;

        // 1. Run NLP evaluation via Gemini
        const nlpMetrics = await analyzeTranscription(safeText, safeQuestion);
        logger.info(`NLP analysis completed for answerId: ${answerId}`);

        // 2. Upsert the DynamoDB record — use PutCommand with a merge so we don't
        //    depend on the /answer write having completed first (avoids race condition).
        const tableName = process.env.DYNAMODB_TABLE_ANSWERS || "InterviewAnswers";

        // Fetch existing item to merge (may or may not exist yet)
        let existingItem = {};
        try {
            const { Item } = await dynamoDocClient.send(new GetCommand({
                TableName: tableName,
                Key: { answerId }
            }));
            if (Item) existingItem = Item;
        } catch (dynamoErr) {
            logger.warn(`GetCommand before NLP merge (answerId=${answerId}): ${dynamoErr.message}`);
        }

        const mergedItem = {
            ...existingItem,
            answerId,
            sessionId: sessionId || existingItem.sessionId,
            transcribedText: safeText,
            nlpFluencyScore: nlpMetrics.fluencyScore,
            nlpConfidenceLevel: nlpMetrics.confidenceLevel,
            nlpRelevanceScore: nlpMetrics.relevanceScore,
            nlpFillerWords: nlpMetrics.fillerWordsDetected,
            nlpFeedback: nlpMetrics.overallFeedback,
            nlpMissingConcepts: nlpMetrics.missingConcepts,
            nlpSuggestedAnswer: nlpMetrics.suggestedAnswer,
            updated_at: new Date().toISOString()
        };

        await dynamoDocClient.send(new PutCommand({ TableName: tableName, Item: mergedItem }));
        logger.info(`DynamoDB record upserted with NLP metrics for answerId: ${answerId}`);

        res.status(200).json({
            message: "Transcription processed and saved.",
            evaluation: nlpMetrics
        });

    } catch (error) {
        logger.error(`Error processing transcription: ${error.message}`);
        res.status(500).json({ error: "Failed to process text via NLP." });
    }
});

module.exports = router;
