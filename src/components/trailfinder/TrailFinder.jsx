import { useState, useCallback } from 'react';
import SurveyScreen from '../survey/SurveyScreen';
import ResultsScreen from '../results/ResultsScreen';
import { useTrails } from '../../hooks/useTrails';
import { useTrailScoring } from '../../hooks/useTrailScoring';

export default function TrailFinder() {
  const [view, setView] = useState('survey'); // 'survey' | 'results'
  const [answers, setAnswers] = useState({});

  const { trails } = useTrails();
  const { scored, matched } = useTrailScoring(trails, answers);

  const handleSurveyComplete = useCallback((surveyAnswers) => {
    setAnswers(surveyAnswers);
    setView('results');
  }, []);

  const handleRetake = useCallback(() => {
    setAnswers({});
    setView('survey');
  }, []);

  if (view === 'survey') {
    return <SurveyScreen onComplete={handleSurveyComplete} />;
  }

  return (
    <ResultsScreen
      scored={scored}
      matched={matched}
      answers={answers}
      onRetake={handleRetake}
    />
  );
}
