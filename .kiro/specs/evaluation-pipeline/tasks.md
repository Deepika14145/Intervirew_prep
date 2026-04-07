# Implementation Plan: Evaluation Pipeline

## Overview

Complete and harden the end-to-end evaluation pipeline: transcription → NLP evaluation → DynamoDB persistence → AnalysisPage rendering → Dashboard integration. The codebase has partial implementations; tasks focus on closing gaps, adding auth guards, wiring the frontend correctly, and verifying correctness with property-based tests using fast-check.

## Tasks

- [x] 1. Harden AWS config as single source of truth
  - Export `dynamoClient` (raw `DynamoDBClient`) from `utils/awsConfig.js` in addition to the existing exports, so all routes can import AWS clients exclusively from this module
  - Verify `s3Client`, `dynamoDocClient`, `pollyClient`, and `dynamoClient` are all exported
  - Confirm `region` defaults to `"us-east-1"` when `AWS_REGION` env var is absent
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 2. Harden the transcription route (`transcribeRoutes.js`)
  - [x] 2.1 Propagate Deepgram upstream error status codes
    - When Deepgram returns a non-2xx status, respond with that exact HTTP status code (not always 500)
    - Log the full error details before responding
    - _Requirements: 2.4_

  - [ ]* 2.2 Write property test for transcript extraction round-trip (Property 2)
    - **Property 2: Transcript extraction from Deepgram response**
    - Generate arbitrary non-empty strings; mock the Deepgram fetch response; assert the route returns `{ status: "COMPLETED", transcript: <that string> }`
    - Tag: `// Feature: evaluation-pipeline, Property 2: Transcript extraction from Deepgram response`
    - **Validates: Requirements 2.2**

  - [ ]* 2.3 Write property test for upstream error status propagation (Property 3)
    - **Property 3: Upstream error status propagation**
    - Generate integers in [400, 599]; mock Deepgram to return that status; assert route response status matches
    - Tag: `// Feature: evaluation-pipeline, Property 3: Upstream error status propagation`
    - **Validates: Requirements 2.4**

- [x] 3. Harden `nlpService.js`
  - [x] 3.1 Add input sanitization in `evaluationRoutes.js` before calling `analyzeTranscription`
    - Apply `text.replace(/[\`\u0000-\u001F\u007F]/g, " ").trim()` to both `transcribedText` and `question` before passing to the service (already present — verify it is correct and covers all required code points)
    - _Requirements: 3.2_

  - [x] 3.2 Verify markdown fence stripping and JSON parse in `nlpService.js`
    - Confirm the regex `rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")` handles all fence variants (` ```json `, ` ``` `, no fences)
    - Ensure the fallback object is returned on any parse or API error
    - _Requirements: 3.3, 3.4_

  - [ ]* 3.3 Write property test for input sanitization (Property 5)
    - **Property 5: Input sanitization removes injection characters**
    - Generate strings with arbitrary backtick and control character content; apply the sanitization regex; assert no forbidden characters remain in the output
    - Tag: `// Feature: evaluation-pipeline, Property 5: Input sanitization removes injection chars`
    - **Validates: Requirements 3.2**

  - [ ]* 3.4 Write property test for markdown fence stripping (Property 6)
    - **Property 6: Markdown fence stripping preserves JSON content**
    - Generate valid `EvaluationResult` objects; wrap in ` ```json `, ` ``` `, and no-fence variants; assert parse result equals the original object
    - Tag: `// Feature: evaluation-pipeline, Property 6: Markdown fence stripping preserves JSON content`
    - **Validates: Requirements 3.3**

  - [ ]* 3.5 Write property test for NLP output score ranges (Property 7)
    - **Property 7: NLP output scores are in valid ranges**
    - Generate arbitrary text/question pairs; mock Gemini with boundary values; assert `0 ≤ fluencyScore ≤ 100`, `0 ≤ confidenceLevel ≤ 100`, `0 ≤ relevanceScore ≤ 100`, `fillerWordsDetected ≥ 0`
    - Tag: `// Feature: evaluation-pipeline, Property 7: NLP output score ranges`
    - **Validates: Requirements 3.6**

- [x] 4. Harden the evaluation route (`evaluationRoutes.js`)
  - [x] 4.1 Verify 400 guard for missing fields
    - Confirm the route returns HTTP 400 with `"Missing transcribedText or answerId."` when either field is absent
    - _Requirements: 4.4_

  - [x] 4.2 Verify DynamoDB merge preserves existing fields
    - Confirm the `GetCommand` + spread merge pattern keeps all existing item attributes when upserting NLP metrics
    - Ensure `sessionId` is always written to the merged item
    - _Requirements: 4.2, 8.4_

  - [x] 4.3 Verify `updated_at` is set on every upsert
    - Confirm `updated_at: new Date().toISOString()` is present in the merged item on every write
    - _Requirements: 4.3_

  - [ ]* 4.4 Write property test for DynamoDB upsert field preservation (Property 8)
    - **Property 8: DynamoDB upsert preserves existing fields**
    - Generate arbitrary existing DynamoDB items and NLP metric objects; run the merge logic; assert all original keys are present in the merged output alongside all NLP fields
    - Tag: `// Feature: evaluation-pipeline, Property 8: DynamoDB upsert preserves existing fields`
    - **Validates: Requirements 4.2**

  - [ ]* 4.5 Write property test for updated_at ISO 8601 format (Property 9)
    - **Property 9: Every upsert sets a valid updated_at timestamp**
    - Generate valid requests; assert `updated_at` in the written item matches `/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z$/`
    - Tag: `// Feature: evaluation-pipeline, Property 9: updated_at is valid ISO 8601`
    - **Validates: Requirements 4.3**

  - [ ]* 4.6 Write property test for sessionId persisted in DynamoDB record (Property 14)
    - **Property 14: sessionId persisted in DynamoDB NLP record**
    - Generate requests with arbitrary `sessionId` strings; assert the item written to DynamoDB contains that exact `sessionId` value
    - Tag: `// Feature: evaluation-pipeline, Property 14: sessionId persisted in DynamoDB record`
    - **Validates: Requirements 8.4**

- [x] 5. Add auth middleware to the DynamoDB answer route (`dynamoRoutes.js`)
  - Import `verifyToken` from `../middleware/authMiddleware` in `dynamoRoutes.js`
  - Apply `verifyToken` middleware to `POST /answer` and `POST /session` routes
  - Leave `GET /sessions` unprotected or protect it as appropriate
  - _Requirements: 4.5_

- [ ] 6. Checkpoint — Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Wire `InterviewSession.jsx` correctly
  - [x] 7.1 Verify parallel submission uses `Promise.all` with auth headers
    - Confirm both `POST /api/dynamodb/answer` and `POST /api/evaluation/process-transcription` are dispatched concurrently via `Promise.all`
    - Confirm both requests include `Authorization: Bearer <token>` header using `localStorage.getItem('authToken')`
    - Confirm the same `answerId` value is used in both request bodies
    - _Requirements: 5.1, 5.2, 8.5_

  - [x] 7.2 Verify evaluation result is read from `Promise.all` resolution (not stale state)
    - Confirm `navigate('/analysis', { state: { evaluation: fetchedEval } })` uses the value destructured from `Promise.all`, not a React state variable
    - _Requirements: 5.2_

  - [x] 7.3 Verify question context is passed to the evaluation request
    - Confirm `currentQ.question` is included in the `POST /api/evaluation/process-transcription` body as the `question` field
    - _Requirements: 3.1_

  - [ ]* 7.4 Write property test for sessionId format invariant (Property 12)
    - **Property 12: sessionId format invariant**
    - Generate InterviewSession component instances; assert the generated `sessionId` matches `/^session_\d+$/`
    - Tag: `// Feature: evaluation-pipeline, Property 12: sessionId format invariant`
    - **Validates: Requirements 8.1**

  - [ ]* 7.5 Write property test for same answerId in both parallel requests (Property 13)
    - **Property 13: Both parallel requests use the same answerId**
    - Generate answer submissions; capture both fetch calls via mocked `fetch`; assert the `answerId` values in both request bodies are identical
    - Tag: `// Feature: evaluation-pipeline, Property 13: Both parallel requests use the same answerId`
    - **Validates: Requirements 8.5**

  - [ ]* 7.6 Write property test for buttons disabled during transcription (Property 1)
    - **Property 1: Buttons disabled during active transcription**
    - Generate `transcribeStatus` values from `['uploading', 'transcribing']`; render the InterviewSession component; assert both the mic button and submit button have the `disabled` attribute
    - Tag: `// Feature: evaluation-pipeline, Property 1: Buttons disabled during active transcription`
    - **Validates: Requirements 1.4**

  - [ ]* 7.7 Write property test for transcript appended to textarea on success (Property 4)
    - **Property 4: Transcript appended to textarea on success**
    - Generate arbitrary non-empty transcript strings; mock `fetch` to return that transcript; assert the `response` state contains the string and `transcribeStatus === 'done'`
    - Tag: `// Feature: evaluation-pipeline, Property 4: Transcript appended to textarea on success`
    - **Validates: Requirements 2.5**

- [x] 8. Complete `AnalysisPage.jsx` rendering
  - [x] 8.1 Verify all 7 evaluation fields are rendered
    - Confirm `fluencyScore`, `confidenceLevel`, `relevanceScore` render as animated progress bars with correct labels ("Vocabulary & Fluency", "Tone & Confidence", "Relevance to Question")
    - Confirm `fillerWordsDetected` renders as a count badge in the AI Evaluation Summary card
    - Confirm `overallFeedback` renders in the AI Evaluation Summary paragraph
    - Confirm `missingConcepts` renders as tags when non-empty and not solely "No specific…" entries
    - Confirm `suggestedAnswer` renders in the AI Spec Model Answer section
    - _Requirements: 6.2, 6.4, 6.5, 6.6, 6.7_

  - [x] 8.2 Verify fallback defaults when `evaluation` is absent from Router state
    - Confirm the page renders placeholder values (not a crash) when `location.state` is `undefined` or `null`
    - _Requirements: 6.8_

  - [x] 8.3 Verify `overallAvg` computation
    - Confirm `overallAvg = Math.round((fluencyScore + confidenceLevel + relevanceScore) / 3)` is used for the score ring
    - _Requirements: 6.3_

  - [ ]* 8.4 Write property test for overallAvg arithmetic (Property 11)
    - **Property 11: overallAvg is the correct arithmetic mean**
    - Generate triples `(a, b, c)` where each value is an integer in [0, 100]; assert `overallAvg === Math.round((a + b + c) / 3)`
    - Tag: `// Feature: evaluation-pipeline, Property 11: overallAvg is the correct arithmetic mean`
    - **Validates: Requirements 6.3**

  - [ ]* 8.5 Write property test for AnalysisPage renders all evaluation fields (Property 10)
    - **Property 10: AnalysisPage renders all evaluation fields**
    - Generate arbitrary valid `EvaluationResult` objects; render the AnalysisPage with those values as Router state; assert each field appears in the appropriate DOM section
    - Tag: `// Feature: evaluation-pipeline, Property 10: AnalysisPage renders all evaluation fields`
    - **Validates: Requirements 6.2, 6.4, 6.5, 6.6, 6.7**

- [ ] 9. Checkpoint — Ensure all frontend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Connect Dashboard to real DynamoDB session data
  - [x] 10.1 Add `GET /api/dynamodb/answers` route to `dynamoRoutes.js`
    - Implement a `ScanCommand` (or `QueryCommand` by `sessionId`) on the `InterviewAnswers` table
    - Return `{ answers: [...] }` with NLP metric fields included
    - Protect the route with `verifyToken` middleware
    - _Requirements: 4.1, 6.1_

  - [x] 10.2 Replace mock data in `Dashboard.jsx` with real API data
    - On mount, fetch sessions from `GET /api/dynamodb/sessions` with the Firebase auth token
    - Compute `technicalScore` as the average of `nlpRelevanceScore` across fetched answers, `communicationScore` from `nlpFluencyScore`, and `confidenceScore` from `nlpConfidenceLevel`
    - Populate `recentInterviews` from the fetched sessions list
    - Show the existing skeleton loader while data is loading; fall back to zeros/empty arrays on fetch error
    - _Requirements: 6.1_

- [x] 11. Install fast-check and configure test runners
  - Add `fast-check` to `devDependencies` in `backend/package.json` and `app/package.json`
  - Add `vitest` (or `jest`) and `@testing-library/react` to `app/package.json` devDependencies for frontend property tests
  - Add test scripts to both `package.json` files: `"test": "vitest --run"` (frontend) and `"test": "jest --runInBand"` (backend)
  - Create `backend/tests/` and `app/src/tests/` directories with a `.gitkeep`
  - _Requirements: all property tests_

- [ ] 12. Final checkpoint — Ensure all tests pass end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check with a minimum of 100 iterations per property
- All 14 correctness properties from the design document are covered across tasks 2–8
- The `dynamoClient` export gap in task 1 is a prerequisite for any route that needs the raw DynamoDB client
