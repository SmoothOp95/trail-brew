import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getUserProfile, hasCompletedSurvey, submitOnboardingSurvey } from '../services/onboardingService';
import OnboardingSurvey from '../components/onboarding/OnboardingSurvey';
import CenteredSpinner from '../components/onboarding/CenteredSpinner';

/**
 * /join/survey — requires a signed-in user with no completed survey yet.
 * Anyone else gets bounced to /join, which knows how to route them
 * correctly (sign-in prompt, or the success screen for re-entry).
 */
export default function JoinSurveyPage() {
  const { user, updateDisplayName } = useAuth();
  const navigate = useNavigate();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  useEffect(() => {
    if (!user) {
      setCheckingProfile(false);
      return;
    }
    let cancelled = false;
    getUserProfile(user.uid)
      .then((profile) => {
        if (!cancelled && hasCompletedSurvey(profile)) setAlreadyCompleted(true);
      })
      .finally(() => {
        if (!cancelled) setCheckingProfile(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSubmit = async (answers) => {
    await submitOnboardingSurvey(user.uid, answers);
    // Syncs the Firebase Auth record's name from Q1 — matters most for
    // email-signup accounts, which start nameless. Best-effort: the survey
    // itself already succeeded above, so a hiccup here shouldn't surface
    // as a submission failure.
    try {
      await updateDisplayName(answers.displayName.trim());
    } catch (err) {
      console.error('[JoinSurveyPage] Failed to sync displayName:', err);
    }
    navigate('/join', { replace: true });
  };

  if (user === undefined || checkingProfile) return <CenteredSpinner />;
  if (!user || alreadyCompleted) return <Navigate to="/join" replace />;

  return <OnboardingSurvey initialDisplayName={user.displayName} onSubmit={handleSubmit} />;
}
