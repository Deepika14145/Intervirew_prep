const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const dynamoDb = DynamoDBDocumentClient.from(dynamoClient);

// POST /api/auth/sync
// This endpoint is hit by the frontend immediately after Firebase login/signup.
// We use our verifyToken middleware to securely extract who the user is from their JWT.
router.post("/sync", verifyToken, async (req, res) => {
    try {
        const { email, uid, name } = req.user;
        
        // 1. Check if user already exists
        const getParams = {
            TableName: "InterviewUsers",
            Key: { email }
        };
        const { Item } = await dynamoDb.send(new GetCommand(getParams));
        
        // 2. If new user, save their profile to DynamoDB
        if (!Item) {
            const putParams = {
                TableName: "InterviewUsers",
                Item: {
                    email,
                    uid,
                    name: name || email.split("@")[0],
                    createdAt: new Date().toISOString()
                }
            };
            await dynamoDb.send(new PutCommand(putParams));
            console.log(`New user synced to DynamoDB: ${email}`);
        }

        res.status(200).json({ status: "success", user: req.user });
    } catch (err) {
        console.error("User sync error:", err);
        // Do not crash the login flow just because DynamoDB threw an error (e.g. table not created yet)
        res.status(500).json({ error: "Failed to sync user profile, but authenticated" });
    }
});

// GET /api/auth/me
router.get("/me", verifyToken, async (req, res) => {
    try {
        const { email } = req.user;
        const { Item } = await dynamoDb.send(new GetCommand({
            TableName: "InterviewUsers",
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
        console.error("GET /me error:", err);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

// PUT /api/auth/me
router.put("/me", verifyToken, async (req, res) => {
    try {
        const { email } = req.user;
        const updates = req.body;
        
        // Get existing item to merge properties since partial DynamoDB updates are annoying
        const { Item } = await dynamoDb.send(new GetCommand({ TableName: "InterviewUsers", Key: { email } }));
        if (!Item) return res.status(404).json({ error: "User not found" });

        const updatedItem = { ...Item, ...updates, email }; // Ensure email partition key never changes
        
        await dynamoDb.send(new PutCommand({
            TableName: "InterviewUsers",
            Item: updatedItem
        }));
        
        res.status(200).json({ success: true, user: updatedItem });
    } catch (err) {
        console.error("PUT /me error:", err);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

module.exports = router;
