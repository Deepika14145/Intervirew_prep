# IntervAI — Frontend

> AI-Based Interview Preparation System — React frontend built with **Vite + React + CSS Modules**.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Production build
npm run build
```

**Default landing page:** `/dashboard`  
**Implemented pages:** `/mock-interviews` → `/interview/session`

---

## Tech Stack

| Concern | Tool | Notes |
|---|---|---|
| Framework | **React 18** | Functional components only, hooks-based |
| Bundler | **Vite 7** | HMR, ESM, fast builds |
| Routing | **React Router v7** | `BrowserRouter` + nested `<Route>` |
| Styling | **CSS Modules** | Scoped per-component, zero runtime |
| Design tokens | **CSS Custom Properties** | `src/styles/variables.css` |
| Charts | *(not yet installed)* | Add **Recharts** for Dashboard |
| State | **React `useState`/`useReducer`** | No Redux; add Zustand if state grows |

---

## Project Structure

```
src/
├── styles/
│   ├── variables.css       # ⭐ Design tokens — read this first
│   └── global.css          # Resets, animations, utility classes (.u-*)
│
├── components/             # Shared, page-agnostic UI
│   ├── MainLayout.jsx/.module.css   # Sidebar + Topbar wrapper (for paged routes)
│   ├── Sidebar.jsx/.module.css      # Left navigation
│   └── Topbar.jsx/.module.css       # Top header with breadcrumb + user
│
└── pages/                  # One file per route
    ├── InterviewSetup.jsx/.module.css    ✅ Implemented (/mock-interviews)
    ├── InterviewSession.jsx/.module.css  ✅ Implemented (/interview/session)
    ├── Dashboard.jsx                     🚧 Stub (/dashboard)
    ├── Performance.jsx                   🚧 Stub (/performance)
    ├── Resumes.jsx                       🚧 Stub (/resumes)
    ├── Career.jsx                        🚧 Stub (/career)
    └── StubPage.jsx/.module.css         # Reusable placeholder (used by stubs)
```

---

## Design Token Reference

All tokens are defined in **`src/styles/variables.css`** and must be the only source of styling values. Never write raw hex, px, or `rgba()` calls inside component CSS — use tokens instead.

### Colors

```css
/* Primary brand — use for interactive elements */
--color-primary           /* #4F46E5 indigo */
--color-primary-hover     /* Hover / pressed */
--color-primary-subtle    /* Tinted backgrounds */
--color-primary-border    /* Borders on tinted backgrounds */

/* Text hierarchy */
--color-text-primary      /* Headings, bold labels */
--color-text-secondary    /* Body text */
--color-text-muted        /* Captions, placeholders */
--color-text-disabled     /* Inactive elements */
--color-text-inverse      /* White — text on dark backgrounds */

/* Surfaces */
--color-bg                /* Page background */
--color-surface           /* Card / panel */
--color-surface-2         /* Hover state background */
--color-border            /* Default border */
--color-border-strong     /* Focused / stronger border */

/* Semantic */
--color-success    --color-success-subtle    --color-success-border
--color-warning    --color-warning-subtle    --color-warning-border
--color-danger     --color-danger-subtle     --color-danger-border
```

### Spacing

Uses a **4px base grid**. Every `--sp-*` variable is a multiple of 4px:

```css
--sp-1  →  4px     --sp-4  →  16px    --sp-8  →  32px
--sp-2  →  8px     --sp-5  →  20px    --sp-10 →  40px
--sp-3  →  12px    --sp-6  →  24px    --sp-12 →  48px
```

### Typography

```css
-- font-sans        /* Inter — primary font */
-- font-mono        /* JetBrains Mono — code */

/* Sizes: --text-xs → --text-4xl  (12px → 36px) */
/* Weights: --font-medium (500), --font-semibold (600), --font-bold (700) */
/* Leading: --leading-tight, --leading-normal, --leading-relaxed */
/* Tracking: --tracking-tight, --tracking-wide, --tracking-widest */
```

### Border Radii

```css
--radius-xs  →  4px     --radius-lg  →  12px
--radius-sm  →  6px     --radius-xl  →  16px
--radius-md  →  8px     --radius-2xl →  24px
--radius-full → 9999px  (pill / circle)
```

### Shadows (Elevation)

```css
--shadow-xs  /* subtle depth for inline elements */
--shadow-sm  /* default card */
--shadow-md  /* raised card */
--shadow-lg  /* dropdown / popover */
--shadow-xl  /* modals */
--shadow-focus  /* primary focus ring — use on :focus */
```

### Motion

```css
--duration-fast   →  120ms
--duration-normal →  200ms
--duration-slow   →  350ms

--ease-default    /* cubic-bezier(0.4, 0, 0.2, 1) */
--ease-spring     /* bouncy spring — use sparingly */

/* Shorthand */
--transition-fast   /* 120ms ease-default */
--transition-normal /* 200ms ease-default */
```

### Layout

```css
--sidebar-width  →  248px
--topbar-height  →  64px
--content-max-w  →  900px  /* max-width for centred page content */
```

---

## Utility Classes

Import `global.css` is already done in `main.jsx`. These classes work anywhere:

```html
<!-- Typography -->
<h1 class="u-heading-1">...</h1>
<label class="u-label">SECTION LABEL</label>
<p class="u-muted">Secondary text</p>

<!-- Badges / Chips -->
<span class="u-chip u-chip--primary">Primary</span>
<span class="u-chip u-chip--success">Active</span>
<span class="u-chip u-chip--warning">Review</span>
<span class="u-chip u-chip--danger">Rejected</span>

<!-- Skeleton loading state -->
<div class="u-skeleton" style="height:16px; width:140px;"></div>

<!-- Standard card wrapper -->
<div class="u-card">...</div>

<!-- Horizontal divider -->
<hr class="u-divider" />

<!-- Page entry animation -->
<div class="u-page-enter">...</div>

<!-- Screen-reader only label -->
<span class="u-sr-only">Accessible label</span>
```

---

## Routing

All routes are defined in **`src/App.jsx`**.

### Adding a new page (3 steps)

**Step 1** — Create the page file `src/pages/MyPage.jsx`:
```jsx
import styles from './MyPage.module.css';

export default function MyPage() {
  return (
    <div className={styles.page}>
      {/* your content */}
    </div>
  );
}
```

**Step 2** — Create the CSS module `src/pages/MyPage.module.css`:
```css
/* Use only CSS variable tokens from variables.css */
.page {
  animation: fadeInUp var(--duration-slow) var(--ease-out) both;
}
```

**Step 3** — Register in `src/App.jsx`:
```jsx
// 1. Import at top
import MyPage from './pages/MyPage';

// 2. Add to BREADCRUMBS map
const BREADCRUMBS = {
  ...
  '/my-page': ['My Page'],
};

// 3. Add Route inside the MainLayout Route (for pages with sidebar)
<Route path="/my-page" element={<MyPage />} />

// OR — for a full-screen page (no sidebar, like InterviewSession):
<Route path="/my-page" element={<MyPage />} />  // outside MainLayout Route
```

### Full-screen vs sidebar pages

| Layout | When to use | Example |
|---|---|---|
| **MainLayout** (sidebar + topbar) | All dashboard-style pages | Dashboard, Setup, Performance |
| **Full-screen** (no layout wrapper) | Immersive/focus flows | InterviewSession |

---

## Layout System

```
┌─────────────────────────────────────────────┐
│  Sidebar (248px fixed)  │  Topbar (64px)    │
│  ─────────────────────  │  ─────────────────│
│  Logo                   │  Breadcrumb       │
│  [nav links]            │         [User]    │
│                         │                   │
│                         │  <main>           │
│                         │    <Outlet />     │
│                         │    (page content) │
│  [Pro banner]           │                   │
│  [Footer links]         │                   │
└─────────────────────────────────────────────┘
```

- `MainLayout` wraps all sidebar pages — add page content inside `<main>`, use `max-width: var(--content-max-w)` for centered single-column pages.
- `InterviewSession` is fully custom — its own topbar, no sidebar.

---

## Component API

### `<MainLayout breadcrumbs={[]} user={{}} />`

| Prop | Type | Description |
|---|---|---|
| `breadcrumbs` | `string[]` | Breadcrumb labels. Auto-resolved from `BREADCRUMBS` map in `App.jsx` |
| `user` | `{ name, role }` | Displayed in Topbar avatar |

### `<StubPage title description scope icon />`

| Prop | Type | Description |
|---|---|---|
| `title` | `string` | Page heading |
| `description` | `string` | One-line purpose |
| `scope` | `string[]` | Features to implement (shown as checklist) |
| `icon` | `ReactNode` | Large SVG icon, optional |

> **Replace** `StubPage` with your real component when implementing a page.

---

## Pages Implementation Status

| Route | Component | Status |
|---|---|---|
| `/dashboard` | `Dashboard.jsx` | 🚧 Stub — see scope in UI |
| `/mock-interviews` | `InterviewSetup.jsx` | ✅ Done |
| `/interview/session` | `InterviewSession.jsx` | ✅ Done |
| `/performance` | `Performance.jsx` | 🚧 Stub |
| `/resumes` | `Resumes.jsx` | 🚧 Stub |
| `/career` | `Career.jsx` | 🚧 Stub |
| `/profile` | *(not created yet)* | ❌ Pending |
| `/settings` | *(not created yet)* | ❌ Pending |

---

## Conventions & Rules

1. **CSS Modules only** — no inline styles except for dynamic values (e.g., `style={{ width: \`${pct}%\` }}`).
2. **Tokens only** — every CSS value must reference a `var(--*)` token. No raw colors or magic numbers.
3. **One component per file** — including its matching `.module.css`.
4. **Functional components + hooks** — no class components.
5. **SVG icons inline** — no external icon library to keep the bundle lean.
6. **Accessible markup** — use semantic HTML (`<nav>`, `<main>`, `<header>`, `<button>`, `<label>`). Add `aria-*` and `role` where needed.
7. **Animations from `global.css`** — use the shared `@keyframes` (`fadeInUp`, `fadeIn`, `shimmer`, etc.) rather than declaring new ones per module.

---

## Future: Chatbot Widget

A floating chatbot will be added as `src/components/ChatbotWidget.jsx`.

- Renders inside `MainLayout` only (not during `InterviewSession`).
- Position: `fixed`, bottom-right corner, `z-index: var(--z-modal)`.  
- Uses the same design tokens — no extra colour or font setup needed.
- Toggle state lives in `MainLayout` or a lightweight `ChatContext`.

---

## Environment Variables

Create a `.env` file at the project root for API configuration:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_ENV=development
```

Access in code:
```js
const apiBase = import.meta.env.VITE_API_BASE_URL;
```

> All Vite env vars must be prefixed with `VITE_`.
