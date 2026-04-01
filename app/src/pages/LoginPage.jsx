import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Auth.module.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError('Failed to sign in. Please check your credentials.');
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
                
                <h2 className={styles.title}>Welcome back</h2>
                <p className={styles.subtitle}>Log in to continue your interview prep</p>

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
                            placeholder="••••••••"
                        />
                    </div>
                    
                    <button disabled={loading} type="submit" className={styles.submitBtn}>
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>
                </form>

                <div className={styles.switchText}>
                    Don't have an account? <Link to="/signup" className={styles.link}>Sign up</Link>
                </div>
            </div>
        </div>
    );
}
