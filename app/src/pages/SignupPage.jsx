import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import styles from './Auth.module.css';

const SKILLS_LIST = [
  'JavaScript','TypeScript','React','Vue','Angular','Node.js','Python','Java','Go','Rust',
  'SQL','MongoDB','PostgreSQL','Redis','Docker','Kubernetes','AWS','GCP','Azure',
  'GraphQL','REST APIs','System Design','Machine Learning','Data Science','DevOps','CI/CD',
  'Swift','Kotlin','Flutter','React Native',
];

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

export default function SignupPage() {
  const { signup, loginWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Step 2
  const [gender, setGender] = useState('');
  const [userType, setUserType] = useState('');
  const [experience, setExperience] = useState('');

  // Step 3
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [customSkills, setCustomSkills] = useState([]);
  const [agreed, setAgreed] = useState(false);

  if (currentUser) return <Navigate to="/dashboard" replace />;

  const strength = getStrength(password);

  const handleGoogle = async () => {
    try { setError(''); setLoading(true); await loginWithGoogle(); navigate('/dashboard'); }
    catch (err) { setError('Google sign-in failed. ' + err.message); }
    finally { setLoading(false); }
  };

  const nextStep1 = (e) => {
    e.preventDefault();
    if (!name || !email || !password) return setError('Please fill all required fields.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    setError(''); setStep(2);
  };

  const nextStep2 = (e) => {
    e.preventDefault();
    if (!gender || !userType) return setError('Please fill all required fields.');
    setError(''); setStep(3);
  };

  const toggleSkill = (skill) => {
    setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const addCustomSkill = () => {
    const s = skillInput.trim();
    if (s && !customSkills.includes(s) && !SKILLS_LIST.includes(s)) {
      setCustomSkills(prev => [...prev, s]);
      setSelectedSkills(prev => [...prev, s]);
    }
    setSkillInput('');
  };

  const handleFinish = async (e) => {
    e.preventDefault();
    if (!agreed) return setError('Please agree to the Terms of Service.');
    try {
      setError(''); setLoading(true);
      await signup(email, password, name);
      // Save extra profile data
      const token = localStorage.getItem('authToken');
      const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      await fetch(`${BACKEND}/api/auth/me`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: name.split(' ')[0], lastName: name.split(' ').slice(1).join(' '), phone, gender, userType, experience, skills: [...selectedSkills] }),
      }).catch(() => {});
      navigate('/dashboard');
    } catch (err) { setError('Failed to create account. ' + err.message); }
    finally { setLoading(false); }
  };

  const leftContent = [
    { badge: 'Step 1 of 3', heading: <>Start your journey to <span>Career Mastery</span></>, sub: 'Create your account and get AI-powered interview coaching tailored to you.' },
    { badge: 'Step 2 of 3', heading: <>Tell us about <span>yourself</span></>, sub: 'We use this to personalise your interview prep experience.' },
    { badge: 'Step 3 of 3', heading: <>Your <span>skills</span> matter</>, sub: 'Select your tech stack so we can tailor questions to your expertise.' },
  ][step - 1];

  return (
    <div className={styles.authWrap}>
      <div className={styles.authCard}>
        {/* Left panel */}
        <div className={styles.leftPanel}>
          <div>
            <div className={styles.leftBadge}>{leftContent.badge}</div>
            <h2 className={styles.leftHeading}>{leftContent.heading}</h2>
            <p className={styles.leftSub}>{leftContent.sub}</p>
          </div>
          <div className={styles.leftIllustration}>
            <div style={{ fontSize: '4rem', textAlign: 'center', padding: '20px 0' }}>
              {step === 1 ? '🚀' : step === 2 ? '👤' : '🛠️'}
            </div>
            <div className={styles.stepDots}>
              {[1,2,3].map(i => <div key={i} className={`${styles.stepDot} ${i === step ? styles.stepDotActive : i < step ? styles.stepDotDone : ''}`} />)}
            </div>
          </div>
          <div className={styles.leftFooter}>
            <div className={styles.avatarStack}>
              {[['#6366f1','A'],['#2f5cff','B'],['#0ea5e9','5k+']].map(([bg,l]) => (
                <div key={l} className={styles.avatar} style={{ background: bg, fontSize: l.length > 1 ? '0.55rem' : '0.7rem' }}>{l}</div>
              ))}
            </div>
            <span className={styles.leftFooterText}>Join 5,000+ candidates landing top tech roles.</span>
          </div>
        </div>

        {/* Right panel */}
        <div className={styles.rightPanel}>
          <div className={styles.logoRow}>
            <div className={styles.logoIcon}>⚡</div>
            <span className={styles.logoName}>IntervAI</span>
          </div>

          {step === 1 && (
            <>
              <h1 className={styles.formTitle}>Join the Community</h1>
              <p className={styles.formSub}>Start your journey to your dream job.</p>
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.oauthRow}>
                <button className={styles.oauthBtn} onClick={handleGoogle} disabled={loading} type="button">
                  <GoogleIcon /> Google
                </button>
                <button className={styles.oauthBtn} disabled style={{ opacity: 0.4 }} type="button">
                  <LinkedInIcon /> LinkedIn
                </button>
              </div>
              <div className={styles.divider}>or with email</div>
              <form onSubmit={nextStep1}>
                <div className={styles.fieldGroup}>
                  <div className={styles.field}>
                    <label className={styles.label}>Full Name *</label>
                    <input className={styles.input} type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Email Address *</label>
                    <input className={styles.input} type="email" placeholder="john@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Phone Number</label>
                    <input className={styles.input} type="tel" placeholder="+1 234 567 8900" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <div className={styles.fieldRow}>
                      <label className={styles.label}>Password *</label>
                      {password && <span className={styles.strengthLabel} style={{ color: STRENGTH_COLORS[strength] }}>{STRENGTH_LABELS[strength]}</span>}
                    </div>
                    <div className={styles.inputWrap}>
                      <input className={styles.input} type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                      <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(p => !p)}>{showPw ? '🙈' : '👁️'}</button>
                    </div>
                    {password && (
                      <div className={styles.strengthBar}>
                        {[1,2,3,4].map(i => <div key={i} className={styles.strengthSeg} style={{ background: i <= strength ? STRENGTH_COLORS[strength] : '#e2e8f0' }} />)}
                      </div>
                    )}
                  </div>
                </div>
                <button type="submit" className={styles.submitBtn}>Next →</button>
              </form>
              <p className={styles.switchText}>Already have an account? <Link to="/login">Log in</Link></p>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className={styles.formTitle}>About You</h1>
              <p className={styles.formSub}>Help us personalise your experience.</p>
              {error && <div className={styles.error}>{error}</div>}
              <form onSubmit={nextStep2}>
                <div className={styles.fieldGroup}>
                  <div className={styles.field}>
                    <label className={styles.label}>Gender *</label>
                    <select className={styles.input} value={gender} onChange={e => setGender(e.target.value)} required>
                      <option value="">— Select —</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Non-binary</option>
                      <option>Prefer not to say</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>I am a *</label>
                    <div className={styles.toggleGroup}>
                      {['Student / Fresher', 'Working Professional'].map(t => (
                        <button key={t} type="button" className={`${styles.toggleBtn} ${userType === t ? styles.toggleBtnActive : ''}`} onClick={() => setUserType(t)}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Years of Experience</label>
                    <select className={styles.input} value={experience} onChange={e => setExperience(e.target.value)}>
                      <option value="">— Select —</option>
                      <option>0 (Fresher)</option>
                      <option>Less than 1 year</option>
                      <option>1–2 years</option>
                      <option>3–5 years</option>
                      <option>6–10 years</option>
                      <option>10+ years</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" className={styles.backBtn} onClick={() => setStep(1)}>← Back</button>
                  <button type="submit" className={styles.submitBtn} style={{ flex: 1 }}>Next →</button>
                </div>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className={styles.formTitle}>Your Skills</h1>
              <p className={styles.formSub}>Select all that apply. You can add custom skills too.</p>
              {error && <div className={styles.error}>{error}</div>}
              <form onSubmit={handleFinish}>
                <div className={styles.skillsGrid}>
                  {[...SKILLS_LIST, ...customSkills].map(skill => (
                    <button key={skill} type="button"
                      className={`${styles.skillChip} ${selectedSkills.includes(skill) ? styles.skillChipActive : ''}`}
                      onClick={() => toggleSkill(skill)}>
                      {selectedSkills.includes(skill) ? '✓ ' : ''}{skill}
                    </button>
                  ))}
                </div>
                <div className={styles.customSkillRow}>
                  <input className={styles.input} type="text" placeholder="Add a custom skill…" value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomSkill(); } }} />
                  <button type="button" className={styles.addSkillBtn} onClick={addCustomSkill}>Add</button>
                </div>
                <div className={styles.checkRow} style={{ marginTop: '14px' }}>
                  <input type="checkbox" id="agree" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                  <label htmlFor="agree">I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></label>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" className={styles.backBtn} onClick={() => setStep(2)}>← Back</button>
                  <button type="submit" className={styles.submitBtn} style={{ flex: 1 }} disabled={loading}>
                    {loading ? 'Creating account…' : 'Create Account 🎉'}
                  </button>
                </div>
              </form>
            </>
          )}

          <div className={styles.authFooter} style={{ marginTop: '16px' }}>
            <a href="#">Help Center</a>
            <a href="#">Privacy</a>
            <span>© 2026 IntervAI</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#0077B5">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}
