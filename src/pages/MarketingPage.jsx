import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowRight, ArrowDown, Mountain, Compass, Wrench, Bike, Heart, ShieldCheck, Coffee, Check, Plus, Smartphone, Menu, X } from 'lucide-react';
import { validateEmail } from '../utils/authValidation';
import '../styles/marketing.css';

const appStoreUrl = import.meta.env.VITE_APP_STORE_URL;
const screenshots = {
  trails: { src: '/marketing/trails.webp', alt: 'Trail Brew trail finder showing Gauteng trails, riding styles and distances', width: 868, height: 1822 },
  garage: { src: '/marketing/garage.webp', alt: 'Trail Brew Garage showing bike service progress and chain, shock and tyre condition', width: 866, height: 1834 },
  social: { src: '/marketing/ride-together.webp', alt: 'Trail Brew introduction to planning rides with other people', width: 900, height: 1820 },
};

const faqs = [
  ['What is Trail Brew?', 'Your mountain biking companion for finding trails, planning rides and looking after your bike. The iPhone app brings your ride history, trail plans and garage together, so there’s less to organise before you head out.'],
  ['Where can I find trails?', 'The current trail catalogue focuses on Gauteng, South Africa. Browse the list or answer four questions in the trail finder for suggestions based on your riding preferences. Check with the venue for current opening hours, access fees and trail conditions.'],
  ['Do I need Apple Health or a fitness tracker?', 'No. You can log a ride manually. If you choose to connect Apple Health, Trail Brew can import cycling workouts, including the distance and duration available for each ride. Health permissions are optional and remain under your control.'],
  ['Can I track more than one bike?', 'Yes. Keep multiple bikes in your garage, each with its own service intervals and component tracking. Choose which bike a ride belongs to, or leave it unassigned. Your ride history belongs to you, even when you switch bikes.'],
  ['Are my ride plans public?', 'Personal trail plans start private. You can explicitly share a ride using a private invite link or a community post. Anyone with a private invite link can access that ride, so share it thoughtfully. Community rides support open joining or host approval. Trail Brew never messages your contacts automatically.'],
  ['How do service reminders work?', 'Rides assigned to a bike contribute distance and time to its service counters. Track overall service and individual components, record maintenance and keep invoices together. Optional reminders help you keep an eye on upcoming service; always follow your manufacturer’s maintenance guidance.'],
  ['How can I get the iPhone app?', appStoreUrl ? 'Use the App Store link on this page to see the current release and device requirements. You can also explore the Gauteng trail finder on the web.' : 'The iPhone app is currently available through invite-only TestFlight testing. Join the waiting list below and we’ll email you as places become available. You can explore the Gauteng trail finder on the web in the meantime.'],
];

function Phone({ screen, className = '', eager = false }) {
  return <div className={`m-phone ${className}`}><img {...screenshots[screen]} loading={eager ? 'eager' : 'lazy'} decoding="async" /></div>;
}

function Brand() {
  return <Link to="/" className="m-brand" aria-label="Trail Brew web app home"><span className="m-brand-mark" aria-hidden="true">⛰️</span><span className="m-brand-name">Trail Brew</span></Link>;
}

function Waitlist() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    const validation = validateEmail(email);
    if (validation) { setError(validation); return; }
    setStatus('sending'); setError('');
    try {
      // Load Firebase only after a visitor explicitly submits the form.
      const { joinTestflightWaitlist } = await import('../services/waitlistService');
      await joinTestflightWaitlist({ email, feature: 'marketing-website' });
      setStatus('success');
    } catch {
      setStatus('idle');
      setError('We couldn’t save your email. Please try again, or contact support below.');
    }
  }
  if (status === 'success') return <p className="m-success" role="status"><Check /> You’re on the list. Look out for an invite in your inbox.</p>;
  return <form className="m-waitlist" onSubmit={submit} noValidate>
    <label htmlFor="waitlist-email">Your email address</label>
    <div className="m-form-row"><input id="waitlist-email" type="email" name="email" autoComplete="email" placeholder="you@example.com" required value={email} disabled={status === 'sending'} onChange={e => { setEmail(e.target.value); setError(''); }} aria-invalid={!!error} aria-describedby={error ? 'waitlist-error' : 'waitlist-note'} /><button className="m-button" disabled={status === 'sending'}>{status === 'sending' ? 'Joining…' : 'Join the waiting list'}<ArrowUpRight size={18} /></button></div>
    {error && <p id="waitlist-error" className="m-error" role="alert">{error} <Link to="/ios/support">Contact support</Link></p>}
    <p id="waitlist-note" className="m-small">We’ll email you about app access. Read our <Link to="/ios/privacy">privacy policy</Link>.</p>
  </form>;
}

export default function MarketingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="marketing">
    <a href="#main" className="m-skip">Skip to content</a>
    <header className="m-header"><div className="m-container m-nav"><Brand />
      <nav className="m-desktop-nav" aria-label="Main navigation"><a href="#features">The app</a><a href="#screenshots">A closer look</a><a href="#faq">FAQs</a></nav>
      <div className="m-nav-actions"><Link to="/" className="m-web-link">Explore the web app <ArrowUpRight size={15} /></Link><a href="#get-app" className="m-button m-button-small">Get the app <ArrowUpRight size={16} /></a><button className="m-menu-toggle" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button></div>
    </div>{menuOpen && <nav id="mobile-menu" className="m-mobile-nav" aria-label="Mobile navigation" onClick={() => setMenuOpen(false)}><a href="#features">The app</a><a href="#screenshots">A closer look</a><a href="#faq">FAQs</a><Link to="/">Explore the web app ↗</Link></nav>}</header>

    <main id="main">
      <section className="m-hero m-container">
        <div className="m-hero-copy"><p className="m-eyebrow"><span className="m-live-dot" /> FOR THE RIDE. AND EVERYTHING AROUND IT.</p>
          <h1>Less admin.<br />More <span className="m-lime">singletrack.</span></h1>
          <p className="m-intro">Find your next trail. Rally your riding crew. Keep your bike ready for whatever’s around the bend.</p>
          <p className="m-hero-sub">Your mountain biking life, in one little app.</p>
          <div className="m-hero-actions"><a className="m-button" href="#get-app"><Smartphone size={19} /> Get Trail Brew for iPhone <ArrowUpRight size={19} /></a><a className="m-text-link" href="#features">Take a look around <ArrowDown size={16} /></a></div>
          <div className="m-hero-note"><span className="m-sa-flag" aria-hidden="true">↗</span><span>Built for South African dirt.<br /><strong>Starting with Gauteng.</strong></span></div>
        </div>
        <div className="m-hero-art"><div className="m-orbit m-orbit-one" /><div className="m-orbit m-orbit-two" /><span className="m-art-coordinate">26° S / 28° E</span><div className="m-hero-phone-back"><Phone screen="garage" eager /></div><div className="m-hero-phone-front"><Phone screen="trails" eager /></div><div className="m-float-tag"><span><Check size={16} /></span><div>Bike ready.<strong>Weekend sorted.</strong></div></div><span className="m-art-caption">REAL APP. REAL TRAILS. YOUR NEXT RIDE.</span></div>
      </section>

      <div className="m-manifesto"><div className="m-container"><span><Mountain /> FIND YOUR DIRT</span><span><Bike /> BRING YOUR PEOPLE</span><span><Wrench /> LOOK AFTER YOUR BIKE</span><span><Coffee /> EARN YOUR BREW</span></div></div>

      <section id="features" className="m-section m-container">
        <div className="m-section-heading"><div><p className="m-eyebrow">A GOOD RIDE STARTS BEFORE THE TRAILHEAD</p><h2>All the good stuff.<br /><span className="m-muted">Less of the organising.</span></h2></div><p>From “where should we ride?” to “same time next weekend?” — we’ve got a place for it.</p></div>
        <div className="m-feature-grid">
          <article className="m-feature"><div className="m-feature-top"><Compass /><span>01 / DISCOVER</span></div><div className="m-trail-visual" aria-hidden="true"><svg viewBox="0 0 300 135" fill="none"><path d="M-10 112C40 60 70 160 125 83S155 9 200 48s68 22 108-41" stroke="#b8e648" strokeWidth="3" strokeDasharray="5 5" /><circle cx="126" cy="82" r="13" fill="#b8e648" /><circle cx="126" cy="82" r="4" fill="#0c0e0d" /></svg><span className="m-map-label">YOUR NEXT FAVOURITE SPOT</span></div><h3>Your kind of trail.</h3><p>Flowy mornings or a little more technical? Answer four quick questions and find Gauteng trails that suit your riding style.</p><Link to="/trail-finder" className="m-text-link">Try the trail finder <ArrowUpRight size={17} /></Link></article>
          <article className="m-feature"><div className="m-feature-top"><Bike /><span>02 / PLAN</span></div><div className="m-plan-visual" aria-hidden="true"><span className="m-plan-day">SAT<strong>07:00</strong></span><div><span className="m-plan-label">THE WEEKEND PLAN</span><strong>Fresh air. Good company.</strong><span className="m-plan-pill"><ShieldCheck size={12} /> Private until you share</span></div></div><h3>Make a ride of it.</h3><p>Save a trail for the weekend. Keep the plan to yourself, invite your mates with a link, or open it up to the community.</p><a href="#screenshots" className="m-text-link">Meet your riding companion <ArrowRight size={17} /></a></article>
          <article className="m-feature"><div className="m-feature-top"><Wrench /><span>03 / MAINTAIN</span></div><div className="m-service-visual" aria-hidden="true"><div><span>THE GARAGE</span><span className="m-service-status">● Trail-ready</span></div><strong>Good to go.</strong><div className="m-service-bars"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><span>Small checks. More happy kilometres.</span></div><h3>More riding. Less guessing.</h3><p>Give every bike its own garage space. Track component wear, service intervals and invoices, with your ride history doing the counting.</p><a href="#garage" className="m-text-link">Look inside the garage <ArrowRight size={17} /></a></article>
        </div>
      </section>

      <section id="screenshots" className="m-showcase"><div className="m-container">
        <div className="m-section-heading"><div><p className="m-eyebrow">POCKET-SIZED. TRAIL-MINDED.</p><h2>A little less screen time.<br /><span className="m-lime">A lot more outside time.</span></h2></div><p>A quick look at the iPhone app.<br />Made for the bits between the rides.</p></div>
        <div className="m-screen-grid"><figure><div className="m-screen-stage"><span className="m-screen-number">01</span><Phone screen="trails" /></div><figcaption><span>FIND YOUR NEXT RIDE</span><h3>Somewhere new. Or an old favourite.</h3><p>Discover trails, check their riding style and start planning your next outing.</p></figcaption></figure><figure id="garage"><div className="m-screen-stage m-stage-garage"><span className="m-screen-number">02</span><Phone screen="garage" /></div><figcaption><span>KEEP THE WHEELS TURNING</span><h3>A little care goes a long way.</h3><p>One clear view of your bike’s service progress and the components you’re tracking.</p></figcaption></figure><figure><div className="m-screen-stage m-stage-social"><span className="m-screen-number">03</span><Phone screen="social" /></div><figcaption><span>BETTER WITH COMPANY</span><h3>Good trails deserve good company.</h3><p>Make a plan and choose how you share it. Your solo lap can stay a solo lap, too.</p></figcaption></figure></div>
      </div></section>

      <section className="m-details m-container"><div><Heart /><h3>Your rides count.</h3><p>Log a ride by hand or connect Apple Health to import cycling workouts. Put those kilometres to work in your garage.</p></div><div><ShieldCheck /><h3>You choose what’s shared.</h3><p>Personal plans start private. Health access is optional. You decide when to invite others along.</p></div><div><Coffee /><h3>Built around the whole ride.</h3><p>The trail search, the weekend plan, the bike check. More room for the bit you came for — and the coffee after.</p></div></section>

      <section id="faq" className="m-faq m-container m-section"><div><p className="m-eyebrow">BEFORE YOU CLIP IN</p><h2>A few good<br />questions.</h2><p>Something else on your mind?</p><Link to="/ios/support" className="m-text-link">Talk to us <ArrowUpRight size={17} /></Link></div><div className="m-faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<Plus size={20} aria-hidden="true" /></summary><p>{answer}</p></details>)}</div></section>

      <section id="get-app" className="m-get-app m-container"><div className="m-cta-art" aria-hidden="true"><Mountain strokeWidth={0.7} /></div><div className="m-cta-copy"><p className="m-eyebrow">THE NEXT GOOD RIDE STARTS HERE</p><h2>Your bike’s calling.<br /><span className="m-lime">Let’s get you out there.</span></h2><p>{appStoreUrl ? 'Take Trail Brew along for the ride.' : 'Join the iPhone TestFlight waiting list. We’ll send you an invite as spots open up.'}</p>{appStoreUrl ? <a className="m-button" href={appStoreUrl}><Smartphone size={20} /> Download on the App Store <ArrowUpRight size={18} /></a> : <Waitlist />}</div></section>
    </main>

    <footer className="m-footer m-container"><div className="m-footer-top"><div><Brand /><p>Good trails. Good people. A well-earned brew.</p></div><nav aria-label="Footer navigation"><Link to="/trail-finder">Trail finder <ArrowUpRight size={14} /></Link><Link to="/ios/support">Support</Link><Link to="/ios/privacy">Privacy</Link></nav></div><div className="m-footer-bottom"><span>© {new Date().getFullYear()} Trail Brew</span><span>MADE FOR THE WAY WE RIDE. <span className="m-lime">↗</span></span><span>Gauteng, South Africa</span></div></footer>
  </div>;
}
