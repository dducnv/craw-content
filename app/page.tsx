'use client';

import { useState, useEffect } from 'react';
import { CrawlerService } from '@/services/crawler';
import { FetcherService } from '@/services/fetcher';
import { db } from '@/services/database';

interface Question {
  id: string;
  questionNumber: string;
  questionText: string;
  answers: {
    label: string;
    text: string;
    isCorrect: boolean;
  }[];
}

type InputMethod = 'url' | 'html';

export default function Home() {
  const [inputMethod, setInputMethod] = useState<InputMethod>('url');
  const [url, setUrl] = useState('');
  const [html, setHtml] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    const savedQuestions = await db.getAllQuestions();
    setQuestions(savedQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let content: string;
      if (inputMethod === 'url') {
        content = await FetcherService.fetchContent(url);
      } else {
        content = html;
      }

      const extractedQuestions = await CrawlerService.extractQuestions(content);
      await db.saveQuestions(extractedQuestions);
      await loadQuestions();
    } catch (error) {
      console.error('Error processing content:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    await db.clearQuestions();
    setQuestions([]);
    setError(null);
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Question Crawler</h1>
      
      <div className="mb-8">
        <div className="flex border-b mb-4">
          <button
            className={`px-4 py-2 ${
              inputMethod === 'url'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500'
            }`}
            onClick={() => {
              setInputMethod('url');
              setError(null);
            }}
          >
            Input URL
          </button>
          <button
            className={`px-4 py-2 ${
              inputMethod === 'html'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500'
            }`}
            onClick={() => {
              setInputMethod('html');
              setError(null);
            }}
          >
            Input HTML
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
            {error.includes('CORS') && (
              <div className="mt-2">
                <p className="font-medium">How to fix:</p>
                <ol className="list-decimal list-inside mt-1">
                  <li>Try using the HTML input method instead</li>
                  <li>Or visit <a href="https://cors-anywhere.herokuapp.com/corsdemo" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">CORS Anywhere Demo</a> to enable the proxy</li>
                </ol>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {inputMethod === 'url' ? (
            <div className="mb-4">
              <label htmlFor="url" className="block mb-2">Enter URL:</label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError(null);
                }}
                className="w-full p-2 border rounded"
                placeholder="https://example.com"
                required
              />
            </div>
          ) : (
            <div className="mb-4">
              <label htmlFor="html" className="block mb-2">Paste HTML content:</label>
              <textarea
                id="html"
                value={html}
                onChange={(e) => {
                  setHtml(e.target.value);
                  setError(null);
                }}
                className="w-full h-48 p-2 border rounded"
                placeholder="Paste your HTML here..."
                required
              />
            </div>
          )}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Extract Questions'}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear All
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        {questions.map((question) => (
          <div key={question.id} className="border rounded p-4">
            <h3 className="font-bold mb-2">{question.questionNumber}</h3>
            <p className="mb-4">{question.questionText}</p>
            <ul className="space-y-2">
              {question.answers.map((answer, index) => (
                <li
                  key={index}
                  className={`p-2 rounded ${
                    answer.isCorrect ? 'bg-green-800' : 'bg-gray-600'
                  }`}
                >
                  <span className="font-medium">{answer.label}</span> {answer.text}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
