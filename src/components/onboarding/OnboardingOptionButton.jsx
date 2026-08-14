export default function OnboardingOptionButton({ label, isSelected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative w-full text-left overflow-hidden rounded-xl border-[1.5px] px-5 py-4
        transition-all duration-200 cursor-pointer
        ${
          isSelected
            ? 'border-brew-accent bg-brew-accent/[0.06]'
            : 'border-brew-border bg-brew-card hover:border-brew-accent hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(184,230,72,0.08)]'
        }
      `}
    >
      <span className="font-medium text-[15px] text-brew-text relative block leading-snug">
        {label}
      </span>
    </button>
  );
}
