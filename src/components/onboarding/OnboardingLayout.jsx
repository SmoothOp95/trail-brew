export default function OnboardingLayout({
  section,
  title,
  progress,
  onBack,
  children,
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 relative">
      {/* Glow */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(184,230,72,0.15),transparent_70%)] pointer-events-none opacity-50" />

      {/* Brand */}
      <div className="text-center mb-10 relative">
        <span className="text-4xl block mb-2">⛰️</span>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tighter leading-none bg-gradient-to-br from-brew-accent to-[#D4F27A] bg-clip-text text-transparent">
          Trail Brew
        </h1>
      </div>

      <div className="max-w-[560px] w-full relative">
        <div className="animate-fade-slide">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="font-mono text-[11px] text-brew-text-dim hover:text-brew-accent transition-colors uppercase tracking-wider mb-4"
            >
              ← Back
            </button>
          )}
          <p className="font-mono text-[11px] text-brew-accent uppercase tracking-[3px] mb-3">
            {section}
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 leading-snug">{title}</h2>

          {children}
        </div>

        {/* Progress bar */}
        <div className="w-full h-[3px] bg-brew-border rounded-full mt-10 overflow-hidden">
          <div
            className="h-full bg-brew-accent rounded-full transition-all duration-400"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
