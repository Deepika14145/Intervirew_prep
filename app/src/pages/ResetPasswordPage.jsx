import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import styles from './Auth.module.css';

function getStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['#e2e8f0', '#ef4444', '#f59e0b', '#3b82f6', '#16a34a'];

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [oobCode, setOobCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'done'

  const strength = getStrength(newPassword);
  const match = newPassword && confirmPassword && newPassword === confirmPassword;
  const mismatch = confirmPassword && newPassword !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return setError('Passwords do not match.');
    if (newPassword.length < 6) return setError('Password must be at least 6 characters.');
    if (!oobCode) return setError('Please enter the reset code from your email.');

    try {
      setError(''); setLoading(true);
      await verifyPasswordResetCode(auth, oobCode);
      await confirmPasswordReset(auth, oobCode, newPassword);
      setStep('done');
    } catch (err) {
      if (err.code === 'auth/invalid-action-code') setError('Reset code is invalid or expired. Please request a new one.');
      else if (err.code === 'auth/weak-password') setError('Password is too weak. Use at least 6 characters.');
      else setError('Failed to reset password. ' + err.message);
    } finally { setLoading(false); }
  };

  if (step === 'done') {
    return (
      <div className={styles.authWrap}>
        <div className={styles.authCard}>
          <div className={styles.leftPanel}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
              <div className={styles.fpIllustration}>🎉</div>
              <h2 className={styles.fpHeading}>Password <span>reset!</span></h2>
              <p className={styles.fpSub}>Your password has been updated successfully. You can now sign in with your new password.</p>
            </div>
          </div>
          <div className={styles.rightPanel} style={{ justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
            <h1 className={styles.formTitle}>All done!</h1>
            <p className={styles.formSub} style={{ marginBottom: '28px' }}>Your password has been reset successfully.</p>
            <button className={styles.submitBtn} onClick={() => navigate('/login')}>Back to Login →</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authWrap}>
      <div className={styles.authCard}>
        {/* Left panel */}
        <div className={styles.leftPanel}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
            <div className={styles.fpIllustration}>🔐</div>
            <h2 className={styles.fpHeading}>Set a new <span>password.</span></h2>
            <p className={styles.fpSub}>Choose a strong password to keep your account secure.</p>
          </div>
        </div>

        {/* Right panel */}
        <div className={styles.rightPanel}>
          <div className={styles.logoRow}>
            <div className={styles.logoIcon}>⚡</div>
            <span className={styles.logoName}>IntervAI</span>
          </div>

          <h1 className={styles.formTitle}>Reset Password</h1>
          <p className={styles.formSub}>Enter the reset code from your email and choose a new password.</p>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <div className={styles.field}>
                <label className={styles.label}>Reset Code (from email)</label>
                <input className={styles.input} type="text" placeholder="Paste the code from your email" value={oobCode} onChange={e => setOobCode(e.target.value.trim())} required />
              </div>

              <div className={styles.field}>
                <div className={styles.fieldRow}>
                  <label className={styles.label}>New Password</label>
                  {newPassword && <span className={styles.strengthLabel} style={{ color: STRENGTH_COLORS[strength] }}>{STRENGTH_LABELS[strength]}</span>}
                </div>
                <div className={styles.inputWrap}>
                  <input className={styles.input} type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(p => !p)}>{showPw ? '🙈' : '👁️'}</button>
                </div>
                {newPassword && (
                  <div className={styles.strengthBar}>
                    {[1,2,3,4].map(i => <div key={i} className={styles.strengthSeg} style={{ background: i <= strength ? STRENGTH_COLORS[strength] : '#e2e8f0' }} />)}
                  </div>
                )}
              </div>

              <div className={styles.field}>
                <div className={styles.fieldRow}>
                  <label className={styles.label}>Confirm New Password</label>
                  {confirmPassword && <span className={styles.strengthLabel} style={{ color: match ? '#16a34a' : '#ef4444' }}>{match ? '✓ Match' : '✗ Mismatch'}</span>}
                </div>
                <div className={styles.inputWrap}>
                  <input
                    className={styles.input}
                    style={{ borderColor: mismatch ? '#ef4444' : match ? '#16a34a' : undefined }}
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowConfirm(p => !p)}>{showConfirm ? '🙈' : '👁️'}</button>
                </div>
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading || mismatch}>
              {loading ? 'Resetting…' : 'Reset Password →'}
            </button>
          </form>

          <Link to="/login" className={styles.backLink}>← Back to Login</Link>
          <p className={styles.helpText}>Don't have a code? <Link to="/forgot-password" style={{ color: '#2f5cff', fontWeight: 600 }}>Request one here</Link></p>
        </div>
      </div>
    </div>
  );
}
