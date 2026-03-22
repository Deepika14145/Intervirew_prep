const express = require("express");
const { UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamoDocClient } = require("../utils/awsConfig");
const { analyzeTranscription } = require("../services/nlpService");
const logger = require("../utils/logger");

const router = express.Router();

/**
 * Analyze Transcribed Answer
 * 
 * This endpoint should be called after AWS Transcribe has successfully converted the user's 
 * audio speech to text. It passes the text to the NLP model, retrieves metrics (fluency, confidence), 
 * and updates the corresponding DynamoDB InterviewAnswers record.
 */
router.post("/process-transcription", async (req, res) => {
    try {
        const { answerId, sessionId, transcribedText } = req.body;

        if (!transcribedText || !answerId) {
            return res.status(400).json({ error: "Missing transcribedText or answerId parameters." });
        }

        // 1. Pass transcribed text to the NLP provision
        const nlpMetrics = await analyzeTranscription(transcribedText);

        logger.info(`NLP analysis completed for answerId: ${answerId}. Metrics:`, nlpMetrics);

        // 2. Update the DynamoDB Record using the evaluation metrics
        const tableName = process.env.DYNAMODB_TABLE_ANSWERS || "InterviewAnswers";

        const updateInput = {
            TableName: tableName,
            Key: {
                answerId,
                sessionId // Assuming both make the primary key setup, or just answerId depending on your table design!
            },
            // Update expression adding the new NLP metrics and transcribed text into the row
            UpdateExpression: "SET transcribedText = :tt, nlpFluencyScore = :f, nlpConfidenceLevel = :c, nlpRelevanceScore = :r, nlpFillerWords = :fw, nlpFeedback = :fb, updated_at = :u",
            ExpressionAttributeValues: {
                ":tt": transcribedText,
                ":f": nlpMetrics.fluencyScore,
                ":c": nlpMetrics.confidenceLevel,
                ":r": nlpMetrics.relevanceScore,
                ":fw": nlpMetrics.fillerWordsDetected,
                ":fb": nlpMetrics.overallFeedback,
                ":u": new Date().toISOString()
            },
            ReturnValues: "UPDATED_NEW"
        };

        const updatedRecord = await dynamoDocClient.send(new UpdateCommand(updateInput));
        logger.info(`DynamoDB record updated with NLP metrics for answerId: ${answerId}`);

        res.status(200).json({
            message: "Transcription successfully processed by NLP model and saved.",
            evaluation: nlpMetrics,
            updatedDbFields: updatedRecord.Attributes
        });

    } catch (error) {
        logger.error(`Error processing transcription: ${error.message}`);
        res.status(500).json({ error: "Failed to process text via NLP and update storage." });
    }
});

module.exports = router;
