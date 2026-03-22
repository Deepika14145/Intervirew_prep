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

// Auth imports
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

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
  const { currentUser } = useAuth();
  const breadcrumbs = BREADCRUMBS[pathname] ?? ['Dashboard'];

  // Parse a friendly name from the active Firebase session
  const displayName = currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'User');

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Pages WITH sidebar + topbar (PROTECTED) */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout
              breadcrumbs={breadcrumbs}
              user={{ name: displayName, role: 'Candidate' }} // Dynamically updated!
            />
          </ProtectedRoute>
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

      {/* Full-screen session — no sidebar (PROTECTED) */}
      <Route 
        path="/interview/session" 
        element={
          <ProtectedRoute>
            <InterviewSession />
          </ProtectedRoute>
        } 
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <ChatbotWidget />
      </BrowserRouter>
    </AuthProvider>
  );
}
