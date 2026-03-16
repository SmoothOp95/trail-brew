export default function OptionButton({ emoji, label, desc, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl border-[1.5px] p-5 text-center
        transition-all duration-250 cursor-pointer
        ${
          isSelected
            ? 'border-brew-accent bg-brew-accent/[0.06]'
            : 'border-brew-border bg-brew-card hover:border-brew-accent hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(184,230,72,0.08)]'
        }
      `}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br from-[rgba(184,230,72,0.15)] to-transparent transition-opacity ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      />
      <span className="text-3xl block mb-2 relative">{emoji}</span>
      <span className="font-semibold text-[15px] text-brew-text relative block">
        {label}
      </span>
      <span className="text-xs text-brew-text-dim mt-1 relative block">{desc}</span>
    </button>
  );
}
