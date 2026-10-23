import React, { FormEvent, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Check,
  ChevronDown,
  FileText,
  LockKeyhole,
  Scale,
  Search,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { LandingHeader } from '../components/landing/LandingHeader';

const plans = [
  {
    name: 'Solo Counsel',
    monthly: 759,
    yearly: 7590,
    description: 'A focused command centre for an independent practice.',
    features: ['1 advocate account', 'Unlimited matters and clients', 'Docket calendar and reminders', 'Secure document workspace'],
  },
  {
    name: 'Chambers',
    monthly: 1599,
    yearly: 15990,
    description: 'The shared workspace for a growing legal team.',
    features: ['Up to 5 team accounts', 'Role-based access controls', 'Matter assignments and task tracking', 'Audit history and reports'],
    featured: true,
  },
  {
    name: 'Firm Office',
    monthly: 2999,
    yearly: 29990,
    description: 'A private operating layer for established firms.',
    features: ['Up to 15 team accounts', 'Priority onboarding support', 'Advanced reporting workspace', 'Custom firm configuration'],
  },
];

const faqs = [
  ['How do lawyers get access?', 'After purchase, we create the firm workspace and share individual login credentials securely with each authorized user.'],
  ['Can I change plans later?', 'Yes. You can move between plans as your team changes. We will help with the transition and preserve your matter history.'],
  ['Is my legal data private?', 'DexFora is designed around firm-level access controls, authenticated sessions, audit history, and protected document access.'],
];

export const LandingPage: React.FC = () => {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [formData, setFormData] = useState({
    name: '',
    firm: '',
    email: '',
    phone: '',
    plan: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [sent, setSent] = useState(false);

  const selectPlan = (plan: string) => {
    setFormData((prev) => ({ ...prev, plan }));
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  const submitContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError('');

    if (formData.phone && formData.phone.length !== 10) {
      setSubmitError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        phone: formData.phone ? `+91 ${formData.phone}` : '',
      };
      const response = await fetch('/api/v1/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit enquiry. Please try again.');
      }
      setSent(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to dispatch enquiry email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="marketing-page">
      <LandingHeader />

      <main id="top">
        <section className="marketing-hero">
          <div className="hero-copy">
            <p className="eyebrow"><span /> Practice software for serious legal work</p>
            <h1>Your docket.<br /><em>Under control.</em></h1>
            <p className="hero-lede">DexFora gives advocates one calm, private place to run matters, protect deadlines, and keep every client commitment visible.</p>
            <div className="hero-actions">
              <Link className="button button-primary" to="/register" style={{ textDecoration: 'none' }}>
                Start 1-Month Free Trial <ArrowRight size={17} />
              </Link>
              <a className="text-link" href="#product">See how it works <ChevronDown size={16} /></a>
            </div>
            <div className="hero-proof"><BadgeCheck size={17} /><span>1st Month Complimentary · No credit card required · Built for Indian practice</span></div>
          </div>
          <div className="hero-console" aria-label="DexFora product preview">
            <div className="console-top"><span className="console-kicker">Today in chambers</span><span className="console-date">19 Aug 2026 <ChevronDown size={14} /></span></div>
            <div className="console-heading"><div><span className="console-label">Good morning, Advocate</span><h2>Keep the day moving.</h2></div><span className="console-avatar">AD</span></div>
            <div className="console-metrics"><div><strong>24</strong><span>Active matters</span></div><div className="metric-alert"><strong>03</strong><span>Due this week</span></div><div><strong>08</strong><span>Open tasks</span></div></div>
            <div className="console-list"><div className="console-row"><span className="row-dot urgent" /><div><strong>FER reply · SHARMEX</strong><small>Trade Marks Registry · Today, 4:00 PM</small></div><span className="row-tag">Urgent</span></div><div className="console-row"><span className="row-dot hearing" /><div><strong>Arguments · W.P.(C) 8821/2025</strong><small>Delhi High Court · Tomorrow, 10:30 AM</small></div><span className="row-tag muted">Hearing</span></div><div className="console-row"><span className="row-dot task" /><div><strong>Review counter affidavit</strong><small>Rajesh Kumar · Friday</small></div><span className="row-tag muted">Task</span></div></div>
            <div className="console-footer"><span><LockKeyhole size={13} /> Your practice, your permissions</span><span>View docket <ArrowRight size={13} /></span></div>
          </div>
        </section>

        <section className="trust-strip"><span>For advocates who manage more than a calendar</span><div><span><Scale size={17} /> Court matters</span><span><FileText size={17} /> IP portfolios</span><span><UsersRound size={17} /> Firm teams</span><span><ShieldCheck size={17} /> Private records</span></div></section>

        <section className="marketing-section product-section" id="product">
          <div className="section-intro"><p className="eyebrow"><span /> One practice, one view</p><h2>The work is complex.<br /><em>Your system should not be.</em></h2><p>Stop piecing together spreadsheets, chat messages, calendar alerts, and scattered folders. DexFora turns the daily rhythm of legal practice into a dependable operating system.</p></div>
          <div className="feature-grid"><article><span className="feature-number">01</span><CalendarClock size={24} /><h3>Never miss the next date</h3><p>See hearings, FER replies, filings, and follow-ups in one docket calendar with clear priority and ownership.</p></article><article><span className="feature-number">02</span><Search size={24} /><h3>Find the matter instantly</h3><p>Search across clients, case numbers, marks, courts, documents, and notes without leaving your practice workspace.</p></article><article><span className="feature-number">03</span><LockKeyhole size={24} /><h3>Keep access intentional</h3><p>Give each lawyer and staff member the right workspace, with firm-level permissions and a durable activity trail.</p></article></div>
        </section>

        <section className="security-section" id="security"><div className="security-stamp"><ShieldCheck size={32} /><span>Practice<br />protected</span></div><div><p className="eyebrow"><span /> Designed for confidence</p><h2>Your clients trust<br /><em>your judgement.</em></h2><p>They should be able to trust the system behind it. Keep sensitive matter information organized, access-controlled, and available to the people doing the work.</p><div className="security-points"><span><Check size={15} /> Firm-level workspaces</span><span><Check size={15} /> User roles and permissions</span><span><Check size={15} /> Secure document access</span><span><Check size={15} /> Searchable audit history</span></div></div></section>

        <section className="marketing-section plans-section" id="plans">
          <div className="section-heading">
            <div>
              <p className="eyebrow"><span /> Simple, transparent plans</p>
              <h2>Start with the practice<br /><em>you are building.</em></h2>
            </div>
            <div className="billing-toggle">
              <button className={billing === 'monthly' ? 'active' : ''} onClick={() => setBilling('monthly')} type="button">Monthly</button>
              <button className={billing === 'yearly' ? 'active' : ''} onClick={() => setBilling('yearly')} type="button">Yearly <small>Save 2 months</small></button>
            </div>
          </div>

          {/* 1 Month Free Trial Banner */}
          <div
            style={{
              margin: '1.5rem 0',
              padding: '1rem 1.35rem',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(0, 140, 255, 0.08) 0%, rgba(0, 217, 232, 0.12) 100%)',
              border: '1px solid rgba(0, 140, 255, 0.28)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <strong style={{ color: '#005bb5', fontSize: '0.98rem', display: 'block' }}>
                🎁 1st Month 100% Free for All Advocates & Chambers
              </strong>
              <span style={{ fontSize: '0.84rem', color: '#475569' }}>
                Register today and enjoy 30 days of full, unrestricted access to DexFora. Zero upfront payment or credit card required.
              </span>
            </div>
            <Link
              to="/register"
              className="button button-primary"
              style={{ padding: '0.55rem 1.25rem', fontSize: '0.84rem', textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              Claim 1-Month Free <ArrowRight size={15} />
            </Link>
          </div>

          <div className="plans-grid">
            {plans.map((plan) => (
              <article className={`plan-card ${plan.featured ? 'featured' : ''}`} key={plan.name}>
                {plan.featured && <span className="plan-ribbon">Most chosen</span>}
                <h3>{plan.name}</h3>
                <p>{plan.description}</p>
                <div className="plan-price">
                  <span>₹</span>
                  <strong>{(billing === 'monthly' ? plan.monthly : Math.round(plan.yearly / 12)).toLocaleString('en-IN')}</strong>
                  <small>/ month<br />{billing === 'yearly' ? 'billed yearly' : 'billed monthly'}</small>
                </div>
                <div style={{ display: 'grid', gap: '0.5rem', width: '100%' }}>
                  <Link
                    to="/register"
                    className={plan.featured ? 'button button-primary' : 'button button-outline'}
                    style={{ textAlign: 'center', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    Start 30-Day Free Trial <ArrowRight size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => selectPlan(plan.name)}
                    style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.74rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    or contact chambers desk
                  </button>
                </div>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}><Check size={15} /> {feature}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="faq-section"><div><p className="eyebrow"><span /> Before you begin</p><h2>A better way to<br /><em>run the day.</em></h2></div><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={17} /></summary><p>{answer}</p></details>)}</div></section>

        <section className="contact-section" id="contact">
          <div className="contact-copy">
            <p className="eyebrow"><span /> Start a conversation</p>
            <h2>Let’s put your<br /><em>practice in order.</em></h2>
            <p>Tell us a little about your chambers or firm. We will recommend a plan, set up your workspace, and share login details for every purchased seat.</p>
            <div className="contact-details">
              <span><strong>Enquiry</strong> <a href="tel:8447014799">+91 84470 14799</a></span>
              <span><strong>Email</strong> <a href="mailto:dexforaofficial@gmail.com">dexforaofficial@gmail.com</a></span>
              <span><strong>Hours</strong> Monday–Saturday · 09:30–19:30 IST</span>
            </div>
          </div>
          {sent ? (
            <div className="contact-success">
              <BadgeCheck size={38} style={{ color: "#00D9E8" }} />
              <h3>Thank you, {formData.name || 'Advocate'}! We received your enquiry.</h3>
              <p>
                An email notification has been dispatched to our practice onboarding desk at <strong>dexforaofficial@gmail.com</strong>, and a confirmation note has been sent to <strong>{formData.email}</strong>.
              </p>
              <p style={{ marginTop: '0.65rem', color: '#cbd5e1', fontSize: '0.82rem', lineHeight: '1.6' }}>
                Our team will connect with you shortly to schedule a walkthrough and confirm your private workspace setup, or you can reach us directly at <strong>+91 84470 14799</strong>.
              </p>
              <button
                className="text-link"
                type="button"
                style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                onClick={() => {
                  setSent(false);
                  setFormData({ name: '', firm: '', email: '', phone: '', plan: '', message: '' });
                }}
              >
                Send another enquiry <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={submitContact}>
              <div className="form-row">
                <label>
                  Name
                  <input
                    required
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                  />
                </label>
                <label>
                  Firm / chambers
                  <input
                    required
                    name="firm"
                    value={formData.firm}
                    onChange={(e) => setFormData({ ...formData, firm: e.target.value })}
                    placeholder="Firm name"
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Work email
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@yourfirm.com"
                  />
                </label>
                <label>
                  <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Phone number (optional)</span>
                    {formData.phone ? (
                      <span style={{ color: formData.phone.length === 10 ? '#10b981' : '#64748b', fontWeight: 600, fontSize: '0.62rem' }}>
                        {formData.phone.length}/10 digits
                      </span>
                    ) : null}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'stretch', marginTop: '0.4rem' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 0.85rem',
                        background: '#eef2f6',
                        color: '#071B49',
                        border: '1px solid var(--bd2, #cbd5e1)',
                        borderRight: 'none',
                        borderRadius: '6px 0 0 6px',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        userSelect: 'none',
                        flexShrink: 0,
                      }}
                    >
                      +91
                    </span>
                    <input
                      style={{
                        marginTop: 0,
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                      }}
                      type="tel"
                      name="phone"
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormData({ ...formData, phone: digits });
                      }}
                      placeholder="98765 43210"
                    />
                  </div>
                </label>
              </div>
              <label>
                What are you looking for?
                <select
                  name="plan"
                  value={formData.plan}
                  onChange={(event) => setFormData({ ...formData, plan: event.target.value })}
                >
                  <option value="">Select a plan</option>
                  {plans.map((plan) => (
                    <option key={plan.name} value={plan.name}>
                      {plan.name} (₹{plan.monthly.toLocaleString('en-IN')}/mo)
                    </option>
                  ))}
                  <option value="Custom">A custom conversation / Enterprise</option>
                </select>
              </label>
              <label>
                Message
                <textarea
                  required
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your practice and team size"
                />
              </label>
              {submitError && (
                <div style={{ padding: '8px 12px', background: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '8px' }}>
                  {submitError}
                </div>
              )}
              <button className="button button-primary" type="submit" disabled={submitting}>
                {submitting ? 'Sending enquiry via mail...' : 'Request a conversation'} <ArrowRight size={17} />
              </button>
            </form>
          )}
        </section>
      </main>
      <footer className="marketing-footer"><a className="marketing-footer-brand" href="#top" aria-label="DexFora home"><img src="/logo.png" alt="DexFora" className="marketing-footer-logo" /></a><span>Enquiry: <a href="tel:8447014799">+91 84470 14799</a> · <a href="mailto:dexforaofficial@gmail.com">dexforaofficial@gmail.com</a></span><span>© 2026 DexFora</span><Link className="owner-footer-link" to="/owner/login">Owner portal</Link></footer>
    </div>
  );
};
