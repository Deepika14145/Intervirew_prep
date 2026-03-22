import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Auth.module.css';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { signup } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        
        if (password !== passwordConfirm) {
            return setError('Passwords do not match');
        }

        try {
            setError('');
            setLoading(true);
            await signup(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError('Failed to create an account. ' + err.message);
            console.error(err);
        }
        setLoading(false);
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.logoArea}>
                    <span className={styles.logoIcon}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                    </span>
                    <span className={styles.logoText}>IntervAI</span>
                </div>
                
                <h2 className={styles.title}>Create an account</h2>
                <p className={styles.subtitle}>Start mastering your tech interviews</p>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Email Address</label>
                        <input 
                            type="email" 
                            className={styles.input} 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                            placeholder="you@example.com"
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Password</label>
                        <input 
                            type="password" 
                            className={styles.input} 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            placeholder="Minimum 6 characters"
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Confirm Password</label>
                        <input 
                            type="password" 
                            className={styles.input} 
                            value={passwordConfirm} 
                            onChange={(e) => setPasswordConfirm(e.target.value)} 
                            required 
                            placeholder="Confirm your password"
                        />
                    </div>
                    
                    <button disabled={loading} type="submit" className={styles.submitBtn}>
                        {loading ? 'Signing up...' : 'Sign Up'}
                    </button>
                </form>

                <div className={styles.switchText}>
                    Already have an account? <Link to="/login" className={styles.link}>Log in</Link>
                </div>
            </div>
        </div>
    );
}
