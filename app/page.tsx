'use client';

import { useState, useEffect } from 'react';
import { CrawlerService } from '@/services/crawler';
import { FetcherService } from '@/services/fetcher';
import { db } from '@/services/database';
import { SelectorConfig } from '@/services/config';
import SelectorConfigComponent from '@/components/SelectorConfig';
import { FiChevronLeft, FiChevronRight, FiTrash2, FiFileText } from 'react-icons/fi';
import 'prismjs/components/prism-markup';
import 'prismjs/themes/prism.css';
import prettier from 'prettier/standalone';
import parserHtml from 'prettier/parser-html';
import MonacoEditor from '@monaco-editor/react';

interface Question {
  id: string;
  questionNumber: string;
  questionText: string;
  answers: {
    label: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation?: string;
  paragraph?: string;
  hasMultipleCorrect?: boolean;
  image?: string;
}

type InputMethod = 'url' | 'html';

// Hàm format HTML
function formatHtml(html: string) {
  return prettier.format(html, {
    parser: 'html',
    plugins: [parserHtml],
  });
}

export default function Home() {
  const [inputMethod, setInputMethod] = useState<InputMethod>('url');
  const [url, setUrl] = useState('');
  const [html, setHtml] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customConfig, setCustomConfig] = useState<SelectorConfig | null>(null);
  const [htmlHistory, setHtmlHistory] = useState<{ name: string; html: string }[]>([]);
  const [historyName, setHistoryName] = useState('');
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('htmlHistory');
    if (stored) {
      setHtmlHistory(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('htmlHistory', JSON.stringify(htmlHistory));
  }, [htmlHistory]);

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
        const extractedQuestions = await CrawlerService.extractQuestions(content, url, customConfig);
        await db.saveQuestions(extractedQuestions);
      } else {
        content = html;
        const extractedQuestions = await CrawlerService.extractQuestions(content, undefined, customConfig);
        await db.saveQuestions(extractedQuestions);
      }
      await loadQuestions();
    } catch (error) {
      console.error('Error processing content:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    await db.deleteDatabase();
    setQuestions([]);
    setError(null);
  };

  const handleClearForm = () => {
    setUrl('');
    setHtml('');
    setCustomConfig(null);
    setError(null);
  };

  const handleExportJSON = () => {
    const exportData = questions.map(q => ({
      text: q.questionText,
      explanation: q.explanation,
      paragraph: {
        text: q.paragraph,
      },
      image: q.image || "",
      answers: q.answers.map(a => ({
        text: a.text,
        correct: a.isCorrect
      }))
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveHtmlHistory = () => {
    if (!historyName.trim() || !html.trim()) return;
    setHtmlHistory(prev => [{ name: historyName, html }, ...prev]);
    setHistoryName('');
  };

  const handleSelectHistory = (index: number) => {
    setSelectedHistoryIndex(index);
    setHtml(htmlHistory[index].html);
    setHistoryName(htmlHistory[index].name);
    setError(null);
  };

  const handleDeleteHistory = (index: number) => {
    setHtmlHistory(prev => prev.filter((_, i) => i !== index));
    if (selectedHistoryIndex === index) {
      setSelectedHistoryIndex(null);
      setHtml('');
      setHistoryName('');
    }
  };

  return (
    <div className="min-h-screen p-8 flex">
      {/* Sidebar */}
      {sidebarOpen ? (
        <div className="w-64 mr-8 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 rounded-lg shadow-lg relative transition-all duration-300">
          <button
            className="absolute -right-4 top-4 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-full shadow p-1 hover:bg-gray-100 dark:hover:bg-gray-800 z-10"
            onClick={() => setSidebarOpen(false)}
            title="Ẩn sidebar"
          >
            <FiChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-bold mb-4 px-4 pt-4">HTML History</h2>
          <ul className="space-y-2 px-2 pb-4 overflow-y-auto max-h-[70vh]">
            {htmlHistory.length === 0 && (
              <li className="text-gray-400 px-4 py-2">No history</li>
            )}
            {htmlHistory.map((item, idx) => (
              <li
                key={idx}
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer group transition-all duration-150 border border-transparent ${selectedHistoryIndex === idx ? 'bg-blue-50 dark:bg-blue-900 border-blue-300 dark:border-blue-700 shadow' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                onClick={() => handleSelectHistory(idx)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FiFileText className="text-blue-400 flex-shrink-0" />
                  <span className="truncate max-w-[100px] font-medium" title={item.name}>{item.name}</span>
                </div>
                <button
                  className="ml-2 text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900"
                  onClick={e => { e.stopPropagation(); handleDeleteHistory(idx); }}
                  title="Delete"
                >
                  <FiTrash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <button
          className="w-8 h-16 flex items-center justify-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-r-lg shadow-lg mr-2 mt-8 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
          onClick={() => setSidebarOpen(true)}
          title="Hiện sidebar"
        >
          <FiChevronRight size={20} />
        </button>
      )}
      {/* Main content */}
      <div className="flex-1">
        <h1 className="text-3xl font-bold mb-8">Question Crawler</h1>
        <div className="mb-8">
          <div className="flex border-b mb-4">
            <button
              className={`px-4 py-2 ${inputMethod === 'url'
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
              className={`px-4 py-2 ${inputMethod === 'html'
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
                <button
                  type="button"
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={() => formatHtml(html).then(setHtml)}
                >
                  Format HTML
                </button>
                <div className="mt-2 border rounded p-2">
                  <MonacoEditor
                    height="400px"
                    defaultLanguage="html"
                    value={html}
                    onChange={value => setHtml(value || '')}
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Enter name to save..."
                    className="flex-1 p-2 border rounded"
                    value={historyName}
                    onChange={e => setHistoryName(e.target.value)}
                  />
                  <button
                    type="button"
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    onClick={handleSaveHtmlHistory}
                    disabled={!historyName.trim() || !html.trim()}
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
            <div className="mb-4">
              <SelectorConfigComponent
                onConfigChange={setCustomConfig}
                initialConfig={customConfig || undefined}
              />
            </div>
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
                onClick={handleClearForm}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Clear Form
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Clear All Data
              </button>
              <button
                type="button"
                onClick={handleExportJSON}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Export JSON
              </button>
            </div>
          </form>
        </div>
        <div className="space-y-6">
          {questions.map((question) => (
            <div key={question.id} className="border rounded p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold">{question.questionNumber}</h3>
                {question.hasMultipleCorrect && (
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Multiple correct answers
                  </span>
                )}
              </div>
              <p className="mb-4" dangerouslySetInnerHTML={{ __html: question.questionText }} />
              <ul className="space-y-2">
                {question.answers.map((answer, index) => (
                  <li
                    key={index}
                    className={`p-2 rounded ${answer.isCorrect ? 'dark:bg-green-600 bg-green-50' : 'dark:bg-gray-800 bg-gray-200'}`}
                    dangerouslySetInnerHTML={{ __html: answer.text }}
                  />
                ))}
              </ul>
              {question.explanation && (
                <div className="mt-4 p-3 bg-yellow-50 rounded">
                  <p className="font-medium text-yellow-800">Explanation:</p>
                  <p className="text-yellow-700" dangerouslySetInnerHTML={{ __html: question.explanation }} />
                </div>
              )}
              {question.paragraph && (
                <div className="mt-2 p-3 bg-gray-50 rounded">
                  <p className="text-gray-700" dangerouslySetInnerHTML={{ __html: question.paragraph }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
