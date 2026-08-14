import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getUserProfile, hasCompletedSurvey, fetchCommunityConfig } from '../services/onboardingService';

/**
 * Shared "has this rider already joined?" status for UI surfaces outside
 * the /join flow itself (homepage hero CTA, sidebar nav item). Once a
 * signed-in user has completed the onboarding survey, these surfaces swap
 * from "come join" to "here's the WhatsApp group" — this hook is the one
 * place that combines auth state + profile completion + the invite link.
 *
 * @returns {{ loading: boolean, completed: boolean, whatsappUrl: string|null }}
 */
export function useJoinStatus() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState(null);

  useEffect(() => {
    if (user === undefined) return; // auth state still resolving

    if (!user) {
      setLoading(false);
      setCompleted(false);
      setWhatsappUrl(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getUserProfile(user.uid)
      .then(async (profile) => {
        if (cancelled) return;
        const done = hasCompletedSurvey(profile);
        setCompleted(done);
        if (done) {
          const config = await fetchCommunityConfig();
          if (!cancelled) setWhatsappUrl(config?.whatsappGeneralInviteUrl || null);
        }
      })
      .catch(() => {
        if (!cancelled) setCompleted(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { loading, completed, whatsappUrl };
}
