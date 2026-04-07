const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { PutCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamoDocClient } = require("../utils/awsConfig");
const logger = require("../utils/logger");

const dynamoDb = dynamoDocClient;
const USERS_TABLE = process.env.DYNAMODB_TABLE_USERS || "InterviewUsers";

// POST /api/auth/sync
// This endpoint is hit by the frontend immediately after Firebase login/signup.
// We use our verifyToken middleware to securely extract who the user is from their JWT.
router.post("/sync", verifyToken, async (req, res) => {
    try {
        const { email, uid, name } = req.user;
        
        // 1. Check if user already exists
        const getParams = {
            TableName: USERS_TABLE,
            Key: { email }
        };
        const { Item } = await dynamoDb.send(new GetCommand(getParams));
        
        // 2. If new user, save their profile to DynamoDB
        if (!Item) {
            const putParams = {
                TableName: USERS_TABLE,
                Item: {
                    email,
                    uid,
                    name: name || email.split("@")[0],
                    createdAt: new Date().toISOString()
                }
            };
            await dynamoDb.send(new PutCommand(putParams));
            logger.info(`New user synced to DynamoDB: ${email}`);
        }

        res.status(200).json({ status: "success", user: req.user });
    } catch (err) {
        logger.error(`User sync error: ${err.message}`);
        // Do not crash the login flow just because DynamoDB threw an error (e.g. table not created yet)
        res.status(500).json({ error: "Failed to sync user profile, but authenticated" });
    }
});

// GET /api/auth/me
router.get("/me", verifyToken, async (req, res) => {
    try {
        const { email } = req.user;
        const { Item } = await dynamoDb.send(new GetCommand({
            TableName: USERS_TABLE,
            Key: { email }
        }));
        
        if (!Item) return res.status(404).json({ error: "User not found" });

        // Merge DB data with default profile structure required by the frontend
        const defaultProfile = {
            firstName: Item.name || email.split("@")[0],
            lastName: '',
            email: Item.email,
            phone: '',
            role: '',
            level: 'Entry-Level',
            skills: [],
            preferences: { emailNotifications: true, smsNotifications: false, theme: 'System' },
            ...Item
        };

        res.status(200).json({ user: defaultProfile });
    } catch (err) {
        logger.error(`GET /me error: ${err.message}`);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

// PUT /api/auth/me
router.put("/me", verifyToken, async (req, res) => {
    try {
        const { email } = req.user;
        const updates = req.body;

        // Strip fields that must never be overwritten by the client
        const { uid, email: _email, createdAt, ...safeUpdates } = updates;

        // Get existing item to merge properties since partial DynamoDB updates are annoying
        const { Item } = await dynamoDb.send(new GetCommand({ TableName: USERS_TABLE, Key: { email } }));
        if (!Item) return res.status(404).json({ error: "User not found" });

        const updatedItem = { ...Item, ...safeUpdates, email, updatedAt: new Date().toISOString() };

        await dynamoDb.send(new PutCommand({
            TableName: USERS_TABLE,
            Item: updatedItem
        }));

        res.status(200).json({ success: true, user: updatedItem });
    } catch (err) {
        logger.error(`PUT /me error: ${err.message}`);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

module.exports = router;
