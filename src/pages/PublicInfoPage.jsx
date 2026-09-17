import { Link } from 'react-router-dom';

const supportEmail = 'scouts-levels35@icloud.com';

function PublicShell({ children, title, eyebrow }) {
  return (
    <main className="min-h-screen bg-[#0C0E0D] px-5 py-10 text-[#E8EDE9] sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-14 flex items-center justify-between gap-4">
          <Link className="text-xl font-semibold tracking-tight text-[#E8EDE9]" to="/">Trail Brew</Link>
          <nav className="flex gap-4 text-sm text-[#AAB4AE]">
            <Link className="hover:text-[#E8EDE9]" to="/support">Support</Link>
            <Link className="hover:text-[#E8EDE9]" to="/privacy">Privacy</Link>
          </nav>
        </header>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#E67E22]">{eyebrow}</p>
        <h1 className="mb-8 text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        <div className="space-y-7 text-base leading-7 text-[#C8D0CB]">{children}</div>
      </div>
    </main>
  );
}

export function SupportPage() {
  return (
    <PublicShell eyebrow="We’re here to help" title="Trail Brew support">
      <p>Need help with Trail Brew, have feedback, or want to report a problem? Email us and include the device and iOS version you’re using, plus a short description of what happened.</p>
      <p>
        <a className="font-medium text-[#F39C4A] underline underline-offset-4" href={`mailto:${supportEmail}`}>{supportEmail}</a>
      </p>
      <section>
        <h2 className="mb-2 text-xl font-semibold text-[#E8EDE9]">Apple Health</h2>
        <p>Apple Health access is optional. You can keep logging rides manually if you prefer not to connect Health, and you can change Health permissions at any time in the Health app.</p>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-semibold text-[#E8EDE9]">Your ride data</h2>
        <p>Trail Brew is designed to keep your ride history on your device. Please contact us before deleting the app if you need help recovering or understanding local ride data.</p>
      </section>
    </PublicShell>
  );
}

export function PrivacyPage() {
  return (
    <PublicShell eyebrow="Effective 17 September 2026" title="Privacy policy">
      <p>Trail Brew helps riders log rides, track bike service, and discover trails. This policy explains how the Trail Brew iOS app and website handle information.</p>
      <section>
        <h2 className="mb-2 text-xl font-semibold text-[#E8EDE9]">Information in the iOS app</h2>
        <p>The iOS app stores the bike, ride, service, and trail information you create locally on your device. If you choose to connect Apple Health, Trail Brew reads cycling workout distance and duration and can save rides you log back to Apple Health. Apple Health access is optional and can be changed in the Health app.</p>
        <p>Trail Brew does not require an account for the iOS app and does not use your Apple Health data for advertising or sell it to third parties.</p>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-semibold text-[#E8EDE9]">Information on this website</h2>
        <p>The website may use Firebase Authentication and Cloud Firestore for website features such as sign-in, trail preferences, and an optional TestFlight waiting list. When you provide an email address for the waiting list, it is used to contact you about Trail Brew access. Website data is handled through Firebase services.</p>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-semibold text-[#E8EDE9]">Sharing and retention</h2>
        <p>We do not sell personal information. We share information only with service providers needed to operate the website, such as Firebase, or when required by law. You can ask us about, correct, or request deletion of information you supplied through the website.</p>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-semibold text-[#E8EDE9]">Contact</h2>
        <p>For privacy questions or requests, email <a className="font-medium text-[#F39C4A] underline underline-offset-4" href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-semibold text-[#E8EDE9]">Changes to this policy</h2>
        <p>We may update this policy as Trail Brew changes. The effective date at the top of this page will be updated when we do.</p>
      </section>
    </PublicShell>
  );
}
