import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const result = await login(email, password);
    if (!result.success) {
      setError(result.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="auth-wrapper">
      <div className="card auth-card animate-fade-in">
        <div className="auth-header">
          <h1 className="heading-1">Welcome Back</h1>
          <p>Login to access AI College Marketplace</p>
        </div>
        
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Email</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="student@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '1rem'}} disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Admin Login Quick-Access */}
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(139, 92, 246, 0.06)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '10px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Platform Administration</p>
          <button
            type="button"
            onClick={() => { setEmail('admin@college.edu'); setPassword('Admin@2025!'); }}
            style={{ width: '100%', padding: '0.7rem', background: 'rgba(139, 92, 246, 0.12)', color: 'var(--accent-primary)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem', transition: 'all 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.22)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.12)'}
          >
            🛡️ Login as Admin
          </button>
        </div>

        <p style={{textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)'}}>
          Don't have an account? <Link to="/signup" style={{color: 'var(--accent-primary)', fontWeight: '600'}}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
