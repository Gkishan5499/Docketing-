import React, { FormEvent, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Check,
  ChevronDown,
  FileText,
  LockKeyhole,
  Menu,
  Scale,
  Search,
  ShieldCheck,
  UsersRound,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const plans = [
  {
    name: 'Solo Counsel',
    monthly: 1499,
    yearly: 14990,
    description: 'A focused command centre for an independent practice.',
    features: ['1 advocate account', 'Unlimited matters and clients', 'Docket calendar and reminders', 'Secure document workspace'],
  },
  {
    name: 'Chambers',
    monthly: 3999,
    yearly: 39990,
    description: 'The shared workspace for a growing legal team.',
    features: ['Up to 5 team accounts', 'Role-based access controls', 'Matter assignments and task tracking', 'Audit history and reports'],
    featured: true,
  },
  {
    name: 'Firm Office',
    monthly: 7999,
    yearly: 79990,
    description: 'A private operating layer for established firms.',
    features: ['Up to 15 team accounts', 'Priority onboarding support', 'Advanced reporting workspace', 'Custom firm configuration'],
  },
];

const faqs = [
  ['How do lawyers get access?', 'After purchase, we create the firm workspace and share individual login credentials securely with each authorized user.'],
  ['Can I change plans later?', 'Yes. You can move between plans as your team changes. We will help with the transition and preserve your matter history.'],
  ['Is my legal data private?', 'Lawyers Diary is designed around firm-level access controls, authenticated sessions, audit history, and protected document access.'],
];

export const LandingPage: React.FC = () => {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [sent, setSent] = useState(false);

  const selectPlan = (plan: string) => {
    setSelectedPlan(plan);
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  const submitContact = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  return (
    <div className="marketing-page">
      <header className="marketing-nav">
        <a className="marketing-brand" href="#top" aria-label="Lawyers Diary home">
          <span className="marketing-mark"><Scale size={19} /></span>
          <span>Lawyers <strong>Diary</strong></span>
        </a>
        <button className="marketing-menu" type="button" onClick={() => setMobileOpen((open) => !open)} aria-label="Toggle navigation">
          {mobileOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav className={`marketing-links ${mobileOpen ? 'is-open' : ''}`}>
          <a href="#product" onClick={() => setMobileOpen(false)}>Platform</a>
          <a href="#plans" onClick={() => setMobileOpen(false)}>Plans</a>
          <a href="#security" onClick={() => setMobileOpen(false)}>Security</a>
          <a href="#contact" onClick={() => setMobileOpen(false)}>Contact</a>
          <Link className="marketing-login" to="/login" onClick={() => setMobileOpen(false)}>Login <ArrowRight size={15} /></Link>
        </nav>
      </header>

      <main id="top">
        <section className="marketing-hero">
          <div className="hero-copy">
            <p className="eyebrow"><span /> Practice software for serious legal work</p>
            <h1>Your docket.<br /><em>Under control.</em></h1>
            <p className="hero-lede">Lawyers Diary gives advocates one calm, private place to run matters, protect deadlines, and keep every client commitment visible.</p>
            <div className="hero-actions">
              <button className="button button-primary" type="button" onClick={() => selectPlan('Chambers')}>Choose your plan <ArrowRight size={17} /></button>
              <a className="text-link" href="#product">See how it works <ChevronDown size={16} /></a>
            </div>
            <div className="hero-proof"><BadgeCheck size={17} /><span>Built for Indian courts, registries, tribunals, and IP practice</span></div>
          </div>
          <div className="hero-console" aria-label="Lawyers Diary product preview">
            <div className="console-top"><span className="console-kicker">Today in chambers</span><span className="console-date">19 Aug 2026 <ChevronDown size={14} /></span></div>
            <div className="console-heading"><div><span className="console-label">Good morning, Advocate</span><h2>Keep the day moving.</h2></div><span className="console-avatar">AD</span></div>
            <div className="console-metrics"><div><strong>24</strong><span>Active matters</span></div><div className="metric-alert"><strong>03</strong><span>Due this week</span></div><div><strong>08</strong><span>Open tasks</span></div></div>
            <div className="console-list"><div className="console-row"><span className="row-dot urgent" /><div><strong>FER reply · SHARMEX</strong><small>Trade Marks Registry · Today, 4:00 PM</small></div><span className="row-tag">Urgent</span></div><div className="console-row"><span className="row-dot hearing" /><div><strong>Arguments · W.P.(C) 8821/2025</strong><small>Delhi High Court · Tomorrow, 10:30 AM</small></div><span className="row-tag muted">Hearing</span></div><div className="console-row"><span className="row-dot task" /><div><strong>Review counter affidavit</strong><small>Rajesh Kumar · Friday</small></div><span className="row-tag muted">Task</span></div></div>
            <div className="console-footer"><span><LockKeyhole size={13} /> Your practice, your permissions</span><span>View docket <ArrowRight size={13} /></span></div>
          </div>
        </section>

        <section className="trust-strip"><span>For advocates who manage more than a calendar</span><div><span><Scale size={17} /> Court matters</span><span><FileText size={17} /> IP portfolios</span><span><UsersRound size={17} /> Firm teams</span><span><ShieldCheck size={17} /> Private records</span></div></section>

        <section className="marketing-section product-section" id="product">
          <div className="section-intro"><p className="eyebrow"><span /> One practice, one view</p><h2>The work is complex.<br /><em>Your system should not be.</em></h2><p>Stop piecing together spreadsheets, chat messages, calendar alerts, and scattered folders. Lawyers Diary turns the daily rhythm of legal practice into a dependable operating system.</p></div>
          <div className="feature-grid"><article><span className="feature-number">01</span><CalendarClock size={24} /><h3>Never miss the next date</h3><p>See hearings, FER replies, filings, and follow-ups in one docket calendar with clear priority and ownership.</p></article><article><span className="feature-number">02</span><Search size={24} /><h3>Find the matter instantly</h3><p>Search across clients, case numbers, marks, courts, documents, and notes without leaving your practice workspace.</p></article><article><span className="feature-number">03</span><LockKeyhole size={24} /><h3>Keep access intentional</h3><p>Give each lawyer and staff member the right workspace, with firm-level permissions and a durable activity trail.</p></article></div>
        </section>

        <section className="security-section" id="security"><div className="security-stamp"><ShieldCheck size={32} /><span>Practice<br />protected</span></div><div><p className="eyebrow"><span /> Designed for confidence</p><h2>Your clients trust<br /><em>your judgement.</em></h2><p>They should be able to trust the system behind it. Keep sensitive matter information organized, access-controlled, and available to the people doing the work.</p><div className="security-points"><span><Check size={15} /> Firm-level workspaces</span><span><Check size={15} /> User roles and permissions</span><span><Check size={15} /> Secure document access</span><span><Check size={15} /> Searchable audit history</span></div></div></section>

        <section className="marketing-section plans-section" id="plans"><div className="section-heading"><div><p className="eyebrow"><span /> Simple, transparent plans</p><h2>Start with the practice<br /><em>you are building.</em></h2></div><div className="billing-toggle"><button className={billing === 'monthly' ? 'active' : ''} onClick={() => setBilling('monthly')} type="button">Monthly</button><button className={billing === 'yearly' ? 'active' : ''} onClick={() => setBilling('yearly')} type="button">Yearly <small>Save 2 months</small></button></div></div><div className="plans-grid">{plans.map((plan) => <article className={`plan-card ${plan.featured ? 'featured' : ''}`} key={plan.name}>{plan.featured && <span className="plan-ribbon">Most chosen</span>}<h3>{plan.name}</h3><p>{plan.description}</p><div className="plan-price"><span>₹</span><strong>{(billing === 'monthly' ? plan.monthly : Math.round(plan.yearly / 12)).toLocaleString('en-IN')}</strong><small>/ month<br />{billing === 'yearly' ? 'billed yearly' : 'billed monthly'}</small></div><button className={plan.featured ? 'button button-primary' : 'button button-outline'} type="button" onClick={() => selectPlan(plan.name)}>Talk to us <ArrowRight size={16} /></button><ul>{plan.features.map((feature) => <li key={feature}><Check size={15} /> {feature}</li>)}</ul></article>)}</div></section>

        <section className="faq-section"><div><p className="eyebrow"><span /> Before you begin</p><h2>A better way to<br /><em>run the day.</em></h2></div><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={17} /></summary><p>{answer}</p></details>)}</div></section>

        <section className="contact-section" id="contact"><div className="contact-copy"><p className="eyebrow"><span /> Start a conversation</p><h2>Let’s put your<br /><em>practice in order.</em></h2><p>Tell us a little about your chambers or firm. We will recommend a plan, set up your workspace, and share login details for every purchased seat.</p><div className="contact-details"><span><strong>Email</strong> hello@lawyersdiary.in</span><span><strong>Hours</strong> Monday–Friday · 10:00–18:00 IST</span></div></div>{sent ? <div className="contact-success"><BadgeCheck size={36} /><h3>Thank you. We have your note.</h3><p>Our team will contact you shortly about your Lawyers Diary workspace.</p><button className="text-link" type="button" onClick={() => setSent(false)}>Send another enquiry <ArrowRight size={15} /></button></div> : <form className="contact-form" onSubmit={submitContact}><div className="form-row"><label>Name<input required name="name" placeholder="Your name" /></label><label>Firm / chambers<input required name="firm" placeholder="Firm name" /></label></div><label>Work email<input required type="email" name="email" placeholder="you@yourfirm.com" /></label><label>What are you looking for?<select name="plan" value={selectedPlan} onChange={(event) => setSelectedPlan(event.target.value)}><option value="">Select a plan</option>{plans.map((plan) => <option key={plan.name} value={plan.name}>{plan.name}</option>)}<option value="custom">A custom conversation</option></select></label><label>Message<textarea required name="message" rows={4} placeholder="Tell us about your practice and team size" /></label><button className="button button-primary" type="submit">Request a conversation <ArrowRight size={17} /></button></form>}</section>
      </main>
      <footer className="marketing-footer"><a className="marketing-brand" href="#top"><span className="marketing-mark"><Scale size={17} /></span><span>Lawyers <strong>Diary</strong></span></a><span>Professional practice software for lawyers.</span><span>© 2026 Lawyers Diary</span><Link className="owner-footer-link" to="/owner/login">Owner portal</Link></footer>
    </div>
  );
};
