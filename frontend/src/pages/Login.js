import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Login.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: '', password: '', general: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '', general: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({ email: '', password: '', general: '' });
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.field === 'email') {
        setErrors({ ...errors, email: data.message });
      } else if (data?.field === 'password') {
        setErrors({ ...errors, password: data.message });
      } else {
        setErrors({ ...errors, general: data?.message || 'Login failed.' });
      }
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <h1>⚡ Taskora</h1>
          <p>Task Management System</p>
        </div>
        <h2 className="login-title">Welcome back!</h2>
        <p className="login-subtitle">Sign in to your account</p>

        {errors.general && <div className="error-msg">⚠️ {errors.general}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              style={{borderColor: errors.email ? '#ff6b6b' : ''}}
              required
            />
            {errors.email && (
              <div style={{marginTop:'6px'}}>
                <p style={{color:'#ff6b6b',fontSize:'12px',margin:'0 0 4px'}}>⚠️ {errors.email}</p>
                <p style={{color:'#64748b',fontSize:'12px',margin:0}}>
                  Don't have an account?{' '}
                  <Link to="/register" style={{color:'#00ffc8',fontWeight:'600'}}>Register here</Link>
                </p>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Password</label>
            <div style={{position:'relative'}}>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                style={{borderColor: errors.password ? '#ff6b6b' : '', paddingRight:'48px'}}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{position:'absolute',right:'14px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',fontSize:'16px',color:'#64748b'}}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && (
              <div style={{marginTop:'6px'}}>
                <p style={{color:'#ff6b6b',fontSize:'12px',margin:'0 0 4px'}}>⚠️ {errors.password}</p>
                <p style={{color:'#64748b',fontSize:'12px',margin:0}}>
                  <Link to="/forgot-password" style={{color:'#ffa500',fontWeight:'600'}}>Forgot password?</Link>
                </p>
              </div>
            )}
          </div>

          <div style={{textAlign:'right',marginTop:'-4px',marginBottom:'16px'}}>
            <Link to="/forgot-password" style={{fontSize:'13px',color:'#64748b'}}>
              Forgot password?
            </Link>
          </div>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? '⏳ Signing in...' : 'Sign In →'}
          </button>
        </form>

        <div className="divider">or</div>
        <p className="register-link">
          Don't have an account? <Link to="/register">Create one free</Link>
        </p>
      </div>
    </div>
  );
}