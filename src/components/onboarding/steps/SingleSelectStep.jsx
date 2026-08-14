import OnboardingOptionButton from '../OnboardingOptionButton';

export default function SingleSelectStep({ step, answers, updateAnswers, onSelectComplete }) {
  const selectedValue = answers[step.id];
  const selectedOption = step.options.find((o) => o.value === selectedValue);

  const handleSelect = (option) => {
    const patch = { [step.id]: option.value };
    // Clear any other option's reveal field so switching answers doesn't
    // leave a stale, hidden value behind.
    step.options.forEach((o) => {
      if (o.reveal && o.value !== option.value) patch[o.reveal.id] = '';
    });

    // Steps with no reveal fields advance immediately on selection; steps
    // with a reveal field wait for the Continue button so there's time to
    // fill in the optional text (see OnboardingSurvey's `autoAdvance`).
    if (onSelectComplete) onSelectComplete(patch);
    else updateAnswers(patch);
  };

  return (
    <div className="space-y-3">
      {step.options.map((option) => (
        <OnboardingOptionButton
          key={option.value}
          label={option.label}
          isSelected={selectedValue === option.value}
          onClick={() => handleSelect(option)}
        />
      ))}

      {selectedOption?.reveal && (
        <div className="pt-1 animate-fade-slide">
          <input
            type="text"
            autoFocus
            value={answers[selectedOption.reveal.id] || ''}
            onChange={(e) => updateAnswers({ [selectedOption.reveal.id]: e.target.value })}
            placeholder={selectedOption.reveal.placeholder}
            className="w-full bg-brew-card border border-brew-border rounded-lg px-4 py-3 text-[15px] text-brew-text placeholder-brew-text-dim focus:outline-none focus:border-brew-accent transition-colors"
          />
          {selectedOption.reveal.helperText && (
            <p className="text-xs text-brew-text-dim mt-2">{selectedOption.reveal.helperText}</p>
          )}
        </div>
      )}
    </div>
  );
}
