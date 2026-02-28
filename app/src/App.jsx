import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import InterviewSetup from './pages/InterviewSetup';
import InterviewSession from './pages/InterviewSession';
import ChatbotWidget from './components/ChatbotWidget';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Performance from './pages/Performance';
import { Career } from './pages/stubs';
import ResumeUpload from './pages/ResumeUpload';
import ResumePreview from './pages/ResumePreview';
import AnalysisPage from "./pages/AnalysisPage";
import Notifications from './pages/Notifications';

/* Breadcrumb labels per route — add an entry when adding a new route */
const BREADCRUMBS = {
  '/dashboard': ['Dashboard'],
  '/notifications': ['Notifications'],
  '/mock-interviews': ['Mock Interviews', 'Interview Setup'],
  '/performance': ['Performance'],
  '/resumes': ['Resume Analyzer'],
  '/career': ['Career Advice'],
  '/profile': ['Profile'],
  '/settings': ['Settings'],
  '/interview-analysis': ['Interview Analysis'],
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
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Profile />} />
        <Route path="/performance" element={<Performance />} />
        <Route path="/resumes" element={<ResumeUpload />} />
        <Route path="/resume-preview" element={<ResumePreview />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/career" element={<Career />} />
        {/* <Route path="/interview-analysis" element={<InterviewAnalysis />} /> */}
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
      <ChatbotWidget />
    </BrowserRouter>
  );
}
