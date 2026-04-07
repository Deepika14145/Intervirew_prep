const express = require("express");
const { PutCommand, GetCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamoDocClient } = require("../utils/awsConfig");
const logger = require("../utils/logger");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Paginated scan helper — DynamoDB Scan returns max 1MB per call.
 * Keeps fetching until LastEvaluatedKey is exhausted.
 */
async function scanAll(params) {
    const items = [];
    let lastKey;
    do {
        const command = new ScanCommand({ ...params, ExclusiveStartKey: lastKey });
        const data = await dynamoDocClient.send(command);
        items.push(...(data.Items || []));
        lastKey = data.LastEvaluatedKey;
    } while (lastKey);
    return items;
}

/**
 * Save user interview session
 */
router.post("/session", verifyToken, async (req, res) => {
    try {
        const { sessionId, timestamp, resumeKey, targetRole, targetLevel } = req.body;
        const tableName = process.env.DYNAMODB_TABLE_INTERVIEWS || "InterviewSessions";

        const input = {
            TableName: tableName,
            Item: {
                sessionId,
                userId: req.user.uid,   // always from verified token, never from body
                timestamp: timestamp || new Date().toISOString(),
                resumeKey: resumeKey || null,
                targetRole: typeof targetRole === "string" ? targetRole.slice(0, 200) : null,
                targetLevel: typeof targetLevel === "string" ? targetLevel.slice(0, 120) : null,
                status: "STARTED"
            }
        };

        await dynamoDocClient.send(new PutCommand(input));
        logger.info(`Session ${sessionId} created for user ${req.user.uid}`);

        res.status(200).json({ message: "Session details saved successfully", sessionId });

    } catch (error) {
        logger.error(`DynamoDB Error Saving Session: ${error.message}`);
        res.status(500).json({ error: "Could not save session details to DynamoDB" });
    }
});

/**
 * Save Question Answer
 */
router.post("/answer", verifyToken, async (req, res) => {
    try {
        const { answerId, sessionId, question, answerText, transcribedText, s3AudioKey, score } = req.body;
        const tableName = process.env.DYNAMODB_TABLE_ANSWERS || "InterviewAnswers";

        const input = {
            TableName: tableName,
            Item: {
                answerId,
                sessionId,
                userId: req.user.uid,   // store for per-user filtering
                question,
                answerText,
                transcribedText,
                s3AudioKey,
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
 * Get all sessions for the authenticated user
 */
router.get("/sessions", verifyToken, async (req, res) => {
    try {
        const tableName = process.env.DYNAMODB_TABLE_INTERVIEWS || "InterviewSessions";
        const items = await scanAll({
            TableName: tableName,
            FilterExpression: "userId = :uid",
            ExpressionAttributeValues: { ":uid": req.user.uid }
        });
        res.status(200).json({ sessions: items });
    } catch (error) {
        logger.error(`DynamoDB Scan Error: ${error.message}`);
        res.status(500).json({ error: "Failed to fetch session history." });
    }
});

// GET /api/dynamodb/answers — fetch answers for the authenticated user
router.get("/answers", verifyToken, async (req, res) => {
    try {
        const tableName = process.env.DYNAMODB_TABLE_ANSWERS || "InterviewAnswers";
        const items = await scanAll({
            TableName: tableName,
            FilterExpression: "userId = :uid",
            ExpressionAttributeValues: { ":uid": req.user.uid }
        });
        res.status(200).json({ answers: items });
    } catch (error) {
        logger.error(`DynamoDB Scan Answers Error: ${error.message}`);
        res.status(500).json({ error: "Failed to fetch answers." });
    }
});

/**
 * Mark session as COMPLETED
 */
router.put("/session/:sessionId/complete", verifyToken, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const tableName = process.env.DYNAMODB_TABLE_INTERVIEWS || "InterviewSessions";

        // Fetch existing item first
        const { Item } = await dynamoDocClient.send(new GetCommand({ TableName: tableName, Key: { sessionId } }));
        if (!Item) return res.status(404).json({ error: "Session not found" });

        await dynamoDocClient.send(new PutCommand({
            TableName: tableName,
            Item: { ...Item, status: "COMPLETED", completedAt: new Date().toISOString() }
        }));

        res.status(200).json({ message: "Session marked as completed" });
    } catch (error) {
        logger.error(`Session complete error: ${error.message}`);
        res.status(500).json({ error: "Failed to update session status" });
    }
});

module.exports = router;
