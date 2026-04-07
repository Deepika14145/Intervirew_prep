const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../utils/logger");

const router = express.Router();
const sessions = new Map();

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const SYSTEM_PROMPT = `You are IntervAI Assistant, a friendly AI career coach on the IntervAI interview prep platform.
Help users with: mock interview tips, resume advice, career guidance, technical interview prep, salary tips.
Keep responses to 2-4 sentences. Be warm and practical. Redirect off-topic questions back to careers/interviews.`;

router.post("/message", verifyToken, async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        if (!message?.trim()) return res.status(400).json({ error: "Message is required." });

        if (!genAI) {
            return res.json({ messages: ["AI service is not configured. Please check the GEMINI_API_KEY."] });
        }

        // Build history
        const history = sessions.get(sessionId) || [];
        history.push(`User: ${message}`);
        if (history.length > 20) history.splice(0, 2);

        const prompt = `${SYSTEM_PROMPT}\n\nConversation:\n${history.join('\n')}\n\nAssistant:`;

        // Try models in order
        const models = ['gemini-2.0-flash', 'gemini-1.5-flash-002', 'gemini-1.5-flash-001', 'gemini-1.5-pro-002'];
        let reply = null;

        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                reply = result.response.text().trim();
                break;
            } catch (err) {
                const isRateLimit = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('Resource exhausted');
                const isNotFound = err.message?.includes('404') || err.message?.includes('not found');
                if ((isRateLimit || isNotFound) && modelName !== models[models.length - 1]) {
                    logger.warn(`Chat: model ${modelName} failed (${err.message?.slice(0,60)}), trying next...`);
                    continue;
                }
                throw err;
            }
        }

        if (!reply) throw new Error('All models failed');

        history.push(`Assistant: ${reply}`);
        sessions.set(sessionId, history);
        if (sessions.size > 500) sessions.delete(sessions.keys().next().value);

        logger.info(`Chat reply for session ${sessionId?.slice(0,12)}: ${reply.slice(0,60)}...`);
        res.json({ messages: [reply] });

    } catch (error) {
        logger.error(`Chat error: ${error.message}`);
        res.json({ messages: ["I'm having a moment — please try again in a second! 🙏"] });
    }
});

module.exports = router;
