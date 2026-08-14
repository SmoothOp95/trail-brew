import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { onboardingSteps } from '../../data/onboardingQuestions';
import { isValidSAPhoneNumber } from '../../utils/phoneNumber';
import OnboardingLayout from './OnboardingLayout';
import InputStep from './steps/InputStep';
import SingleSelectStep from './steps/SingleSelectStep';
import TrailMultiSelectStep from './steps/TrailMultiSelectStep';
import EmergencyContactStep from './steps/EmergencyContactStep';

function isStepValid(step, answers) {
  switch (step.kind) {
    case 'text':
    case 'textarea':
      return !step.required || Boolean((answers[step.id] || '').trim());
    case 'tel':
      if (!step.required && !answers[step.id]) return true;
      return isValidSAPhoneNumber(answers[step.id] || '');
    case 'single-select':
      return !step.required || Boolean(answers[step.id]);
    case 'trail-multiselect':
      return true;
    case 'emergency-contact':
      return (
        Boolean((answers.emergencyContactName || '').trim()) &&
        isValidSAPhoneNumber(answers.emergencyContactNumber || '')
      );
    default:
      return true;
  }
}

/**
 * One-question-per-screen onboarding wizard (Sections A-E). Collects raw
 * answers only — Firestore writes and normalization happen in the parent
 * via `onSubmit`, keeping this component free of Firebase concerns.
 *
 * @param {{ initialDisplayName?: string, onSubmit: (answers: object) => Promise<void> }} props
 */
export default function OnboardingSurvey({ initialDisplayName, onSubmit }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({ displayName: initialDisplayName || '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const step = onboardingSteps[stepIndex];
  const isLastStep = stepIndex === onboardingSteps.length - 1;
  const progress = ((stepIndex + 1) / onboardingSteps.length) * 100;
  const autoAdvance = step.kind === 'single-select' && !step.options.some((o) => o.reveal);

  const updateAnswers = (patch) => setAnswers((prev) => ({ ...prev, ...patch }));

  const advance = async (currentAnswers) => {
    if (!isLastStep) {
      setStepIndex((i) => i + 1);
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      await onSubmit(currentAnswers);
      // On success the parent navigates away — leave `submitting` true so
      // the button stays in its loading state rather than flashing back.
    } catch (err) {
      setSubmitting(false);
      setSubmitError(err?.message || 'Something went wrong — please try again.');
    }
  };

  const handleContinue = () => {
    if (!isStepValid(step, answers)) return;
    advance(answers);
  };

  const handleAutoAdvanceSelect = (patch) => {
    const merged = { ...answers, ...patch };
    setAnswers(merged);
    setTimeout(() => advance(merged), 300);
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setSubmitError(null);
      setStepIndex((i) => i - 1);
    }
  };

  const renderBody = () => {
    switch (step.kind) {
      case 'text':
      case 'tel':
      case 'textarea':
        return (
          <InputStep
            step={step}
            value={answers[step.id]}
            onChange={(v) => updateAnswers({ [step.id]: v })}
          />
        );
      case 'single-select':
        return (
          <SingleSelectStep
            step={step}
            answers={answers}
            updateAnswers={updateAnswers}
            onSelectComplete={autoAdvance ? handleAutoAdvanceSelect : null}
          />
        );
      case 'trail-multiselect':
        return (
          <TrailMultiSelectStep
            value={answers.trailsRiddenIds}
            onChange={(v) => updateAnswers({ trailsRiddenIds: v })}
          />
        );
      case 'emergency-contact':
        return <EmergencyContactStep answers={answers} updateAnswers={updateAnswers} />;
      default:
        return null;
    }
  };

  return (
    <OnboardingLayout
      key={step.id}
      section={step.section}
      title={step.title}
      progress={progress}
      onBack={stepIndex > 0 ? handleBack : null}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleContinue();
        }}
      >
        {renderBody()}

        {!autoAdvance && (
          <div className="mt-8">
            <button
              type="submit"
              disabled={!isStepValid(step, answers) || submitting}
              className="w-full sm:w-auto bg-brew-accent hover:bg-[#D4F27A] text-brew-bg font-bold text-sm px-7 py-3 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {isLastStep ? "Let's go 🚵" : 'Continue →'}
            </button>
            {submitError && <p className="text-xs text-red-400 mt-3">{submitError}</p>}
          </div>
        )}
      </form>
    </OnboardingLayout>
  );
}
