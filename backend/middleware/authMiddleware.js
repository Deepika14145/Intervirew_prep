const admin = require("../utils/firebaseAdmin");

async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized. Missing Bearer token." });
    }
    
    const token = authHeader.split(" ")[1];
    
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        // Attach the decoded user object (email, uid, etc.) to the request so downstream routes can use it
        req.user = decodedToken; 
        next();
    } catch (error) {
        console.error("Token verification failed:", error);
        return res.status(401).json({ error: "Invalid, expired, or tampered token." });
    }
}

module.exports = verifyToken;
