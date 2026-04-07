import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Auth.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(''); setSuccess(''); setLoading(true);
      await resetPassword(email);
      setSuccess('Reset link sent! Check your inbox and use the code at /reset-password.');
    } catch {
      setError('Failed to send reset email. Check the address and try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className={styles.authWrap}>
      <div className={styles.authCard}>
        {/* Left panel */}
        <div className={styles.leftPanel}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
            <div className={styles.fpIllustration}>🔑</div>
            <h2 className={styles.fpHeading}>Get back to mastering your <span>interviews.</span></h2>
            <p className={styles.fpSub}>Your path to your dream career is just a reset away. We've got the key to get you back on track.</p>
          </div>
        </div>

        {/* Right panel */}
        <div className={styles.rightPanel}>
          <div className={styles.logoRow}>
            <div className={styles.logoIcon}>⚡</div>
            <span className={styles.logoName}>IntervAI</span>
          </div>

          <h1 className={styles.formTitle}>Forgot Password?</h1>
          <p className={styles.formSub}>Don't worry! Enter the email address associated with your account, and we'll send you a link to reset your password.</p>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <div className={styles.field}>
                <label className={styles.label}>Email Address</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}>✉️</span>
                  <input className={`${styles.input} ${styles.inputWithIcon}`} type="email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Sending…' : 'Send Reset Link →'}
            </button>
          </form>

          <Link to="/login" className={styles.backLink}>← Back to Login</Link>
          {success && <p className={styles.helpText} style={{ marginTop: '8px' }}>Got the code? <Link to="/reset-password" style={{ color: '#2f5cff', fontWeight: 600 }}>Reset your password →</Link></p>}
          <p className={styles.helpText}>Need help? <a href="#">Contact our support team</a></p>
        </div>
      </div>
    </div>
  );
}
