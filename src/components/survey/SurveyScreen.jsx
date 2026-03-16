import { useState, useCallback } from 'react';
import { questions } from '../../data/questions';
import OptionButton from './OptionButton';

export default function SurveyScreen({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);

  const currentQ = questions[step];
  const progress = (step / questions.length) * 100;

  const handleSelect = useCallback(
    (value) => {
      setSelected(value);
      const newAnswers = { ...answers, [currentQ.id]: value };
      setAnswers(newAnswers);

      setTimeout(() => {
        if (step < questions.length - 1) {
          setStep((s) => s + 1);
          setSelected(null);
        } else {
          onComplete(newAnswers);
        }
      }, 350);
    },
    [answers, currentQ, step, onComplete]
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 relative">
      {/* Glow */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(184,230,72,0.15),transparent_70%)] pointer-events-none opacity-50" />

      {/* Brand */}
      <div className="text-center mb-12 relative">
        <span className="text-5xl block mb-3">⛰️</span>
        <h1 className="text-5xl sm:text-6xl font-black tracking-tighter leading-none bg-gradient-to-br from-brew-accent to-[#D4F27A] bg-clip-text text-transparent">
          Trail Brew
        </h1>
        <p className="font-mono text-xs text-brew-text-dim mt-2 tracking-[0.2em] uppercase">
          Gauteng MTB Trail Finder
        </p>
      </div>

      {/* Question */}
      <div className="max-w-[560px] w-full relative">
        <div key={step} className="animate-fade-slide">
          <p className="font-mono text-[11px] text-brew-accent uppercase tracking-[3px] mb-3">
            {currentQ.label}
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 leading-snug">
            {currentQ.title}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQ.options.map((opt) => (
              <OptionButton
                key={opt.value}
                emoji={opt.emoji}
                label={opt.label}
                desc={opt.desc}
                isSelected={selected === opt.value}
                onClick={() => handleSelect(opt.value)}
              />
            ))}
          </div>
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
