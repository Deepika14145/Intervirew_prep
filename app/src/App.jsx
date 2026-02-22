import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import InterviewSetup from './pages/InterviewSetup';
import InterviewSession from './pages/InterviewSession';
import { Dashboard, Performance, Resumes, Career } from './pages/stubs';

/* Breadcrumb labels per route — add an entry when adding a new route */
const BREADCRUMBS = {
  '/dashboard': ['Dashboard'],
  '/mock-interviews': ['Mock Interviews', 'Interview Setup'],
  '/performance': ['Performance'],
  '/resumes': ['Resume Analyzer'],
  '/career': ['Career Advice'],
  '/profile': ['Profile'],
  '/settings': ['Settings'],
};

function AppRoutes() {
  const { pathname } = useLocation();
  const breadcrumbs = BREADCRUMBS[pathname] ?? ['Dashboard'];

  return (
    <Routes>
      {/* Pages WITH sidebar + topbar */}
      <Route
        element={
          <MainLayout
            breadcrumbs={breadcrumbs}
            user={{ name: 'Alex Rivera', role: 'Frontend Dev' }}
          />
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* ✅ Implemented */}
        <Route path="/mock-interviews" element={<InterviewSetup />} />

        {/* 🚧 Stubs — replace export in stubs.jsx when building */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/performance" element={<Performance />} />
        <Route path="/resumes" element={<Resumes />} />
        <Route path="/career" element={<Career />} />
        <Route path="/profile" element={<Dashboard />} />
        <Route path="/settings" element={<Dashboard />} />
      </Route>

      {/* Full-screen session — no sidebar */}
      <Route path="/interview/session" element={<InterviewSession />} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
