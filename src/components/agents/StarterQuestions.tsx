import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { agentApi } from '@/lib/agent-api';

interface StarterQuestionsProps {
  assistantId: string;
  onQuestionClick: (question: string) => void;
  position?: 'above' | 'below';
}

export function StarterQuestions({ 
  assistantId, 
  onQuestionClick, 
  position = 'above'
}: StarterQuestionsProps) {
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAgent = async () => {
      if (!assistantId) return;
      
      try {
        setLoading(true);
        const response = await agentApi.getAgentByAssistantId(assistantId);
        if (response && response.starterQuestions && response.starterQuestions.length > 0) {
          setQuestions(response.starterQuestions);
        } else {
          setQuestions([]);
        }
      } catch (error) {
        console.error('Error fetching starter questions:', error);
        setError('Failed to load starter questions');
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAgent();
  }, [assistantId]);
  
  if (loading) return null;
  if (error || questions.length === 0) return null;
  
  return (
    <div className={`flex flex-col gap-2 w-full max-w-3xl ${
      position === 'above' ? 'mb-6' : 'mt-2 mb-6'
    }`}>
      {position === 'above' && (
        <p className="text-sm text-gray-500 mb-1">Suggested questions:</p>
      )}
      <div className="flex flex-wrap gap-2">
        {questions.map((question, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="rounded-full text-left normal-case font-normal hover:bg-gray-100"
            onClick={() => onQuestionClick(question)}
          >
            {question}
          </Button>
        ))}
      </div>
    </div>
  );
} 