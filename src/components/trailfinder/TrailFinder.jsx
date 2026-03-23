import { useState, useCallback } from 'react';
import SurveyScreen from '../survey/SurveyScreen';
import ResultsScreen from '../results/ResultsScreen';
import { trails } from '../../data/trails';
import { useTrailScoring } from '../../hooks/useTrailScoring';

export default function TrailFinder() {
  const [view, setView] = useState('survey'); // 'survey' | 'results'
  const [answers, setAnswers] = useState({});

  const { scored, matched, threshold } = useTrailScoring(trails, answers);

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
      threshold={threshold}
      onRetake={handleRetake}
    />
  );
}
