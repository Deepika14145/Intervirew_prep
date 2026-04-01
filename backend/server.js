require("dotenv").config();
const express = require("express");
const cors = require("cors");
const logger = require("./utils/logger");

const s3Routes = require("./routes/s3Routes");
const dynamoRoutes = require("./routes/dynamoRoutes");
const evaluationRoutes = require("./routes/evaluationRoutes");
const pollyRoutes = require("./routes/pollyRoutes");
const profileRoutes = require("./routes/profileRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/s3", s3Routes);
app.use("/api/dynamodb", dynamoRoutes);
app.use("/api/evaluation", evaluationRoutes);
app.use("/api/polly", pollyRoutes);
app.use("/api/profile", profileRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
    logger.info("Health check endpoint pinged");
    res.status(200).json({ status: "OK", message: "Server is running." });
});

// Lex chatbot proxy (if moved from lambda or just integrating)
// Usually you hit the lambda from frontend, but we can have it here too.

app.listen(PORT, () => {
    logger.info(`Server started on port ${PORT}`);
    console.log(`Server started on port ${PORT}`);
});
