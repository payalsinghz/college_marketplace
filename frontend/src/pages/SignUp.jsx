import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useContext(AuthContext);

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const result = await signup(formData);
    if (!result.success) {
      setError(result.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="auth-wrapper">
      <div className="card auth-card animate-fade-in" style={{animationDelay: '0.1s'}}>
        <div className="auth-header">
          <h1 className="heading-1">Join Marketplace</h1>
          <p>Create an account to buy & sell items</p>
        </div>
        
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <input type="text" className="input-field" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input type="email" className="input-field" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label className="input-label">Phone Number</label>
            <input type="tel" className="input-field" name="phone" value={formData.phone} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input type="password" className="input-field" name="password" value={formData.password} onChange={handleChange} minLength="6" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '1rem'}} disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p style={{textAlign: 'center', marginTop: '2rem', color: 'var(--text-secondary)'}}>
          Already have an account? <Link to="/login" style={{color: 'var(--accent-primary)', fontWeight: '600'}}>Log In</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
