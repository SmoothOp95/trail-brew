import { useState } from 'react';
import { isValidSAPhoneNumber } from '../../../utils/phoneNumber';

const inputClasses =
  'w-full bg-brew-card border border-brew-border rounded-lg px-4 py-3 text-[15px] text-brew-text placeholder-brew-text-dim focus:outline-none focus:border-brew-accent transition-colors';

export default function EmergencyContactStep({ answers, updateAnswers }) {
  const [numberTouched, setNumberTouched] = useState(false);

  const number = answers.emergencyContactNumber || '';
  const showPhoneError = numberTouched && number && !isValidSAPhoneNumber(number);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[11px] font-mono text-brew-text-dim uppercase tracking-wider mb-1.5">
          Name
        </label>
        <input
          type="text"
          autoFocus
          value={answers.emergencyContactName || ''}
          onChange={(e) => updateAnswers({ emergencyContactName: e.target.value })}
          placeholder="Who should we call?"
          className={inputClasses}
        />
      </div>

      <div>
        <label className="block text-[11px] font-mono text-brew-text-dim uppercase tracking-wider mb-1.5">
          Number
        </label>
        <input
          type="tel"
          value={number}
          onChange={(e) => updateAnswers({ emergencyContactNumber: e.target.value })}
          onBlur={() => setNumberTouched(true)}
          placeholder="082 123 4567"
          className={inputClasses}
        />
        {showPhoneError && (
          <p className="text-xs text-red-400 mt-2">
            Enter a valid SA number, e.g. 082 123 4567 or +27 82 123 4567.
          </p>
        )}
      </div>
    </div>
  );
}
