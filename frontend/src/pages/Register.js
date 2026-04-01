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
    if (val && idx < 5) document.getElementById(`rotp-${idx + 1}`)?.focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0)
      document.getElementById(`rotp-${idx - 1}`)?.focus();
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

        {/* Step indicators */}
        <div style={{display:'flex',gap:'8px',marginBottom:'20px',justifyContent:'center'}}>
          {['Details','Verify Email'].map((label, i) => (
            <div key={i} style={{display:'flex',alignItems:'center',gap:'6px'}}>
              <div style={{
                width:'28px',height:'28px',borderRadius:'50%',
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:'12px',fontWeight:'700',
                background: step > i+1 ? '#10b981' : step === i+1 ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                border: step === i+1 ? '2px solid #10b981' : step > i+1 ? 'none' : '2px solid rgba(255,255,255,0.1)',
                color: step > i+1 ? '#0d1117' : step === i+1 ? '#10b981' : '#475569',
              }}>
                {step > i+1 ? '✓' : i+1}
              </div>
              <span style={{fontSize:'12px',color:step===i+1?'#10b981':'#475569'}}>{label}</span>
              {i < 1 && <div style={{width:'24px',height:'1px',background:'rgba(255,255,255,0.1)'}}/>}
            </div>
          ))}
        </div>

        {errors.general && <div className="error-msg">⚠️ {errors.general}</div>}
        {success && <div className="success-msg">✅ {success}</div>}

        {/* Step 1 — Details */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label>Full Name</label>
              <input name="name" placeholder="Thanmai Navudu"
                value={form.name} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input name="email" type="email" placeholder="you@example.com"
                value={form.email} onChange={handleChange}
                style={{borderColor: errors.email ? '#ff6b6b' : ''}} required />
              {errors.email && (
                <p style={{color:'#ff6b6b',fontSize:'12px',margin:'6px 0 0'}}>
                  ⚠️ {errors.email} <Link to="/login" style={{color:'#00ffc8'}}>Login instead?</Link>
                </p>
              )}
            </div>

            <div className="form-group">
              <label>Password</label>
              <input name="password" type="password" placeholder="Minimum 6 characters"
                value={form.password} onChange={handleChange}
                style={{borderColor: errors.password ? '#ff6b6b' : ''}} required />
              {errors.password && <p style={{color:'#ff6b6b',fontSize:'12px',margin:'6px 0 0'}}>⚠️ {errors.password}</p>}
              {strength && (
                <div style={{marginTop:'8px'}}>
                  <div style={{height:'4px',borderRadius:'2px',background:'rgba(255,255,255,0.08)',overflow:'hidden'}}>
                    <div style={{height:'100%',borderRadius:'2px',width:strength.width,background:strength.color,transition:'all 0.3s'}}/>
                  </div>
                  <p style={{fontSize:'11px',marginTop:'4px',color:strength.color}}>{strength.label}</p>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input name="confirmPassword" type="password" placeholder="Repeat your password"
                value={form.confirmPassword} onChange={handleChange}
                style={{borderColor: errors.confirmPassword ? '#ff6b6b' : form.confirmPassword && form.password === form.confirmPassword ? '#10b981' : ''}}
                required />
              {errors.confirmPassword && <p style={{color:'#ff6b6b',fontSize:'12px',margin:'6px 0 0'}}>⚠️ {errors.confirmPassword}</p>}
              {form.confirmPassword && form.password === form.confirmPassword && (
                <p style={{color:'#10b981',fontSize:'12px',margin:'6px 0 0'}}>✅ Passwords match!</p>
              )}
            </div>

            <button className="register-btn" type="submit" disabled={loading}>
              {loading ? '⏳ Sending OTP...' : 'Send Verification OTP →'}
            </button>
          </form>
        )}

        {/* Step 2 — OTP */}
        {step === 2 && (
          <form onSubmit={handleRegister}>
            <p style={{color:'#64748b',fontSize:'13px',marginBottom:'20px',textAlign:'center'}}>
              Enter the 6-digit code sent to{' '}
              <strong style={{color:'#10b981'}}>{form.email}</strong>
            </p>
            <div style={{display:'flex',gap:'10px',justifyContent:'center',marginBottom:'20px'}}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`rotp-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, idx)}
                  onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                  style={{
                    width:'46px',height:'56px',
                    textAlign:'center',fontSize:'22px',fontWeight:'700',
                    background:'rgba(255,255,255,0.04)',
                    border: digit ? '2px solid #10b981' : '2px solid rgba(255,255,255,0.1)',
                    borderRadius:'12px',color:'#f1f5f9',
                    fontFamily:'Inter,sans-serif',outline:'none',
                    transition:'all 0.2s',
                    boxShadow: digit ? '0 0 12px rgba(16,185,129,0.2)' : 'none'
                  }}
                />
              ))}
            </div>
            {errors.otp && <p style={{color:'#ff6b6b',fontSize:'12px',textAlign:'center',marginBottom:'12px'}}>⚠️ {errors.otp}</p>}
            <button className="register-btn" type="submit" disabled={loading}>
              {loading ? '⏳ Creating account...' : '🚀 Create Account'}
            </button>
            <p style={{textAlign:'center',marginTop:'12px',fontSize:'13px',color:'#64748b'}}>
              Wrong email?{' '}
              <span style={{color:'#10b981',cursor:'pointer',fontWeight:'600'}}
                onClick={() => { setStep(1); setErrors({}); setSuccess(''); }}>
                Go back
              </span>
            </p>
          </form>
        )}

        <p className="login-link" style={{marginTop:'16px'}}>
          Already have an account? <Link to="/login">Sign in here</Link>
        </p>
      </div>
    </div>
  );
}