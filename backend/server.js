require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const logger = require("./utils/logger");

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err.message, err.stack);
});

process.on('unhandledRejection', (reason) => {
    console.error('UNHANDLED REJECTION:', reason);
});

const s3Routes = require("./routes/s3Routes");
const dynamoRoutes = require("./routes/dynamoRoutes");
const evaluationRoutes = require("./routes/evaluationRoutes");
const pollyRoutes = require("./routes/pollyRoutes");
const transcribeRoutes = require("./routes/transcribeRoutes");
const authRoutes = require("./routes/authRoutes");
const questionsRoutes = require("./routes/questionsRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
    app.set("trust proxy", Number.parseInt(process.env.TRUST_PROXY_HOPS || "1", 10) || 1);
}

app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);

const rawOrigins = process.env.FRONTEND_URL || "http://localhost:5173";
const corsOrigins = rawOrigins.split(",").map((s) => s.trim()).filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, curl, Render health checks)
            if (!origin) return callback(null, true);
            // Allow if matches any configured origin
            if (corsOrigins.some(o => origin === o || origin.endsWith('.onrender.com'))) {
                return callback(null, true);
            }
            return callback(null, false);
        },
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    })
);

app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const rateLimitWindowMs =
    Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(15 * 60 * 1000), 10) || 15 * 60 * 1000;
const rateLimitMax =
    Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || (isProduction ? "400" : "3000"), 10) ||
    (isProduction ? 400 : 3000);

app.use(
    "/api",
    rateLimit({
        windowMs: rateLimitWindowMs,
        max: rateLimitMax,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: "Too many requests. Try again later." },
    })
);

app.use("/api/s3", s3Routes);
app.use("/api/dynamodb", dynamoRoutes);
app.use("/api/evaluation", evaluationRoutes);
app.use("/api/polly", pollyRoutes);
app.use("/api/transcribe", transcribeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/questions", questionsRoutes);
app.use("/api/chat", chatRoutes);

app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", message: "Server is running." });
});

app.use((err, req, res, next) => {
    logger.error(`Unhandled error: ${err.message}`);
    if (res.headersSent) {
        return next(err);
    }
    const body = isProduction
        ? { error: "Internal server error." }
        : { error: err.message || "Internal server error." };
    res.status(500).json(body);
});

app.listen(PORT, () => {
    logger.info(`Server started on port ${PORT}`);
});
