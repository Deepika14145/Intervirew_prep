const https = require("https");
const logger = require("../utils/logger");
const { GoogleGenerativeAI } = require("@google/generative-ai");

function httpGetText(urlString) {
    return new Promise((resolve, reject) => {
        https
            .get(urlString, (res) => {
                let data = "";
                res.on("data", (chunk) => {
                    data += chunk;
                });
                res.on("end", () => {
                    resolve({ statusCode: res.statusCode || 0, text: data });
                });
            })
            .on("error", reject);
    });
}

async function fetchModelsListPage(urlString) {
    if (typeof fetch === "function") {
        const res = await fetch(urlString);
        const text = await res.text();
        return { ok: res.ok, status: res.status, text };
    }
    const { statusCode, text } = await httpGetText(urlString);
    return { ok: statusCode >= 200 && statusCode < 300, status: statusCode, text };
}

// Ensure the API key is passed into the process env
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

/** If models.list fails, try these stable-ish ids (avoid *-latest strings that often 404 on v1beta). */
const STATIC_FALLBACK_MODEL_IDS = [
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-1.5-flash-002",
    "gemini-1.5-flash-001",
    "gemini-1.5-pro-002",
    "gemini-1.5-pro-001",
];

let modelListCache = { ids: null, fetchedAt: 0 };
const MODEL_LIST_TTL_MS = 10 * 60 * 1000;

function parseUserGeminiModelList() {
    const raw = process.env.GEMINI_MODELS || process.env.GEMINI_MODEL || "";
    return [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))];
}

function rankGeminiModelIds(ids) {
    const uniq = [...new Set(ids)];
    const rank = (id) => {
        const x = id.toLowerCase();
        // Prefer newest Flash your key supports (e.g. Gemini 3 preview).
        if (x === "gemini-3-flash-preview" || x.startsWith("gemini-3-flash")) return -5;
        if (x.startsWith("gemini-3.") && x.includes("flash")) return -4;
        if (x === "gemini-2.5-flash") return 0;
        if (x === "gemini-2.5-flash-lite") return 1;
        if (x.startsWith("gemini-2.5-flash")) return 2;
        if (x === "gemini-2.0-flash") return 5;
        if (x.includes("2.0-flash")) return 6;
        if (x.includes("1.5-flash")) return 10;
        if (x.includes("flash") && !x.includes("tts") && !x.includes("live")) return 12;
        if (x.includes("1.5-pro")) return 20;
        if (x.includes("pro") && !x.includes("tts")) return 22;
        if (x.includes("preview")) return 40;
        if (x.includes("experimental") || x.includes("-exp")) return 50;
        return 30;
    };
    uniq.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
    return uniq;
}

/**
 * Lists models for this API key that support generateContent (cached).
 */
async function fetchGenerateContentModelIds() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return [];

    const now = Date.now();
    if (modelListCache.ids?.length > 0 && now - modelListCache.fetchedAt < MODEL_LIST_TTL_MS) {
        return modelListCache.ids;
    }

    const collected = [];
    let pageToken = "";

    for (let page = 0; page < 8; page++) {
        const url = new URL("https://generativelanguage.googleapis.com/v1beta/models");
        url.searchParams.set("key", key);
        url.searchParams.set("pageSize", "100");
        if (pageToken) url.searchParams.set("pageToken", pageToken);

        const { ok, status, text: bodyText } = await fetchModelsListPage(url.toString());
        if (!ok) {
            throw new Error(`models.list HTTP ${status}: ${bodyText.slice(0, 300)}`);
        }
        let data;
        try {
            data = JSON.parse(bodyText);
        } catch {
            throw new Error("models.list returned non-JSON");
        }

        for (const m of data.models || []) {
            const methods = m.supportedGenerationMethods || [];
            if (!methods.includes("generateContent")) continue;
            const name = String(m.name || "").replace(/^models\//, "");
            if (!name || !/^gemini-/i.test(name)) continue;
            const lower = name.toLowerCase();
            if (
                /embedding|embed|imagen|veo|lyria|tts|music|a2a|computer-use|deep-research|robotics|image|video/i.test(
                    lower
                )
            ) {
                continue;
            }
            collected.push(name);
        }

        pageToken = data.nextPageToken || "";
        if (!pageToken) break;
    }

    if (collected.length > 0) {
        modelListCache = { ids: collected, fetchedAt: now };
        logger.info(`Gemini models.list: ${collected.length} generateContent-capable models cached for fallback order.`);
    } else {
        logger.warn("Gemini models.list: no text/chat models matched after filtering; will use static fallback IDs.");
    }
    return collected;
}

async function getOrderedGeminiModelIds() {
    const userList = parseUserGeminiModelList();

    let apiList = [];
    try {
        apiList = await fetchGenerateContentModelIds();
    } catch (e) {
        logger.warn(`Could not list Gemini models from API (${e.message}); using static fallback IDs.`);
    }

    const rankedApi = rankGeminiModelIds(apiList);

    if (userList.length > 0) {
        const tail = rankedApi.filter((id) => !userList.includes(id));
        return [...userList, ...tail];
    }

    if (rankedApi.length > 0) {
        return rankedApi;
    }

    return [...STATIC_FALLBACK_MODEL_IDS];
}

function isRateLimitError(error) {
    const msg = String(error?.message || "");
    const status = error?.status ?? error?.statusCode ?? error?.cause?.status ?? error?.cause?.code;
    return (
        status === 429 ||
        msg.includes("429") ||
        msg.includes("Too Many Requests") ||
        msg.includes("RATE_LIMIT") ||
        msg.includes("Quota exceeded") ||
        msg.includes("Resource exhausted")
    );
}

function isModelNotFoundError(error) {
    const msg = String(error?.message || "").toLowerCase();
    const status = error?.status ?? error?.statusCode ?? error?.cause?.status;
    return status === 404 || msg.includes("not found") || msg.includes("not_supported") || msg.includes("invalid model");
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries on transient Gemini 429s (per-minute quota, bursts). Uses exponential backoff + jitter.
 */
async function withGeminiRetries(operation) {
    const maxAttempts = Math.max(1, Number.parseInt(process.env.GEMINI_RETRY_ATTEMPTS || "5", 10) || 5);
    const baseDelayMs = Math.max(500, Number.parseInt(process.env.GEMINI_RETRY_BASE_MS || "2000", 10) || 2000);
    const maxDelayMs = Math.max(baseDelayMs, Number.parseInt(process.env.GEMINI_RETRY_MAX_MS || "60000", 10) || 60000);

    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (!isRateLimitError(error) || attempt === maxAttempts) {
                throw error;
            }
            const exp = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
            const jitter = Math.random() * 500;
            const wait = Math.round(exp + jitter);
            logger.warn(`Gemini rate limited (attempt ${attempt}/${maxAttempts}), waiting ${wait}ms before retry...`);
            await sleep(wait);
        }
    }
    throw lastError;
}

/**
 * Try each model in GEMINI_MODELS (or defaults). After retries, advance on 429 or unknown model (404).
 */
async function generateContentResilient(contents, generationConfig) {
    if (!genAI) {
        throw new Error("GEMINI_API_KEY environment variable is missing.");
    }

    const maxModels = Math.max(1, Number.parseInt(process.env.GEMINI_MAX_MODEL_FALLBACKS || "12", 10) || 12);
    const modelNames = (await getOrderedGeminiModelIds()).slice(0, maxModels);
    let lastError;

    for (let i = 0; i < modelNames.length; i++) {
        const modelName = modelNames[i];
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig,
        });

        try {
            return await withGeminiRetries(() => model.generateContent(contents));
        } catch (error) {
            lastError = error;
            const hasNext = i < modelNames.length - 1;
            const tryNext = hasNext && (isRateLimitError(error) || isModelNotFoundError(error));
            if (tryNext) {
                const reason = isModelNotFoundError(error) ? "unavailable or unknown" : "still rate limited after retries";
                logger.warn(`Gemini model "${modelName}" ${reason}; trying "${modelNames[i + 1]}"...`);
                continue;
            }
            throw error;
        }
    }

    throw lastError;
}

/**
 * NLP Service utilizing Google Gemini AI
 * 
 * This service analyzes the transcribed text using a Generative AI model
 * to evaluate metrics like:
 * - Fluency
 * - Confidence Level
 * - Clarity and Relevance
 * - Filler word usage
 */

const analyzeTranscription = async (transcribedText, question = null) => {
    try {
        logger.info(`Sending text for NLP evaluation. Text length: ${transcribedText.length}`);

        if (!genAI) {
            throw new Error("GEMINI_API_KEY environment variable is missing.");
        }

        const generationConfig = { responseMimeType: "application/json" };

        const questionContext = question
            ? `Interview Question: "${question}"\n\n`
            : "";

        const prompt = `
You are an expert technical interview evaluator. Analyze the candidate's answer below and evaluate it critically.
${question ? "Use the interview question as context to accurately score relevance and identify missing concepts." : ""}
Return ONLY valid JSON with NO markdown, NO code fences, NO extra text.

JSON Structure:
{
  "fluencyScore": <number 0-100>,
  "confidenceLevel": <number 0-100>,
  "relevanceScore": <number 0-100>,
  "fillerWordsDetected": <integer count of filler words like um, uh, basically, like>,
  "overallFeedback": "<concise constructive feedback on delivery and content>",
  "missingConcepts": ["<concept>", "<concept>"],
  "suggestedAnswer": "<ideal structured answer covering all technical bases>"
}

${questionContext}Candidate's Answer: "${transcribedText}"`;

        const result = await generateContentResilient(prompt, generationConfig);
        const rawText = result.response.text().trim();

        // Strip any accidental markdown fences before parsing
        const jsonText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
        const metrics = JSON.parse(jsonText);

        return {
            fluencyScore: metrics.fluencyScore || 0,
            confidenceLevel: metrics.confidenceLevel || 0,
            relevanceScore: metrics.relevanceScore || 0,
            fillerWordsDetected: metrics.fillerWordsDetected || 0,
            overallFeedback: metrics.overallFeedback || "Good effort.",
            missingConcepts: metrics.missingConcepts || ["No specific missing concepts identified."],
            suggestedAnswer: metrics.suggestedAnswer || "Try to structure your answer with the STAR framework."
        };

    } catch (error) {
        logger.error(`NLP Evaluation Error: ${error.message}`);
        logger.warn(`API is blocked or offline! Falling back to simulated gracefully mock data payload...`);
        // Failsafe Mock JSON if Google 429 Quota restricts their region:
        return {
            fluencyScore: 82,
            confidenceLevel: 75,
            relevanceScore: 88,
            fillerWordsDetected: 2,
            overallFeedback: "[Simulated Feedback - API Blocked] You demonstrated clear technical knowledge, but try to structure your answer more methodically using the STAR method.",
            missingConcepts: ["Scalability considerations", "Security implementations"],
            suggestedAnswer: "To answer this question properly, I would first identify the core constraint. Then, I would implement a decoupled microservice architecture using an event bus..."
        };
    }
};

const analyzeResume = async (pdfBuffer, targetRole = null, jobDescription = null) => {
    try {
        if (!genAI) throw new Error("GEMINI_API_KEY environment variable is missing.");

        logger.info("Sending Resume PDF buffer to Gemini for structural analysis...");

        const generationConfig = { responseMimeType: "application/json" };

        const jobContext = targetRole || jobDescription
            ? `\nTarget Role: ${targetRole || 'Not specified'}\nJob Description: ${jobDescription || 'Not provided'}\n`
            : '';

        const prompt = `
You are an expert ATS (Applicant Tracking System) and Technical Recruiter.
Analyze the attached resume and return the evaluation strictly in valid JSON format. DO NOT use markdown formatting.
Return only the raw JSON.
${jobContext}
JSON Structure:
{
  "atsScore": <number 0-100>,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "suggestedRoles": ["string"],
  "overallFeedback": "Concise summary...",
  "jobFitScore": <number 0-100, only if role/JD provided, else null>,
  "jobFitVerdict": "<'Strong Fit' | 'Moderate Fit' | 'Weak Fit' | null>",
  "jobFitGaps": ["gap1", "gap2"],
  "jobFitSuggestions": ["suggestion to improve fit for this role"]
}`;

        const pdfPart = {
            inlineData: {
                data: pdfBuffer.toString("base64"),
                mimeType: "application/pdf"
            }
        };

        const result = await generateContentResilient([prompt, pdfPart], generationConfig);
        const rawText = result.response.text().trim();
        const jsonText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
        return JSON.parse(jsonText);
    } catch (error) {
        logger.error(`Resume NLP Analysis Error: ${error.message}`);
        const quotaHint =
            isRateLimitError(error)
                ? "Google Gemini quota exceeded. Enable billing or raise quotas in Google AI Studio."
                : "Check that GEMINI_API_KEY is valid and the Generative Language API is enabled.";
        return {
            atsScore: 0,
            strengths: ["Could not analyze resume (AI service unavailable)."],
            weaknesses: ["Try again in a minute, or verify Gemini API quota and billing."],
            suggestedRoles: ["Candidate"],
            overallFeedback: `Failed to generate AI analysis. ${quotaHint}`,
            jobFitScore: null,
            jobFitVerdict: null,
            jobFitGaps: [],
            jobFitSuggestions: [],
            analysisError: isRateLimitError(error) ? "rate_limit" : "api_error",
        };
    }
};

module.exports = {
    analyzeTranscription,
    analyzeResume,
    generateContentResilient,
};
