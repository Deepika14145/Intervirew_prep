const admin = require("../utils/firebaseAdmin");
const logger = require("../utils/logger");

async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized. Missing Bearer token." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        logger.warn(`Token verification failed: ${error.message}`);
        return res.status(401).json({ error: "Invalid, expired, or tampered token." });
    }
}

module.exports = verifyToken;
