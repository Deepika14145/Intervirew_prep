const express = require("express");
const { PutCommand, GetCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamoDocClient } = require("../utils/awsConfig");
const logger = require("../utils/logger");

const router = express.Router();

/**
 * Save user interview session
 */
router.post("/session", async (req, res) => {
    try {
        const { sessionId, userId, timestamp, resumeKey } = req.body;
        const tableName = process.env.DYNAMODB_TABLE_INTERVIEWS || "InterviewSessions";

        const input = {
            TableName: tableName,
            Item: {
                sessionId,
                userId,
                timestamp: timestamp || new Date().toISOString(),
                resumeKey,
                status: "STARTED"
            }
        };

        await dynamoDocClient.send(new PutCommand(input));
        logger.info(`Session ${sessionId} created for user ${userId}`);

        res.status(200).json({ message: "Session details saved successfully", sessionId });

    } catch (error) {
        logger.error(`DynamoDB Error Saving Session: ${error.message}`);
        res.status(500).json({ error: "Could not save session details to DynamoDB" });
    }
});

/**
 * Save Question Answer
 */
router.post("/answer", async (req, res) => {
    try {
        const { answerId, sessionId, question, answerText, transcribedText, s3AudioKey, score } = req.body;
        const tableName = process.env.DYNAMODB_TABLE_ANSWERS || "InterviewAnswers";

        const input = {
            TableName: tableName,
            Item: {
                answerId,
                sessionId,
                question,
                answerText,
                transcribedText, // Future AWS Transcribe Integration
                s3AudioKey,      // If saved in S3
                score: score || null,
                timestamp: new Date().toISOString()
            }
        };

        await dynamoDocClient.send(new PutCommand(input));
        logger.info(`Saved answer for sessionId: ${sessionId}, answerId: ${answerId}`);

        res.status(200).json({ message: "Answer saved successfully" });
    } catch (error) {
        logger.error(`DynamoDB Error Saving Answer: ${error.message}`);
        res.status(500).json({ error: "Failed to save the answer in Dynamo DB" });
    }
});

/**
 * Get all sessions (for Analytics purposes)
 */
router.get("/sessions", async (req, res) => {
    try {
        const tableName = process.env.DYNAMODB_TABLE_INTERVIEWS || "InterviewSessions";
        const command = new ScanCommand({ TableName: tableName });
        const data = await dynamoDocClient.send(command);

        res.status(200).json({ sessions: data.Items });
    } catch (error) {
        logger.error(`DynamoDB Scan Error: ${error.message}`);
        res.status(500).json({ error: "Failed to fetch session history." });
    }
});

module.exports = router;
