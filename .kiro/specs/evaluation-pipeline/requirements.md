# Requirements Document

## Introduction

The evaluation pipeline is the core intelligence layer of IntervAI. It captures user answers (typed or voice), routes audio through a transcription service, passes the resulting text to a Gemini-powered NLP evaluator, persists the scored results in DynamoDB, and renders a structured analysis on the dashboard. The pipeline must work end-to-end with zero manual steps between input capture and dashboard display, and must degrade gracefully when any individual service is unavailable.

## Glossary

- **Pipeline**: The end-to-end flow from user input capture through transcription, NLP evaluation, persistence, and dashboard display.
- **InterviewSession**: The React page (`InterviewSession.jsx`) where the user answers interview questions.
- **Transcription_Service**: The backend route (`POST /api/transcribe/deepgram`) that converts audio blobs to text using the Deepgram Nova-2 API.
- **NLP_Service**: The backend module (`nlpService.analyzeTranscription`) that sends transcribed text to Google Gemini 1.5 Flash and returns structured evaluation metrics.
- **Evaluation_API**: The backend route (`POST /api/evaluation/process-transcription`) that orchestrates NLP evaluation and DynamoDB persistence.
- **DynamoDB_Store**: The AWS DynamoDB tables (`InterviewSessions`, `InterviewAnswers`) used to persist session and answer data.
- **AnalysisPage**: The React page (`AnalysisPage.jsx`) that displays evaluation results passed via React Router state.
- **Dashboard**: The React page (`Dashboard.jsx`) that aggregates and displays historical performance metrics.
- **Evaluation_Result**: The structured object `{ fluencyScore, confidenceLevel, relevanceScore, fillerWordsDetected, overallFeedback, missingConcepts, suggestedAnswer }` returned by the NLP_Service.
- **Auth_Token**: A Firebase JWT stored in `localStorage` under the key `authToken`, required by protected backend routes.
- **AWS_Config**: The shared AWS SDK configuration module (`utils/awsConfig.js`) that initialises S3, DynamoDB, and Polly clients from environment variables.

---

## Requirements

### Requirement 1: Voice Input Capture

**User Story:** As an interview candidate, I want to record my spoken answer during an interview session, so that I do not have to type my response manually.

#### Acceptance Criteria

1. WHEN the user activates the microphone button or presses the Space key, THE InterviewSession SHALL request browser microphone access and begin recording audio in `audio/webm` format.
2. WHEN the user deactivates the microphone or presses the Space key a second time, THE InterviewSession SHALL stop the MediaRecorder, release all microphone tracks, and pass the recorded audio blob to the Transcription_Service.
3. IF the browser denies microphone access, THEN THE InterviewSession SHALL set the transcription status to `error` and display a warning message to the user.
4. WHILE a transcription is in progress, THE InterviewSession SHALL disable the microphone button and the submit button to prevent concurrent submissions.
5. THE InterviewSession SHALL display a real-time recording duration counter while the microphone is active.

---

### Requirement 2: Audio Transcription

**User Story:** As an interview candidate, I want my recorded voice answer to be automatically converted to text, so that it can be evaluated by the AI model.

#### Acceptance Criteria

1. WHEN an audio blob is received, THE Transcription_Service SHALL forward the raw audio buffer to the Deepgram Nova-2 API endpoint `https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true`.
2. WHEN the Deepgram API returns a successful response, THE Transcription_Service SHALL extract the transcript string from `results.channels[0].alternatives[0].transcript` and return it in the response body as `{ status: "COMPLETED", transcript: "<text>" }`.
3. IF the `DEEPGRAM_API_KEY` environment variable is absent or contains the placeholder value `YOUR_`, THEN THE Transcription_Service SHALL return HTTP 401 with a descriptive error message.
4. IF the Deepgram API returns a non-2xx status, THEN THE Transcription_Service SHALL return the upstream HTTP status code and log the error details.
5. WHEN a transcription completes successfully, THE InterviewSession SHALL append the transcript text to the response textarea and set the transcription status to `done`.

---

### Requirement 3: NLP Evaluation

**User Story:** As an interview candidate, I want my answer to be evaluated against the interview question, so that I receive structured, actionable feedback.

#### Acceptance Criteria

1. WHEN `analyzeTranscription(text, question)` is called, THE NLP_Service SHALL send a structured prompt to the Gemini 1.5 Flash model requesting a JSON response containing `fluencyScore`, `confidenceLevel`, `relevanceScore`, `fillerWordsDetected`, `overallFeedback`, `missingConcepts`, and `suggestedAnswer`.
2. THE NLP_Service SHALL sanitize the input text and question by stripping backtick characters and ASCII control characters (code points 0x00–0x1F and 0x7F) before constructing the prompt.
3. WHEN the Gemini API returns a response, THE NLP_Service SHALL strip any accidental markdown code fences and parse the result as JSON.
4. IF the Gemini API is unavailable or returns an error, THEN THE NLP_Service SHALL log the error and return a fallback Evaluation_Result with clearly labelled simulated values so the pipeline does not break.
5. IF the `GEMINI_API_KEY` environment variable is absent, THEN THE NLP_Service SHALL throw an error with the message `"GEMINI_API_KEY environment variable is missing."`.
6. THE NLP_Service SHALL return numeric scores in the range 0–100 and a non-negative integer for `fillerWordsDetected`.

---

### Requirement 4: Evaluation Persistence

**User Story:** As an interview candidate, I want my evaluation results to be saved, so that I can review my historical performance on the dashboard.

#### Acceptance Criteria

1. WHEN `POST /api/evaluation/process-transcription` is called with a valid Auth_Token, `answerId`, and `transcribedText`, THE Evaluation_API SHALL invoke the NLP_Service and upsert the resulting metrics into the DynamoDB_Store table `InterviewAnswers`.
2. THE Evaluation_API SHALL merge the NLP metrics with any existing DynamoDB item for the same `answerId` to avoid overwriting previously saved fields.
3. THE Evaluation_API SHALL set the `updated_at` field to the current ISO 8601 timestamp on every upsert.
4. IF `transcribedText` or `answerId` is absent from the request body, THEN THE Evaluation_API SHALL return HTTP 400 with the message `"Missing transcribedText or answerId."`.
5. IF the Auth_Token is missing or invalid, THEN THE Evaluation_API SHALL return HTTP 401 before any processing occurs.
6. WHEN the upsert succeeds, THE Evaluation_API SHALL return HTTP 200 with `{ message: "Transcription processed and saved.", evaluation: <Evaluation_Result> }`.

---

### Requirement 5: Parallel Submission

**User Story:** As an interview candidate, I want my answer to be saved and evaluated simultaneously, so that the submission process is as fast as possible.

#### Acceptance Criteria

1. WHEN the user submits an answer, THE InterviewSession SHALL dispatch the DynamoDB answer-save request (`POST /api/dynamodb/answer`) and the evaluation request (`POST /api/evaluation/process-transcription`) concurrently using `Promise.all`.
2. THE InterviewSession SHALL use the evaluation result returned from `Promise.all` directly, without relying on a subsequent state read, to prevent stale closure issues.
3. IF either parallel request fails, THEN THE InterviewSession SHALL log the error to the console and continue the session flow without blocking navigation.

---

### Requirement 6: Dashboard Display

**User Story:** As an interview candidate, I want to see my evaluation results on a dedicated analysis page immediately after submitting my answer, so that I can understand my performance.

#### Acceptance Criteria

1. WHEN the last question in a session is submitted, THE InterviewSession SHALL navigate to `/analysis` and pass `{ question, answer, evaluation }` as React Router state.
2. WHEN the AnalysisPage mounts, THE AnalysisPage SHALL read `question`, `answer`, and `evaluation` from React Router location state and render them.
3. THE AnalysisPage SHALL compute an `overallAvg` score as the arithmetic mean of `fluencyScore`, `confidenceLevel`, and `relevanceScore`, rounded to the nearest integer.
4. THE AnalysisPage SHALL display `fluencyScore`, `confidenceLevel`, and `relevanceScore` as animated progress bars labelled "Vocabulary & Fluency", "Tone & Confidence", and "Relevance to Question" respectively.
5. THE AnalysisPage SHALL display `fillerWordsDetected` as a count badge within the AI Evaluation Summary card.
6. WHEN `missingConcepts` is a non-empty array that does not consist solely of entries containing the substring `"No specific"`, THE AnalysisPage SHALL render each concept as a tag in the Missing Technical Concepts card.
7. THE AnalysisPage SHALL display `suggestedAnswer` in the AI Spec Model Answer section.
8. IF `evaluation` is absent from React Router state, THEN THE AnalysisPage SHALL render default placeholder values so the page does not crash.

---

### Requirement 7: AWS Service Configuration

**User Story:** As a developer, I want all AWS services to be initialised from a single configuration module, so that credentials and region settings are consistent across the application.

#### Acceptance Criteria

1. THE AWS_Config SHALL initialise `S3Client`, `DynamoDBClient`, `DynamoDBDocumentClient`, and `PollyClient` using the `AWS_REGION` environment variable, defaulting to `"us-east-1"` when the variable is absent.
2. THE AWS_Config SHALL rely on the AWS SDK's default credential resolution chain (environment variables, EC2 instance profile, etc.) and SHALL NOT hard-code credentials.
3. WHEN any backend route requires an AWS client, THE route SHALL import it exclusively from `utils/awsConfig.js`.
4. IF the `AWS_REGION` environment variable is set, THEN THE AWS_Config SHALL use that value for all client initialisations.

---

### Requirement 8: End-to-End Pipeline Integrity

**User Story:** As a developer, I want the full pipeline from input to dashboard to be traceable by a shared session identifier, so that all records for a session can be correlated.

#### Acceptance Criteria

1. THE InterviewSession SHALL generate a unique `sessionId` of the format `session_<timestamp>` once per session and reuse it for all answer submissions within that session.
2. WHEN saving an answer to DynamoDB, THE InterviewSession SHALL include the `sessionId` in the request body.
3. WHEN calling the Evaluation_API, THE InterviewSession SHALL include the `sessionId` in the request body.
4. THE Evaluation_API SHALL persist the `sessionId` alongside NLP metrics in the DynamoDB_Store so that all answers for a session can be retrieved by `sessionId`.
5. WHEN the DynamoDB answer-save and evaluation requests are dispatched, THE InterviewSession SHALL use the same `answerId` value for both requests so that the two writes can be merged by the Evaluation_API.
