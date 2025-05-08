'use client';

import { useState, useEffect } from 'react';
import { SelectorConfig } from '@/services/config';
import React from 'react';

interface SelectorConfigProps {
  onConfigChange: (config: SelectorConfig) => void;
  initialConfig?: SelectorConfig;
}

const LOCAL_KEY = 'selectorConfigList';

type SavedConfig = SelectorConfig & { name: string };

export default function SelectorConfigComponent({ onConfigChange, initialConfig }: SelectorConfigProps) {
  const [config, setConfig] = useState<SelectorConfig>(initialConfig || {
    container: '',
    questionText: '',
    answers: {
      correct: '',
      incorrect: ''
    },
    explanation: '',
    paragraph: '',
    image: ''
  });
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([]);
  const [configName, setConfigName] = useState('');

  // Load saved configs from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      try {
        setSavedConfigs(JSON.parse(raw));
      } catch { }
    }
  }, []);

  // Notify parent on config change
  useEffect(() => {
    onConfigChange(config);
  }, [config, onConfigChange]);

  // Save current config
  const handleSaveConfig = () => {
    if (!configName.trim()) return;
    const newConfig: SavedConfig = { ...config, name: configName.trim() };
    const updated = [...savedConfigs.filter(c => c.name !== newConfig.name), newConfig];
    setSavedConfigs(updated);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
    setConfigName('');
  };

  // Delete a config
  const handleDeleteConfig = (name: string) => {
    const updated = savedConfigs.filter(c => c.name !== name);
    setSavedConfigs(updated);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
  };

  // Apply a config
  const handleApplyConfig = (cfg: SavedConfig) => {
    setConfig({
      container: cfg.container,
      questionText: cfg.questionText,
      answers: { ...cfg.answers },
      explanation: cfg.explanation,
      paragraph: cfg.paragraph,
      image: cfg.image
    });
  };

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

  // Export configs as JSON
  const handleExportConfigs = () => {
    const blob = new Blob([JSON.stringify(savedConfigs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'selector-configs.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import configs from JSON file
  const handleImportConfigs = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          // Gộp với configs hiện tại, ưu tiên tên mới
          const merged = [
            ...savedConfigs.filter(cfg => !imported.some((ic: SavedConfig) => ic.name === cfg.name)),
            ...imported
          ];
          setSavedConfigs(merged);
          localStorage.setItem(LOCAL_KEY, JSON.stringify(merged));
        }
      } catch { }
    };
    reader.readAsText(file);
    // Reset input để có thể import lại cùng file nếu muốn
    e.target.value = '';
  };

  return (
    <div className="border rounded p-4 bg-white dark:bg-gray-800">
      <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-50">Selector Configuration</h3>

      {/* Saved Configs List */}
      <div className="mb-4">
        <div className="flex items-center mb-2 gap-2">
          <input
            type="text"
            value={configName}
            onChange={e => setConfigName(e.target.value)}
            className="p-2 border rounded mr-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-400"
            placeholder="Config name"
          />
          <button
            type="button"
            onClick={handleSaveConfig}
            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Save Config
          </button>

          <button
            type="button"
            onClick={handleExportConfigs}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Export Configs
          </button>
          <label className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-700 cursor-pointer mb-0">
            Import Configs
            <input
              type="file"
              accept="application/json"
              onChange={handleImportConfigs}
              className="hidden"
            />
          </label>
        </div>
        {savedConfigs.length > 0 && (
          <div className="space-y-1">
            {savedConfigs.map(cfg => (
              <div key={cfg.name} className="flex items-center justify-between bg-gray-200 dark:bg-gray-700 rounded px-2 py-1 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600">
                <span onClick={() => handleApplyConfig(cfg)} className="flex-1 text-gray-900 dark:text-gray-50">{cfg.name}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteConfig(cfg.name)}
                  className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">
            Container Selector
          </label>
          <input
            type="text"
            value={config.container}
            onChange={(e) => handleChange('container', e.target.value)}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-400"
            placeholder="e.g., .question"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">
            Question Text Selector
          </label>
          <input
            type="text"
            value={config.questionText}
            onChange={(e) => handleChange('questionText', e.target.value)}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-400"
            placeholder="e.g., .question-text or .questionContent"
          />
        </div>

        <div className="border-t border-gray-300 dark:border-gray-700 pt-4">
          <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-50">Answer Selectors</h4>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">
                Correct Answer Selector
              </label>
              <input
                type="text"
                value={config.answers.correct}
                onChange={(e) => handleChange('answers.correct', e.target.value)}
                className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-400"
                placeholder="e.g., .correct"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">
                Incorrect Answer Selector
              </label>
              <input
                type="text"
                value={config.answers.incorrect}
                onChange={(e) => handleChange('answers.incorrect', e.target.value)}
                className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-400"
                placeholder="e.g., .answer:not(.correct)"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-300 dark:border-gray-700 pt-4">
          <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-50">Optional Selectors</h4>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">
                Explanation
              </label>
              <input
                type="text"
                value={config.explanation}
                onChange={(e) => handleChange('explanation', e.target.value)}
                className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-400"
                placeholder="e.g., .explanation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">
                Paragraph
              </label>
              <input
                type="text"
                value={config.paragraph}
                onChange={(e) => handleChange('paragraph', e.target.value)}
                className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-400"
                placeholder="e.g., .paragraph"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">
            Image Selector
          </label>
          <input
            type="text"
            value={config.image || ''}
            onChange={(e) => handleChange('image', e.target.value)}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-400"
            placeholder="e.g., img, .question-image"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          setConfig({
            container: '',
            questionText: '',
            answers: { correct: '', incorrect: '' },
            explanation: '',
            paragraph: '',
            image: ''
          });
          setConfigName('');
        }}
        className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 mt-2"
      >
        Clear Form
      </button>
    </div>
  );
} 