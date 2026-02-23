/**
 * Stub Pages — Dashboard, Performance, Resumes, Career
 * ─────────────────────────────────────────────────────
 * All four unimplemented pages live in this single file as
 * named exports. When building a page for real:
 *   1. Create  src/pages/MyPage.jsx + MyPage.module.css
 *   2. Remove its export from this file
 *   3. Update the import in App.jsx
 */

import StubPage from './StubPage';

// ── Performance ──────────────────────────────────────────────
export function Performance() {
    return (
        <StubPage
            title="Performance"
            description="Deep-dive analytics on your skill progression across all past interview sessions."
            icon={
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
            }
            scope={[
                'Multi-week score trend chart (Line chart via Recharts) per skill category',
                'Skill breakdown radar/spider chart — Technical, Communication, Confidence, Domain Knowledge',
                'Interview-by-interview score list with expandable feedback panel',
                'Strength / Weakness summary cards generated from AI feedback',
                'Goal-setting UI — users set target scores per skill for the next session',
                'Export report button — download PDF summary',
            ]}
        />
    );
}

// ── Resumes ──────────────────────────────────────────────────
export function Resumes() {
    return (
        <StubPage
            title="Resume Analyzer"
            description="Upload your resume and get AI-powered feedback on content, ATS compatibility, and keyword gaps."
            icon={
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                </svg>
            }
            scope={[
                'Drag-and-drop PDF/DOCX upload (use react-dropzone)',
                'AI-parsed resume fields: name, skills, experience, education, projects',
                'Side-by-side view: uploaded resume text vs AI feedback annotations',
                'ATS keyword match score — shows % match vs selected Job Role',
                'Suggested improvements — bullet list with severity (High / Medium / Low)',
                'Download improved resume button (optional stretch goal)',
            ]}
        />
    );
}

// ── Career ───────────────────────────────────────────────────
export function Career() {
    return (
        <StubPage
            title="Career Advice"
            description="Personalised role roadmaps, curated resources, and AI-powered career guidance."
            icon={
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
            }
            scope={[
                'Role roadmap cards — recommended learning paths per career goal',
                'AI-curated resources: courses, articles, practice problems per topic',
                'Interview tips feed — tiered by difficulty and role category',
                'Salary insights widget — market range for selected job role & level',
                'Chatbot integration — "Ask AI" opens the floating chatbot with career context',
            ]}
        />
    );
}
