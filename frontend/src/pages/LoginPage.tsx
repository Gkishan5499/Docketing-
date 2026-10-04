import React, { useState } from 'react';
import { useLawyersDiary } from '../context/LawyersDiaryContext';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Scale, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const { login } = useLawyersDiary();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await login(email, password)) navigate('/db');
  };

  return (
    <div id="login">
      <aside className="login-aside">
        <Link to="/" className="login-aside-brand">
          <span><Scale size={19} /></span>
          <strong>Lawyers Diary</strong>
        </Link>
        <div className="login-aside-copy">
          <span className="login-eyebrow">Private practice workspace</span>
          <h1>Keep every matter<br /><em>in order.</em></h1>
          <p>One considered workspace for hearings, filings, deadlines, documents, and the work between them.</p>
        </div>
        <div className="login-aside-footer">
          <ShieldCheck size={17} />
          <span>Encrypted practice records</span>
        </div>
      </aside>
      <div className="lc">
        <div className="login-card-heading">
          <span className="login-card-mark"><Scale size={21} /></span>
          <div>
            <span className="login-eyebrow">Advocate portal</span>
            <h2>Welcome back.</h2>
            <p>Sign in to continue to your practice.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="lf">
          <label htmlFor="li-e">Advocate email ID</label>
          <div className="login-input-wrap">
            <Mail size={16} />
          <input
            type="email"
            id="li-e"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@yourfirm.com"
            required
          />
          </div>

          <label htmlFor="li-p">Password</label>
          <div className="login-input-wrap">
            <LockKeyhole size={16} />
            <input
              type={showPassword ? 'text' : 'password'}
              id="li-p"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            <button className="login-password-toggle" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button type="submit" className="btn-login">
            Enter practice <ArrowRight size={16} />
          </button>
        </form>

        <Link to="/" className="login-back-link">
          Back to Lawyers Diary
        </Link>

        <div className="login-card-footer">
          Lawyers Diary Enterprise <span>·</span> Cloud-encrypted practice management
        </div>
      </div>
    </div>
  );
};
