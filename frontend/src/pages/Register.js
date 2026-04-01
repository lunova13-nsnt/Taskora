import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Register.css';

export default function Register() {

  const [otpExpiry, setOtpExpiry] = useState(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrors({});

    if (form.password.length < 6) {
      setErrors({ password: 'Password must be at least 6 characters.' });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match.' });
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/send-register-otp', { email: form.email });
      setOtpExpiry(res.data.otpExpiry);
      setSuccess('OTP sent to your email! Please verify.');
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP.';
      if (msg.includes('already')) {
        setErrors({ email: 'This email is already registered.' });
      } else {
        setErrors({ general: msg });
      }
    }

    setLoading(false);
  };

  const handleOtpChange = (val, idx) => {
    const updated = [...otp];
    updated[idx] = val.slice(-1);
    setOtp(updated);

    if (val && idx < 5) {
      document.getElementById(`rotp-${idx + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      document.getElementById(`rotp-${idx - 1}`)?.focus();
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const otpStr = otp.join('');
    if (otpStr.length < 6) {
      setErrors({ otp: 'Please enter all 6 digits.' });
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        otp: otpStr,
        otpExpiry,
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      setSuccess('Account created! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1000);

    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Registration failed.' });
    }

    setLoading(false);
  };

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return null;

    if (p.length < 6) return { label: 'Too short', color: '#ff6b6b', width: '25%' };
    if (p.length < 8) return { label: 'Weak', color: '#ff6b6b', width: '40%' };
    if (p.length < 10) return { label: 'Good', color: '#ffa500', width: '70%' };
    return { label: 'Strong 💪', color: '#00ffc8', width: '100%' };
  };

  const strength = passwordStrength();

  return (
    <div className="register-container">
      <div className="register-card">

        <div className="register-logo">
          <h1>⚡ Taskora</h1>
          <p>Create your free account</p>
        </div>

        {errors.general && <div className="error-msg">⚠️ {errors.general}</div>}
        {success && <div className="success-msg">✅ {success}</div>}

        {step === 1 && (
          <form onSubmit={handleSendOtp}>

            <div className="form-group">
              <label>Full Name</label>
              <input name="name" value={form.name} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required />
              {errors.email && <p style={{ color: '#ff6b6b' }}>{errors.email}</p>}
            </div>

            <div className="form-group">
              <label>Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required />
              {errors.confirmPassword && <p style={{ color: '#ff6b6b' }}>{errors.confirmPassword}</p>}
            </div>

            <button type="submit">
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>

          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleRegister}>

            <div>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`rotp-${idx}`}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, idx)}
                  onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                />
              ))}
            </div>

            {errors.otp && <p style={{ color: '#ff6b6b' }}>{errors.otp}</p>}

            <button type="submit">
              {loading ? 'Creating...' : 'Create Account'}
            </button>

          </form>
        )}

        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>

      </div>
    </div>
  );
}