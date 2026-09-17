import { Link } from 'react-router-dom';

const supportEmail = 'scouts-levels35@icloud.com';

function PublicShell({ children, title, eyebrow }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-brew-bg px-5 py-10 text-brew-text sm:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-1/2 top-[-300px] h-[900px] w-[900px] -translate-x-1/2 bg-[radial-gradient(circle,rgba(184,230,72,0.07),transparent_65%)]"
      />
      <div className="mx-auto max-w-3xl">
        <header className="relative mb-14 flex items-center justify-between gap-4 border-b border-brew-border pb-5">
          <Link className="flex items-center gap-2 text-xl font-black tracking-tight" to="/">
            <span aria-hidden="true">🏔️</span>
            <span className="bg-gradient-to-br from-brew-accent to-[#D4F27A] bg-clip-text text-transparent">Trail Brew</span>
          </Link>
          <nav aria-label="Public information" className="flex gap-4 font-mono text-[11px] uppercase tracking-wider text-brew-text-dim">
            <Link className="transition hover:text-brew-accent" to="/support">Support</Link>
            <Link className="transition hover:text-brew-accent" to="/privacy">Privacy</Link>
          </nav>
        </header>
        <p className="relative mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-brew-accent">{eyebrow}</p>
        <h1 className="relative mb-8 text-4xl font-black leading-[0.95] tracking-tighter sm:text-6xl">{title}</h1>
        <div className="relative space-y-7 text-base leading-7 text-brew-text-dim">{children}</div>
      </div>
    </main>
  );
}

export function SupportPage() {
  return (
    <PublicShell eyebrow="We’re here to help" title="Trail Brew support">
      <p>Need help with Trail Brew, have feedback, or want to report a problem? Email us and include the device and iOS version you’re using, plus a short description of what happened.</p>
      <p>
        <a className="font-medium text-brew-accent underline underline-offset-4 transition hover:text-[#D4F27A]" href={`mailto:${supportEmail}`}>{supportEmail}</a>
      </p>
      <section className="space-y-3">
        <h2 className="mb-2 text-xl font-bold tracking-tight text-brew-text">Apple Health</h2>
        <p>Apple Health access is optional. You can keep logging rides manually if you prefer not to connect Health, and you can change Health permissions at any time in the Health app.</p>
      </section>
      <section className="space-y-3">
        <h2 className="mb-2 text-xl font-bold tracking-tight text-brew-text">Your ride data</h2>
        <p>Trail Brew is designed to keep your ride history on your device. Please contact us before deleting the app if you need help recovering or understanding local ride data.</p>
      </section>
    </PublicShell>
  );
}

export function PrivacyPage() {
  return (
    <PublicShell eyebrow="Effective 17 September 2026" title="Privacy policy">
      <p>Trail Brew helps riders log rides, track bike service, and discover trails. This policy explains how the Trail Brew iOS app and website handle information.</p>
      <section className="space-y-3">
        <h2 className="mb-2 text-xl font-bold tracking-tight text-brew-text">Information in the iOS app</h2>
        <p>The iOS app stores the bike, ride, service, and trail information you create locally on your device. If you choose to connect Apple Health, Trail Brew reads cycling workout distance and duration and can save rides you log back to Apple Health. Apple Health access is optional and can be changed in the Health app.</p>
        <p>Trail Brew does not require an account for the iOS app and does not use your Apple Health data for advertising or sell it to third parties.</p>
      </section>
      <section className="space-y-3">
        <h2 className="mb-2 text-xl font-bold tracking-tight text-brew-text">Information on this website</h2>
        <p>The website may use Firebase Authentication and Cloud Firestore for website features such as sign-in, trail preferences, and an optional TestFlight waiting list. When you provide an email address for the waiting list, it is used to contact you about Trail Brew access. Website data is handled through Firebase services.</p>
      </section>
      <section className="space-y-3">
        <h2 className="mb-2 text-xl font-bold tracking-tight text-brew-text">Sharing and retention</h2>
        <p>We do not sell personal information. We share information only with service providers needed to operate the website, such as Firebase, or when required by law. You can ask us about, correct, or request deletion of information you supplied through the website.</p>
      </section>
      <section className="space-y-3">
        <h2 className="mb-2 text-xl font-bold tracking-tight text-brew-text">Contact</h2>
        <p>For privacy questions or requests, email <a className="font-medium text-brew-accent underline underline-offset-4 transition hover:text-[#D4F27A]" href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>
      </section>
      <section className="space-y-3">
        <h2 className="mb-2 text-xl font-bold tracking-tight text-brew-text">Changes to this policy</h2>
        <p>We may update this policy as Trail Brew changes. The effective date at the top of this page will be updated when we do.</p>
      </section>
    </PublicShell>
  );
}
