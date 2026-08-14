import { useState } from 'react';
import { isValidSAPhoneNumber } from '../../../utils/phoneNumber';

const inputClasses =
  'w-full bg-brew-card border border-brew-border rounded-lg px-4 py-3 text-[15px] text-brew-text placeholder-brew-text-dim focus:outline-none focus:border-brew-accent transition-colors';

export default function InputStep({ step, value, onChange, autoFocus = true }) {
  const [touched, setTouched] = useState(false);

  const showPhoneError =
    step.kind === 'tel' && touched && value && !isValidSAPhoneNumber(value);

  return (
    <div>
      {step.kind === 'textarea' ? (
        <textarea
          autoFocus={autoFocus}
          rows={4}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={step.placeholder}
          className={`${inputClasses} resize-none`}
        />
      ) : (
        <input
          type={step.kind === 'tel' ? 'tel' : 'text'}
          autoFocus={autoFocus}
          autoComplete={step.autoComplete}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={step.placeholder}
          className={inputClasses}
        />
      )}

      {showPhoneError ? (
        <p className="text-xs text-red-400 mt-2">
          Enter a valid SA number, e.g. 082 123 4567 or +27 82 123 4567.
        </p>
      ) : step.helperText ? (
        <p className="text-xs text-brew-text-dim mt-2">{step.helperText}</p>
      ) : null}
    </div>
  );
}
