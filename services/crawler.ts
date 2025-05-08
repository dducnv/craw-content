import { SelectorConfig, defaultConfig, configs } from './config';

export interface Question {
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
}

export class CrawlerService {
  private static getConfig(url: string | undefined, customConfig: SelectorConfig | null): SelectorConfig {
    if (customConfig) {
      return customConfig;
    }
    
    if (url) {
      const domain = new URL(url).hostname;
      const config = configs[domain];
      if (config) {
        return config;
      }
    }
    
    return defaultConfig;
  }

  public static async extractQuestions(
    html: string, 
    url?: string, 
    customConfig: SelectorConfig | null = null
  ): Promise<Question[]> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const config = this.getConfig(url, customConfig);
    
    // Sử dụng selector cha cho block câu hỏi
    const containerSelector = config.container || '.question';
    const questionTextSelector = config.questionText || '.questionText';
    const correctSelector = config.answers.correct || '.correctAnswer';
    const incorrectSelector = config.answers.incorrect || '.answer:not(.correctAnswer)';
    const explanationSelector = config.explanation || '.explanation';
    const paragraphSelector = config.paragraph || '.paragraph';

    const questionElements = doc.querySelectorAll(containerSelector);
    const questions: Question[] = [];

    questionElements.forEach((element, index) => {
      // Lấy text câu hỏi từ questionTextSelector bên trong block nếu có
      let questionText = '';
      const questionTextElem = element.querySelector(questionTextSelector);
      if (questionTextElem) {
        questionText = questionTextElem.textContent?.trim() || '';
      } else {
        questionText = element.textContent?.trim() || '';
      }
      
      const correctAnswers = element.querySelectorAll(correctSelector);
      const incorrectAnswers = element.querySelectorAll(incorrectSelector);
      
      const answers: { label: string; text: string; isCorrect: boolean }[] = [];
      
      correctAnswers.forEach((answer, i) => {
        let text = answer.textContent?.trim() || '';
        // Bỏ tiền tố ABCD. hoặc số thứ tự ở đầu
        text = text.replace(/^[A-D]\.?\s+|^\d+\.?\s+/i, '');
        // Thêm dấu chấm ở cuối nếu chưa có
        if (text && !text.trim().endsWith('.')) {
          text = text.trim() + '.';
        }
        if (text) {
          answers.push({
            label: String.fromCharCode(65 + i),
            text,
            isCorrect: true
          });
        }
      });
      
      incorrectAnswers.forEach((answer, i) => {
        let text = answer.textContent?.trim() || '';
        // Bỏ tiền tố ABCD. hoặc số thứ tự ở đầu
        text = text.replace(/^[A-D]\.?\s+|^\d+\.?\s+/i, '');
        // Thêm dấu chấm ở cuối nếu chưa có
        if (text && !text.trim().endsWith('.')) {
          text = text.trim() + '.';
        }
        if (text) {
          answers.push({
            label: String.fromCharCode(65 + correctAnswers.length + i),
            text,
            isCorrect: false
          });
        }
      });

      let explanation = '';
      if (explanationSelector && element.querySelector(explanationSelector)) {
        explanation = element.querySelector(explanationSelector)?.textContent?.trim() || '';
      } else {
        // Tìm explanation trong text của block nếu không có selector riêng
        const blockText = element.textContent || '';
        const match = blockText.match(/Explanation:(.*)$/i);
        if (match) {
          explanation = match[1].trim();
        }
      }

      const paragraph = element.querySelector(paragraphSelector)?.textContent?.trim();

      questions.push({
        id: `${index + 1}`,
        questionNumber: `Question ${index + 1}`,
        questionText,
        answers,
        explanation,
        paragraph,
        hasMultipleCorrect: correctAnswers.length > 1
      });
    });

    return questions;
  }
} 