const express = require("express");
const { PutCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamoDocClient } = require("../utils/awsConfig");
const logger = require("../utils/logger");

const router = express.Router();

// Get Profile
router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const tableName = process.env.DYNAMODB_TABLE_USERS || "UsersProfile";

        const { Item } = await dynamoDocClient.send(new GetCommand({
            TableName: tableName,
            Key: { userId }
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

// Update or Create Profile
router.post("/", async (req, res) => {
    try {
        const { userId, ...profileData } = req.body;
        const tableName = process.env.DYNAMODB_TABLE_USERS || "UsersProfile";

        if (!userId) {
            return res.status(400).json({ error: "Missing userId" });
        }

        const input = {
            TableName: tableName,
            Item: {
                userId,
                ...profileData,
                updatedAt: new Date().toISOString()
            }
        };

        await dynamoDocClient.send(new PutCommand(input));
        logger.info(`Profile updated for user ${userId}`);

        res.status(200).json({ success: true, user: input.Item });
    } catch (error) {
        logger.error(`DynamoDB Error Updating Profile: ${error.message}`);
        res.status(500).json({ error: "Could not save profile to DynamoDB" });
    }
});

module.exports = router;
