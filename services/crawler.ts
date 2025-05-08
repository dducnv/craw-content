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
  image?: string;
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
      // Lấy HTML câu hỏi từ questionTextSelector bên trong block nếu có
      let questionText = '';
      const questionTextElem = element.querySelector(questionTextSelector);
      if (questionTextElem) {
        questionText = questionTextElem.innerHTML.trim() || '';
      } else {
        questionText = element.innerHTML.trim() || '';
      }
      
      const correctAnswers = element.querySelectorAll(correctSelector);
      const incorrectAnswers = element.querySelectorAll(incorrectSelector);
      
      const answers: { label: string; text: string; isCorrect: boolean }[] = [];
      
      correctAnswers.forEach((answer, i) => {
        let text = answer.innerHTML.trim() || '';
        // Bỏ tiền tố ABCD. hoặc số thứ tự ở đầu (chỉ với text, không ảnh hưởng đến HTML)
        text = text.replace(/^[A-D]\.?\s+|^\d+\.?\s+/i, '');
        // Thêm dấu chấm ở cuối nếu chưa có (chỉ với text, không ảnh hưởng đến HTML)
        if (text && !text.replace(/<[^>]+>/g, '').trim().endsWith('.')) {
          text = text.trim() + '.';
        }
        // Viết hoa chữ cái đầu dòng (chỉ với text, không ảnh hưởng đến HTML)
        if (text) {
          text = text.charAt(0).toUpperCase() + text.slice(1);
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
        let text = answer.innerHTML.trim() || '';
        text = text.replace(/^[A-D]\.?\s+|^\d+\.?\s+/i, '');
        if (text && !text.replace(/<[^>]+>/g, '').trim().endsWith('.')) {
          text = text.trim() + '.';
        }
        if (text) {
          text = text.charAt(0).toUpperCase() + text.slice(1);
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
        explanation = element.querySelector(explanationSelector)?.innerHTML.trim() || '';
      } else {
        // Tìm explanation trong text của block nếu không có selector riêng
        const blockHtml = element.innerHTML || '';
        const match = blockHtml.match(/Explanation:(.*)$/i);
        if (match) {
          explanation = match[1].trim();
        }
      }

      let paragraph: string | undefined = undefined;
      if (paragraphSelector && element.querySelector(paragraphSelector)) {
        paragraph = element.querySelector(paragraphSelector)?.innerHTML.trim();
      }

      // Lấy image nếu có
      let image: string | undefined = undefined;
      if (config.image) {
        const imgElem = element.querySelector(config.image);
        if (imgElem && imgElem instanceof HTMLImageElement) {
          image = imgElem.src;
        } else if (imgElem) {
          // Nếu không phải <img> nhưng có background-image
          const bg = (imgElem as HTMLElement).style.backgroundImage;
          if (bg && bg.startsWith('url(')) {
            image = bg.slice(4, -1).replace(/['"]/g, '');
          }
        }
      }

      questions.push({
        id: `${index + 1}`,
        questionNumber: `Question ${index + 1}`,
        questionText,
        answers,
        explanation,
        paragraph,
        hasMultipleCorrect: correctAnswers.length > 1,
        image
      });
    });

    return questions;
  }
} 