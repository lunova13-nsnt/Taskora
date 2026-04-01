import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Register.css';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/register', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setSuccess('Account created! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-logo">
          <h1>⚡Taskora⚡</h1>
          <p>Create your free account</p>
        </div>
        <h2 className="register-title">Get started!</h2>
        <p className="register-subtitle">Sign up in seconds</p>
        {error && <div className="error-msg">⚠️ {error}</div>}
        {success && <div className="success-msg">✅ {success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              name="name"
              placeholder="John Doe"
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              name="password"
              type="password"
              placeholder="Minimum 6 characters"
              onChange={handleChange}
              required
            />
          </div>
          <button className="register-btn" type="submit">
            Create Account →
          </button>
        </form>
        <p className="login-link">
          Already have an account? <Link to="/login">Sign in here</Link>
        </p>
      </div>
    </div>
  );
}