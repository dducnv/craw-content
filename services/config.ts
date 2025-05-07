export interface SelectorConfig {
  questionText: string;      // Selector cho nội dung câu hỏi
  answers: {
    correct: string;        // Selector cho đáp án đúng
    incorrect: string;      // Selector cho đáp án sai
  };
  explanation?: string;     // Selector cho phần giải thích (optional)
  paragraph?: string;       // Selector cho đoạn văn bản bổ sung (optional)
}

// Cấu hình mặc định cho trang hamexam.org
export const defaultConfig: SelectorConfig = {
  questionText: '.questionText',
  answers: {
    correct: '.correctAnswer',
    incorrect: '.answer:not(.correctAnswer)'
  },
  explanation: '.explanation',
  paragraph: '.paragraph'
};

// Cấu hình cho các trang khác có thể được thêm vào đây
export const configs: Record<string, SelectorConfig> = {
  'hamexam.org': defaultConfig,
  'example.com': {
    questionText: '.question-text',
    answers: {
      correct: '.correct',
      incorrect: '.answer:not(.correct)'
    },
    explanation: '.explanation',
    paragraph: '.paragraph'
  }
}; 