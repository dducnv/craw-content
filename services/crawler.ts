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

    for (const [index, element] of Array.from(questionElements).entries()) {
      // Lấy HTML câu hỏi từ questionTextSelector bên trong block nếu có
      let questionText = '';
      const questionTextElem = element.querySelector(questionTextSelector);
      if (questionTextElem) {
        questionText = filterHtmlTags(questionTextElem.innerHTML.trim() || '');
      } else {
        questionText = filterHtmlTags(element.innerHTML.trim() || '');
      }

      const correctAnswers = element.querySelectorAll(correctSelector);
      const incorrectAnswers = element.querySelectorAll(incorrectSelector);

      const answers: { label: string; text: string; isCorrect: boolean }[] = [];

      correctAnswers.forEach((answer, i) => {
        let text = answer.innerHTML.trim() || '';
        text = filterHtmlTags(text)
        text = text.replace(/^(?:[A-Da-d][\.|\)]?\s*|[A-Da-d](?:\s+[A-Da-d])+\s*|\d+[\.|\)]?\s*|\d+\s*)/, '');
        if (text && !text.replace(/<[^>]+>/g, '').trim().endsWith('.')) {
          text = text.trim() + '.';
        }
        if (text) {
          text = text.charAt(0).toUpperCase() + text.slice(1);
        }
        if (text) {
          answers.push({
            label: String.fromCharCode(65 + i),
            text: filterHtmlTags(text),
            isCorrect: true
          });
        }
      });

      incorrectAnswers.forEach((answer, i) => {
        let text = answer.innerHTML.trim() || '';
        text = filterHtmlTags(text)
        text = text.replace(/^(?:[A-Da-d][\.|\)]?\s*|[A-Da-d](?:\s+[A-Da-d])+\s*|\d+[\.|\)]?\s*|\d+\s*)/, '');
        if (text && !text.replace(/<[^>]+>/g, '').trim().endsWith('.')) {
          text = text.trim() + '.';
        }
        if (text) {
          text = text.charAt(0).toUpperCase() + text.slice(1);
        }
        if (text) {
          answers.push({
            label: String.fromCharCode(65 + correctAnswers.length + i),
            text: filterHtmlTags(text),
            isCorrect: false
          });
        }
      });

      let explanation = '';
      if (explanationSelector && element.querySelector(explanationSelector)) {
        explanation = filterHtmlTags(element.querySelector(explanationSelector)?.innerHTML.trim() || '');
      } else {
        // Tìm explanation trong text của block nếu không có selector riêng
        const blockHtml = element.innerHTML || '';
        const match = blockHtml.match(/Explanation:(.*)$/i);
        if (match) {
          explanation = filterHtmlTags(match[1].trim());
        }
      }

      let paragraph: string | undefined = undefined;
      if (paragraphSelector && element.querySelector(paragraphSelector)) {
        paragraph = filterHtmlTags(element.querySelector(paragraphSelector)?.innerHTML.trim() || '');
      }

      // Lấy image nếu có
      let image: string | undefined = undefined;
      if (config.image) {
        const imgElem = element.querySelector(config.image);
        if (imgElem && imgElem instanceof HTMLImageElement && imgElem.src) {
          try {
            const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(imgElem.src);
            image = await imageUrlToBase64(proxyUrl);
          } catch {
            image = imgElem.src; // fallback nếu lỗi
            console.log('Error converting image to base64:', imgElem.src);
          }
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
    }

    return questions;
  }
}

async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function filterHtmlTags(html: string): string {
  const ALLOWED_TAGS = ['br', 'i', 'b', 'u', 'em', 'strong', 'sup', 'sub', 'mark', 'small', 'del', 'ins', 'code'];
  const doc = document.createElement('div');
  doc.innerHTML = html;

  function recursive(node: Element | ChildNode) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      if (!ALLOWED_TAGS.includes(el.tagName.toLowerCase())) {
        // unwrap: replace node with its children
        const parent = el.parentNode;
        while (el.firstChild) {
          parent?.insertBefore(el.firstChild, el);
        }
        parent?.removeChild(el);
        return;
      }
      // Duyệt tiếp các con
      Array.from(el.childNodes).forEach(recursive);
    }
  }

  Array.from(doc.childNodes).forEach(recursive);
  return doc.innerHTML;
} 