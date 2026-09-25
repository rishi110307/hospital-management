import React from 'react';
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  HeartPulse,
  Menu,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UsersRound
} from 'lucide-react';
import './PublicWebsite.css';

const services = [
  {
    icon: Stethoscope,
    number: '01',
    title: 'Expert clinical care',
    text: 'A connected team of physicians and specialists focused on the whole person.'
  },
  {
    icon: CalendarDays,
    number: '02',
    title: 'Simple appointments',
    text: 'Find the right department, book a visit, and keep every detail in one place.'
  },
  {
    icon: HeartPulse,
    number: '03',
    title: 'Continuity that matters',
    text: 'Secure records and thoughtful follow-up help your care team see the full picture.'
  }
];

const careAreas = ['Primary care', 'Cardiology', 'Women\'s health', 'Diagnostics'];

export const PublicWebsite = ({ onEnterPortal }) => {
  return (
    <div className="public-site">
      <header className="public-nav">
        <a className="public-brand" href="#top" aria-label="SmartCare home">
          <span className="brand-mark"><HeartPulse size={22} strokeWidth={2.5} /></span>
          <span>Smart<span>Care</span></span>
        </a>
        <nav className="public-links" aria-label="Main navigation">
          <a href="#care">Our care</a>
          <a href="#promise">Why SmartCare</a>
          <a href="#contact">Contact</a>
        </nav>
        <div className="public-nav-actions">
          <button className="public-text-button" type="button" onClick={onEnterPortal}>Patient portal</button>
          <button className="public-outline-button" type="button" onClick={onEnterPortal}>Staff sign in <ArrowRight size={16} /></button>
        </div>
        <button className="public-menu-button" type="button" aria-label="Open navigation" onClick={onEnterPortal}>
          <Menu size={22} />
        </button>
      </header>

      <main id="top">
        <section className="public-hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> Care that moves with you</div>
            <h1>Better care begins with <em>being seen.</em></h1>
            <p className="hero-lede">SmartCare brings your people, appointments, records, and next step together in one calm, connected hospital experience.</p>
            <div className="hero-actions">
              <button className="public-primary-button" type="button" onClick={onEnterPortal}>Book a visit <ArrowRight size={18} /></button>
              <a className="public-video-link" href="#care"><span className="play-icon">›</span> Explore our care</a>
            </div>
            <div className="hero-trust"><ShieldCheck size={17} /><span>Private, secure, and built around your wellbeing</span></div>
          </div>

          <div className="hero-visual" aria-label="A doctor speaking with a patient">
            <div className="visual-grid" />
            <div className="image-frame">
              <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1100&q=85" alt="Doctor in a bright consultation room" />
              <div className="image-caption"><span className="caption-pulse"><HeartPulse size={17} /></span><span><strong>Care, connected</strong><small>Across every step of your journey</small></span></div>
            </div>
            <div className="hero-stat"><strong>4.9<span>/5</span></strong><small>Patient experience</small><div className="stars">★★★★★</div></div>
            <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
          </div>
        </section>

        <section className="public-ribbon" aria-label="SmartCare highlights">
          <div><strong>24/7</strong><span>Urgent support</span></div>
          <div><strong>42k+</strong><span>Patients supported</span></div>
          <div><strong>18</strong><span>Specialist departments</span></div>
          <div><strong>1 team</strong><span>Focused on you</span></div>
        </section>

        <section className="care-section" id="care">
          <div className="section-heading"><div><div className="eyebrow">The SmartCare difference</div><h2>Health care, made more human.</h2></div><p>From your first question to your follow-up plan, every touchpoint is designed to feel clear, capable, and kind.</p></div>
          <div className="service-grid">{services.map(({ icon: Icon, number, title, text }) => <article className="service-item" key={number}><div className="service-top"><span className="service-icon"><Icon size={21} /></span><span className="service-number">{number}</span></div><h3>{title}</h3><p>{text}</p><a href="#promise">Learn more <ChevronRight size={15} /></a></article>)}</div>
        </section>

        <section className="promise-section" id="promise">
          <div className="promise-image"><img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1100&q=85" alt="Healthcare team collaborating" /><div className="promise-note"><Sparkles size={18} /><span><strong>One care team</strong><small>Working together for you</small></span></div></div>
          <div className="promise-copy"><div className="eyebrow">A clearer way forward</div><h2>More than a hospital. A partner in your health.</h2><p>Good care is clinical excellence with a human pulse. Our teams share knowledge, listen closely, and make room for what matters to you.</p><ul>{['Coordinated care across departments', 'Easy access to your health information', 'Clear answers at every stage'].map(item => <li key={item}><span><Check size={14} /></span>{item}</li>)}</ul><button className="public-primary-button" type="button" onClick={onEnterPortal}>Find your care team <ArrowRight size={18} /></button></div>
        </section>

        <section className="contact-section" id="contact"><div><div className="eyebrow">Here when you need us</div><h2>Start with the right care.</h2></div><div className="contact-details"><div><Clock3 size={19} /><span><strong>Open every day</strong><small>Urgent care available 24/7</small></span></div><div><UsersRound size={19} /><span><strong>Friendly guidance</strong><small>We will help you find your way</small></span></div><button className="public-dark-button" type="button" onClick={onEnterPortal}>Get started <ArrowRight size={17} /></button></div></section>
      </main>

      <footer className="public-footer"><a className="public-brand" href="#top"><span className="brand-mark"><HeartPulse size={19} /></span><span>Smart<span>Care</span></span></a><span>Thoughtful care. Connected better.</span><span>© 2026 SmartCare Health</span></footer>
    </div>
  );
};
