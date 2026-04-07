import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import styles from './Auth.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();

  if (currentUser) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { setError(''); setLoading(true); await login(email, password); navigate('/dashboard'); }
    catch { setError('Invalid email or password. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    try { setError(''); setLoading(true); await loginWithGoogle(); navigate('/dashboard'); }
    catch (err) { setError('Google sign-in failed. ' + err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className={styles.authWrap}>
      <div className={styles.authCard}>
        {/* Left panel */}
        <div className={styles.leftPanel}>
          <div>
            <div className={styles.leftBadge}>AI-Powered Prep</div>
            <h2 className={styles.leftHeading}>Master your next interview<br />with <span>AI.</span></h2>
            <p className={styles.leftSub}>Join 10,000+ candidates practicing with our intelligent interview coach and land your dream job.</p>
          </div>
          <div className={styles.leftIllustration}>
            <div style={{ fontSize: '4rem', textAlign: 'center', padding: '16px 0' }}>🤖</div>
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', marginTop: '8px' }}>
              "The AI feedback felt incredibly human and helped me land an offer at Google!"
            </p>
          </div>
          <div className={styles.leftFooter}>
            <div className={styles.avatarStack}>
              {[['#6366f1','A'],['#2f5cff','B'],['#0ea5e9','C']].map(([bg,l]) => (
                <div key={l} className={styles.avatar} style={{ background: bg }}>{l}</div>
              ))}
            </div>
            <span className={styles.leftFooterText}>Join 10,000+ candidates landing top tech roles.</span>
          </div>
        </div>

        {/* Right panel */}
        <div className={styles.rightPanel}>
          <div className={styles.logoRow}>
            <div className={styles.logoIcon}>⚡</div>
            <span className={styles.logoName}>IntervAI</span>
          </div>
          <h1 className={styles.formTitle}>Welcome back</h1>
          <p className={styles.formSub}>Please enter your details to sign in.</p>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.oauthRow}>
            <button className={styles.oauthBtn} onClick={handleGoogle} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Google
            </button>
            <button className={styles.oauthBtn} disabled style={{ opacity: 0.4, cursor: 'not-allowed' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#0077B5"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              LinkedIn
            </button>
          </div>

          <div className={styles.divider}>or login with email</div>

          <form onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <div className={styles.field}>
                <label className={styles.label}>Work Email</label>
                <input className={styles.input} type="email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className={styles.field}>
                <div className={styles.fieldRow}>
                  <label className={styles.label}>Password</label>
                  <Link to="/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
                </div>
                <div className={styles.inputWrap}>
                  <input className={styles.input} type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(p => !p)}>{showPw ? '🙈' : '👁️'}</button>
                </div>
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Signing in…' : 'Start Practicing →'}
            </button>
          </form>

          <p className={styles.switchText}>Don't have an account? <Link to="/signup">Sign up for free</Link></p>

          <div className={styles.authFooter}>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Help Center</a>
          </div>
        </div>
      </div>
    </div>
  );
}
