/**
 * lexProxy Lambda — IntervAI Chatbot
 * ----------------------------------------------------
 * Receives a user message from the frontend, sends it
 * to Amazon Lex V2 (IntervAIAssistant), and returns
 * the bot's response messages.
 *
 * Runtime: Node.js 20.x
 * AWS SDK v3 is built-in — no extra dependencies needed.
 */

import {
  LexRuntimeV2Client,
  RecognizeTextCommand,
} from "@aws-sdk/client-lex-runtime-v2";

const BOT_ID       = "HP47YEOH8M";
const BOT_ALIAS_ID = "PNDWA5KGB1";
const LOCALE_ID    = "en_US";
const REGION       = "ap-southeast-1";

const lexClient = new LexRuntimeV2Client({ region: REGION });

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",         // tighten to your domain in prod
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const handler = async (event) => {
  // ── Handle CORS pre-flight
  if (event.httpMethod === "OPTIONS" || event.requestContext?.http?.method === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  try {
    const body      = JSON.parse(event.body || "{}");
    const { message, sessionId } = body;

    if (!message || !sessionId) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "message and sessionId are required." }),
      };
    }

    const command = new RecognizeTextCommand({
      botId:      BOT_ID,
      botAliasId: BOT_ALIAS_ID,
      localeId:   LOCALE_ID,
      sessionId,
      text:       message,
    });

    const lexResponse = await lexClient.send(command);

    // Lex can return multiple message bubbles — collect them all
    const messages = (lexResponse.messages ?? []).map((m) => m.content);

    // Fallback if Lex returns nothing
    if (messages.length === 0) {
      messages.push(
        "Hmm, I didn't quite get that. Try asking me to start a mock interview, get resume help, or share some tips!"
      );
    }

    return {
      statusCode: 200,
      headers:    CORS_HEADERS,
      body:       JSON.stringify({ messages }),
    };
  } catch (err) {
    console.error("Lex error:", err);
    return {
      statusCode: 500,
      headers:    CORS_HEADERS,
      body:       JSON.stringify({
        error:    "Failed to reach the bot. Please try again.",
        messages: ["I'm having trouble connecting right now. Please try again in a moment!"],
      }),
    };
  }
};
