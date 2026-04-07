import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import InterviewSetup from './pages/InterviewSetup';
import InterviewSession from './pages/InterviewSession';
import ChatbotWidget from './components/ChatbotWidget';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Performance from './pages/Performance';
import { Career } from './pages/stubs';
import ResumeUpload from './pages/ResumeUpload';
import ResumePreview from './pages/ResumePreview';
import AnalysisPage from './pages/AnalysisPage';
import Notifications from './pages/Notifications';
import HRInterview from './pages/HRInterview';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
const BREADCRUMBS = {
  '/dashboard': ['Dashboard'],
  '/notifications': ['Notifications'],
  '/mock-interviews': ['Mock Interviews', 'Setup'],
  '/interview/session': ['Mock Interviews', 'Session'],
  '/performance': ['Performance'],
  '/resumes': ['Resume Analyzer'],
  '/resume-preview': ['Resume Analyzer', 'Preview'],
  '/career': ['Career Advice'],
  '/profile': ['Profile'],
  '/settings': ['Settings'],
  '/analysis': ['Performance', 'Interview Analysis'],
  '/hr-interview': ['HR Interview'],
};

function AppRoutes() {
  const { pathname } = useLocation();
  const { currentUser } = useAuth();
  const breadcrumbs = BREADCRUMBS[pathname] ?? ['Dashboard'];

  const displayName = currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'User');
  const userObj = currentUser
    ? { name: displayName, role: 'Candidate' }
    : { name: 'Guest', role: 'Visitor' };

  return (
    <>
      {/* Chatbot only visible when authenticated, not during interview session */}
      {currentUser && pathname !== '/interview/session' && <ChatbotWidget />}
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected — with sidebar + topbar */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout breadcrumbs={breadcrumbs} user={userObj} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mock-interviews" element={<InterviewSetup />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/resumes" element={<ResumeUpload />} />
          <Route path="/resume-preview" element={<ResumePreview />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/career" element={<Career />} />
          <Route path="/hr-interview" element={<HRInterview />} />
          <Route path="/interview-analysis" element={<Navigate to="/analysis" replace />} />
        </Route>

        {/* Full-screen session — no sidebar */}
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
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
