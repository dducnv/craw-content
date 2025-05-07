'use client';

import { useState, useEffect } from 'react';
import { SelectorConfig } from '@/services/config';

interface SelectorConfigProps {
  onConfigChange: (config: SelectorConfig) => void;
  initialConfig?: SelectorConfig;
}

export default function SelectorConfigComponent({ onConfigChange, initialConfig }: SelectorConfigProps) {
  const [config, setConfig] = useState<SelectorConfig>(initialConfig || {
    questionText: '',
    answers: {
      correct: '',
      incorrect: ''
    },
    explanation: '',
    paragraph: ''
  });

  useEffect(() => {
    onConfigChange(config);
  }, [config, onConfigChange]);

  const handleChange = (field: string, value: string) => {
    if (field.startsWith('answers.')) {
      const answerField = field.split('.')[1];
      setConfig(prev => ({
        ...prev,
        answers: {
          ...prev.answers,
          [answerField]: value
        }
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <div className="border rounded p-4 bg-gray-800">
      <h3 className="text-lg font-medium mb-4 text-gray-50">Selector Configuration</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-50 mb-1">
            Question Text Selector
          </label>
          <input
            type="text"
            value={config.questionText}
            onChange={(e) => handleChange('questionText', e.target.value)}
            className="w-full p-2 border rounded bg-gray-700 text-gray-50"
            placeholder="e.g., .question-text"
          />
        </div>

        <div className="border-t border-gray-700 pt-4">
          <h4 className="font-medium mb-2 text-gray-50">Answer Selectors</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-50 mb-1">
                Correct Answer Selector
              </label>
              <input
                type="text"
                value={config.answers.correct}
                onChange={(e) => handleChange('answers.correct', e.target.value)}
                className="w-full p-2 border rounded bg-gray-700 text-gray-50"
                placeholder="e.g., .correct"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-50 mb-1">
                Incorrect Answer Selector
              </label>
              <input
                type="text"
                value={config.answers.incorrect}
                onChange={(e) => handleChange('answers.incorrect', e.target.value)}
                className="w-full p-2 border rounded bg-gray-700 text-gray-50"
                placeholder="e.g., .answer:not(.correct)"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4">
          <h4 className="font-medium mb-2 text-gray-50">Optional Selectors</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-50 mb-1">
                Explanation
              </label>
              <input
                type="text"
                value={config.explanation}
                onChange={(e) => handleChange('explanation', e.target.value)}
                className="w-full p-2 border rounded bg-gray-700 text-gray-50"
                placeholder="e.g., .explanation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-50 mb-1">
                Paragraph
              </label>
              <input
                type="text"
                value={config.paragraph}
                onChange={(e) => handleChange('paragraph', e.target.value)}
                className="w-full p-2 border rounded bg-gray-700 text-gray-50"
                placeholder="e.g., .paragraph"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 