const express = require("express");
const { PutCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamoDocClient } = require("../utils/awsConfig");
const verifyToken = require("../middleware/authMiddleware");
const logger = require("../utils/logger");

const router = express.Router();
const TABLE = process.env.DYNAMODB_TABLE_USERS || "InterviewUsers";

// GET /api/profile — fetch the authenticated user's profile
router.get("/", verifyToken, async (req, res) => {
    try {
        const { email } = req.user;

        const { Item } = await dynamoDocClient.send(new GetCommand({
            TableName: TABLE,
            Key: { email }
        }));

        if (!Item) {
            return res.status(404).json({ message: "Profile not found" });
        }

        res.status(200).json({ user: Item });
    } catch (error) {
        logger.error(`DynamoDB Error Fetching Profile: ${error.message}`);
        res.status(500).json({ error: "Could not fetch profile." });
    }
});

// PUT /api/profile — update the authenticated user's profile
router.put("/", verifyToken, async (req, res) => {
    try {
        const { email } = req.user;
        const updates = req.body;

        // Fetch existing item to merge
        const { Item } = await dynamoDocClient.send(new GetCommand({ TableName: TABLE, Key: { email } }));
        if (!Item) {
            return res.status(404).json({ error: "User not found" });
        }

        const updatedItem = { ...Item, ...updates, email, updatedAt: new Date().toISOString() };

        await dynamoDocClient.send(new PutCommand({
            TableName: TABLE,
            Item: updatedItem
        }));

        logger.info(`Profile updated for user ${email}`);
        res.status(200).json({ success: true, user: updatedItem });
    } catch (error) {
        logger.error(`DynamoDB Error Updating Profile: ${error.message}`);
        res.status(500).json({ error: "Could not save profile to DynamoDB" });
    }
});

module.exports = router;
