import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Login.css';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess('OTP sent! Check your email inbox.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    }
    setLoading(false);
  };

  const handleOtpChange = (val, idx) => {
    const updated = [...otp];
    updated[idx] = val.slice(-1);
    setOtp(updated);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0)
      document.getElementById(`otp-${idx - 1}`)?.focus();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const otpStr = otp.join('');
    if (otpStr.length < 6) {
      setError('Please enter all 6 digits.');
      setLoading(false); return;
    }
    try {
      await api.post('/auth/verify-otp', { email, otp: otpStr });
      setSuccess('OTP verified! Create your new password.');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP.');
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.'); return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.'); return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp: otp.join(''), newPassword });
      setSuccess('Password reset! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed.');
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card" style={{width: '440px'}}>
        <div className="login-logo">
          <h1>⚡ Taskora</h1>
          <p>Password Recovery</p>
        </div>

        {/* Step indicators */}
        <div style={{display:'flex', gap:'8px', marginBottom:'24px', justifyContent:'center'}}>
          {['Email', 'OTP', 'Password'].map((label, i) => (
            <div key={i} style={{display:'flex', alignItems:'center', gap:'6px'}}>
              <div style={{
                width:'28px', height:'28px', borderRadius:'50%',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'12px', fontWeight:'700',
                background: step > i + 1 ? '#00ffc8' : step === i + 1 ? 'rgba(0,255,200,0.2)' : 'rgba(255,255,255,0.05)',
                border: step === i + 1 ? '2px solid #00ffc8' : step > i + 1 ? 'none' : '2px solid rgba(255,255,255,0.1)',
                color: step > i + 1 ? '#0d1117' : step === i + 1 ? '#00ffc8' : '#475569',
              }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span style={{fontSize:'12px', color: step === i + 1 ? '#00ffc8' : '#475569'}}>{label}</span>
              {i < 2 && <div style={{width:'20px', height:'1px', background:'rgba(255,255,255,0.1)'}}/>}
            </div>
          ))}
        </div>

        {error && <div className="error-msg">⚠️ {error}</div>}
        {success && <div style={{background:'rgba(0,255,200,0.08)',border:'1px solid rgba(0,255,200,0.25)',color:'#00ffc8',padding:'12px 16px',borderRadius:'10px',fontSize:'13px',marginBottom:'1rem'}}>✅ {success}</div>}

        {/* Step 1 — Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label>Your Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? '⏳ Sending...' : 'Send OTP →'}
            </button>
          </form>
        )}

        {/* Step 2 — OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <p style={{color:'#64748b',fontSize:'13px',marginBottom:'20px',textAlign:'center'}}>
              Enter the 6-digit code sent to <strong style={{color:'#00ffc8'}}>{email}</strong>
            </p>
            <div style={{display:'flex', gap:'10px', justifyContent:'center', marginBottom:'20px'}}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, idx)}
                  onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                  style={{
                    width:'46px', height:'56px',
                    textAlign:'center', fontSize:'22px', fontWeight:'700',
                    background:'rgba(255,255,255,0.04)',
                    border: digit ? '2px solid #00ffc8' : '2px solid rgba(255,255,255,0.1)',
                    borderRadius:'12px', color:'#f1f5f9',
                    fontFamily:'Inter, sans-serif',
                    outline:'none',
                    transition:'all 0.2s',
                    boxShadow: digit ? '0 0 12px rgba(0,255,200,0.2)' : 'none'
                  }}
                />
              ))}
            </div>
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? '⏳ Verifying...' : 'Verify OTP →'}
            </button>
            <p style={{textAlign:'center',marginTop:'12px',fontSize:'13px',color:'#64748b'}}>
              Didn't get it?{' '}
              <span
                style={{color:'#00ffc8',cursor:'pointer',fontWeight:'600'}}
                onClick={() => { setStep(1); setError(''); setSuccess(''); }}
              >
                Resend OTP
              </span>
            </p>
          </form>
        )}

        {/* Step 3 — New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {newPassword && (
              <div style={{marginBottom:'12px'}}>
                <div style={{height:'4px',borderRadius:'2px',background:'rgba(255,255,255,0.08)',overflow:'hidden'}}>
                  <div style={{
                    height:'100%',borderRadius:'2px',transition:'all 0.3s',
                    width: newPassword.length < 6 ? '33%' : newPassword.length < 10 ? '66%' : '100%',
                    background: newPassword.length < 6 ? '#ff6b6b' : newPassword.length < 10 ? '#ffa500' : '#00ffc8'
                  }}/>
                </div>
                <p style={{fontSize:'11px',marginTop:'4px',color: newPassword.length < 6 ? '#ff6b6b' : newPassword.length < 10 ? '#ffa500' : '#00ffc8'}}>
                  {newPassword.length < 6 ? 'Weak' : newPassword.length < 10 ? 'Good' : 'Strong'} password
                </p>
              </div>
            )}
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? '⏳ Resetting...' : '🔐 Reset Password'}
            </button>
          </form>
        )}

        <p className="register-link" style={{marginTop:'16px'}}>
          <Link to="/login">← Back to Login</Link>
        </p>
      </div>
    </div>
  );
}